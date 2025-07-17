from flask import Flask, request, jsonify
from flask_cors import CORS
from moviepy.editor import VideoFileClip
from supabase import create_client, Client
import tempfile
import os
import logging
import re
import urllib.request
import urllib.parse
from youtube_transcript_api import YouTubeTranscriptApi
from openai import OpenAI
import json
from dotenv import load_dotenv
from io import BytesIO
import requests


# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Supabase credentials
SUPABASE_URL = "https://gkklfyvmhxulxdwjmjxz.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdra2xmeXZtaHh1bHhkd2ptanh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzNDUwNDUsImV4cCI6MjA1OTkyMTA0NX0.bBJGZ1ORgqO0iAIzA4aoJPn9LDgYQ1BdfMj6vO4XaZA"
@app.route('/')
def index():
    return 'Noter-AI backend is live! 🚀'
# OpenAI client
# Use the API key directly since we're having issues with environment variables
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
openai_client = OpenAI(api_key=OPENAI_API_KEY)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_user_from_token(token):
    if not token or not token.startswith('Bearer '):
        return None
    
    try:
        # Remove 'Bearer ' prefix
        jwt_token = token.split(' ')[1]
        # Get user data from Supabase session
        user = supabase.auth.get_user(jwt_token)
        return user.user.id
    except Exception as e:
        logger.error(f"Error getting user from token: {str(e)}")
        return None

def extract_video_id(url):
    """Extract the video ID from various YouTube URL formats."""
    patterns = [
        r'(?:v=|/v/|youtu\.be/|/embed/)([a-zA-Z0-9_-]{11})',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None

def generate_notes_from_transcript(transcript_text):
    """Generate structured notes from transcript text using OpenAI."""
    try:
        logger.info("Starting OpenAI note generation")
        
        # Truncate transcript if it's too long (OpenAI has token limits)
        max_chars = 10000
        if len(transcript_text) > max_chars:
            logger.info(f"Truncating transcript from {len(transcript_text)} to {max_chars} characters")
            transcript_text = transcript_text[:max_chars] + "...[truncated]"
        
        prompt = f"""
        You're a brilliant student writing detailed, easy-to-understand handwritten-style notes for your friend who missed a lecture.

        Your goals:
        - Break down complex concepts into simple terms.
        - Explain *why* each topic is important and how it connects to real-world scenarios.
        - Add relatable examples, analogies, or step-by-step walkthroughs.
        - Avoid technical jargon unless necessary, and explain any such terms when used.
        - Use headings, subheadings, paragraphs, and even short highlight boxes or tips.
        - Make it feel like a helpful study guide, not just a summary.

        Here's the lecture transcription:
        {transcript_text}

        Now, write the notes like a student preparing the best possible study material to revise later or share with a friend.
        """

        logger.info(f"Sending request to OpenAI with API key: {OPENAI_API_KEY[:10]}...")
        
        response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful student assistant creating clear, engaging study notes."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=2000
        )
        
        logger.info("Successfully received response from OpenAI")
        content = response.choices[0].message.content
        logger.info(f"Generated notes of length: {len(content)} characters")
        
        return content
    except Exception as e:
        logger.error(f"Error generating notes with OpenAI: {str(e)}")
        logger.exception("Full exception details:")
        return None

def process_transcription_to_notes(user_id, transcription_filename, transcription_text):
    """Process transcription text to generate notes and save to notes bucket."""
    try:
        logger.info(f"Processing transcription: {transcription_filename}")
        
        # Check if the transcription text is valid
        if not transcription_text or len(transcription_text.strip()) < 10:
            logger.error("Transcription text is too short or empty")
            return False
            
        # Generate notes using OpenAI
        logger.info("Calling OpenAI to generate notes")
        notes = generate_notes_from_transcript(transcription_text)
        
        if not notes:
            logger.error("Failed to generate notes from transcription - OpenAI returned None")
            return False
            
        # Create notes filename
        notes_filename = transcription_filename.replace('.txt', '_notes.txt')
        notes_path = f"{user_id}/{notes_filename}"
        
        # Upload notes to Supabase 'notes' bucket
        logger.info(f"Uploading notes to Supabase: {notes_path}")
        
        # Check if the notes bucket exists
        try:
            buckets = supabase.storage.list_buckets()
            bucket_names = [bucket['name'] for bucket in buckets]
            if 'notes' not in bucket_names:
                logger.info("Creating 'notes' bucket as it doesn't exist")
                supabase.storage.create_bucket('notes')
        except Exception as e:
            logger.warning(f"Error checking/creating 'notes' bucket: {str(e)}")
            # Continue anyway as the bucket might already exist
        
        try:
            # Try to remove existing file if it exists
            supabase.storage.from_('notes').remove([notes_path])
            logger.info("Removed existing notes file")
        except Exception as e:
            logger.info(f"No existing notes file to remove or error: {str(e)}")
            pass
            
        # Convert notes to bytes if it's a string
        if isinstance(notes, str):
            notes_bytes = notes.encode('utf-8')
        else:
            notes_bytes = notes
            
        logger.info(f"Uploading notes of size: {len(notes_bytes)} bytes")
        
        result = supabase.storage.from_('notes').upload(
            notes_path,
            notes_bytes,
            {"contentType": "text/plain"}
        )
        
        if hasattr(result, 'error') and result.error:
            logger.error(f"Error uploading notes: {str(result.error)}")
            return False
            
        logger.info("Successfully uploaded notes to Supabase")
        return True
    except Exception as e:
        logger.error(f"Error processing transcription to notes: {str(e)}")
        logger.exception("Full exception details:")
        return False

@app.route('/convert-youtube', methods=['POST'])
def convert_youtube():
    try:
        auth_header = request.headers.get('Authorization')
        user_id = get_user_from_token(auth_header)
        if not user_id:
            return jsonify({'error': 'Unauthorized - Please login first'}), 401

        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        youtube_url = data.get('url')
        if not youtube_url:
            return jsonify({'error': 'No YouTube URL provided'}), 400

        youtube_url = youtube_url.strip()
        
        # Extract video ID
        video_id = extract_video_id(youtube_url)
        if not video_id:
            return jsonify({'error': 'Invalid YouTube URL format'}), 400
            
        logger.info(f"Processing YouTube URL: {youtube_url}, Video ID: {video_id}")

        try:
            # Create temp directory for processing
            with tempfile.TemporaryDirectory() as temp_dir:
                # Use yt-dlp to download the audio (this is more reliable than pytube)
                output_template = os.path.join(temp_dir, 'audio')
                download_cmd = f'yt-dlp -x --audio-format mp3 --audio-quality 0 -o "{output_template}.%(ext)s" {youtube_url}'
                
                logger.info(f"Running download command: {download_cmd}")
                os.system(download_cmd)
                
                # Find the downloaded file (should be an mp3)
                mp3_file = f"{output_template}.mp3"
                if not os.path.exists(mp3_file):
                    # Try to find any audio file that might have been created
                    for file in os.listdir(temp_dir):
                        if file.startswith('audio') and file.endswith(('.mp3', '.m4a', '.webm')):
                            mp3_file = os.path.join(temp_dir, file)
                            break
                
                if not os.path.exists(mp3_file):
                    return jsonify({'error': 'Failed to download YouTube audio'}), 500
                
                logger.info(f"Downloaded audio file: {mp3_file}")
                
                # Get video title for filename
                title_cmd = f'yt-dlp --get-title {youtube_url}'
                video_title = os.popen(title_cmd).read().strip()
                
                # Sanitize filename
                safe_title = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', video_title)
                safe_filename = f"{safe_title}.mp3"
                
                # Upload to Supabase storage
                logger.info(f"Uploading to Supabase: {safe_filename}")
                with open(mp3_file, 'rb') as f:
                    file_path = f"{user_id}/{safe_filename}"
                    try:
                        # Try to remove existing file if it exists
                        supabase.storage.from_('audio-files').remove([file_path])
                    except:
                        pass
                    
                    result = supabase.storage.from_('audio-files').upload(
                        file_path,
                        f,
                        {"contentType": "audio/mpeg"}
                    )
                    
                    if hasattr(result, 'error') and result.error:
                        return jsonify({'error': str(result.error)}), 500

                    # Get the public URL
                    public_url = supabase.storage.from_('audio-files').get_public_url(file_path)
                    
                    return jsonify({
                        'success': True,
                        'message': 'Successfully converted YouTube video to audio!',
                        'url': public_url,
                        'filename': safe_filename
                    })

        except Exception as yt_error:
            logger.error(f"YouTube processing error: {str(yt_error)}")
            return jsonify({'error': f'Failed to process YouTube video: {str(yt_error)}'}), 400

    except Exception as e:
        logger.error(f"Error in YouTube conversion: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/convert', methods=['POST'])
def convert_video_to_audio():
    auth_token = request.headers.get('Authorization')
    user_id = get_user_from_token(auth_token)

    if not user_id:
        return jsonify({'error': 'Unauthorized - Please login first'}), 401

    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    video_file = request.files['file']
    if not video_file or video_file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    # Sanitize the filename
    original_filename = video_file.filename
    audio_filename = os.path.splitext(original_filename)[0] + '.mp3'
    sanitized_filename = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', audio_filename)

    temp_video = None
    temp_audio = None
    video = None

    try:
        temp_video = tempfile.NamedTemporaryFile(delete=False, suffix='.mp4')
        temp_audio = tempfile.NamedTemporaryFile(delete=False, suffix='.mp3')

        logger.info(f"Saving uploaded video to temp path: {temp_video.name}")
        logger.info(f"Original filename: {original_filename} → Sanitized: {sanitized_filename}")
        
        try:
            video_file.save(temp_video.name)
        except Exception as save_err:
            logger.error(f"Error saving video file: {str(save_err)}")
            return jsonify({'error': f'Could not save uploaded file: {str(save_err)}'}), 500

        logger.info("Converting video to audio")
        video = VideoFileClip(temp_video.name)

        if not video.audio:
            raise ValueError("No audio track found in video file")

        logger.info("Writing audio file")
        video.audio.write_audiofile(temp_audio.name)

        logger.info("Reading audio file for upload")
        with open(temp_audio.name, 'rb') as f:
            file_data = f.read()

        storage_path = f'{user_id}/{sanitized_filename}'
        logger.info(f"Uploading to Supabase path: {storage_path}")

        # Try to remove existing file
        try:
            supabase.storage.from_('audio-files').remove([storage_path])
        except Exception as remove_err:
            logger.info(f"No existing file to remove or cleanup issue: {str(remove_err)}")

        supabase.storage.from_('audio-files').upload(
            path=storage_path,
            file=file_data,
            file_options={"contentType": "audio/mpeg"}
        )

        file_url = supabase.storage.from_('audio-files').get_public_url(storage_path)
        logger.info("Upload complete")

        return jsonify({
            'success': True,
            'message': 'Audio file created and uploaded successfully!',
            'url': file_url,
            'filename': sanitized_filename
        })

    except ValueError as ve:
        logger.error(f"Validation error: {str(ve)}")
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        logger.error(f"Error during conversion: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        if video:
            try:
                if hasattr(video, 'reader'):
                    video.reader.close()
                if hasattr(video, 'audio') and video.audio is not None:
                    if hasattr(video.audio, 'reader'):
                        video.audio.reader.close()
                video.close()
            except Exception as e:
                logger.error(f"Error closing video: {str(e)}")

        try:
            if temp_video and os.path.exists(temp_video.name):
                os.unlink(temp_video.name)
            if temp_audio and os.path.exists(temp_audio.name):
                os.unlink(temp_audio.name)
        except Exception as e:
            logger.error(f"Error cleaning up temp files: {str(e)}")

@app.route('/process-transcription', methods=['POST'])
def process_transcription():
    try:
        logger.info("Received request to process transcription")
        
        auth_header = request.headers.get('Authorization')
        user_id = get_user_from_token(auth_header)
        if not user_id:
            logger.error("Unauthorized request - no valid user token")
            return jsonify({'error': 'Unauthorized - Please login first'}), 401

        data = request.get_json()
        if not data:
            logger.error("No data provided in request")
            return jsonify({'error': 'No data provided'}), 400
            
        transcription_filename = data.get('filename')
        if not transcription_filename:
            logger.error("No transcription filename provided")
            return jsonify({'error': 'No transcription filename provided'}), 400
            
        logger.info(f"Processing transcription file: {transcription_filename} for user: {user_id}")
            
        # Get transcription text from Supabase
        transcription_path = f"{user_id}/{transcription_filename}"
        
        try:
            # Download the transcription file
            logger.info(f"Downloading transcription from path: {transcription_path}")
            res = supabase.storage.from_('summarized-text').download(transcription_path)
            
            if not res:
                logger.error("Downloaded transcription is empty")
                return jsonify({'error': 'Transcription file is empty'}), 500
                
            transcription_text = res.decode('utf-8')
            logger.info(f"Successfully downloaded transcription of length: {len(transcription_text)} characters")
            
            # Process transcription to generate notes
            logger.info("Starting note generation process")
            success = process_transcription_to_notes(user_id, transcription_filename, transcription_text)
            
            if success:
                logger.info("Successfully generated notes")
                notes_filename = transcription_filename.replace('.txt', '_notes.txt')
                notes_path = f"{user_id}/{notes_filename}"
                notes_url = supabase.storage.from_('notes').get_public_url(notes_path)
                
                return jsonify({
                    'success': True,
                    'message': 'Successfully generated notes from transcription!',
                    'notes_url': notes_url,
                    'notes_filename': notes_filename
                })
            else:
                logger.error("Failed to generate notes from transcription")
                return jsonify({'error': 'Failed to generate notes from transcription'}), 500
                
        except Exception as e:
            logger.error(f"Error processing transcription: {str(e)}")
            logger.exception("Full exception details:")
            return jsonify({'error': f'Failed to process transcription: {str(e)}'}), 500
            
    except Exception as e:
        logger.error(f"Error in process transcription: {str(e)}")
        logger.exception("Full exception details:")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
