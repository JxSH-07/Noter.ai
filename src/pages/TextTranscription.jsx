import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import './TextTranscription.css';

const TextTranscription = () => {
  const [audioFiles, setAudioFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [transcriptionStatus, setTranscriptionStatus] = useState({});
  const { user } = useAuth();
  const assemblyApiKey = import.meta.env.VITE_ASSEMBLYAI_API_KEY;

  // Fetch audio files from user's folder in Supabase
  useEffect(() => {
    if (user) {
      fetchAudioFiles();
    }
  }, [user]);

  const fetchAudioFiles = async () => {
    try {
      const { data: files, error } = await supabase
        .storage
        .from('audio-files')
        .list(user.id);

      if (error) throw error;
      
      // Start transcription for all files that haven't been transcribed
      const audioFiles = files || [];
      setAudioFiles(audioFiles);
      
      // Check which files already have transcriptions
      const { data: transcribedFiles } = await supabase
        .storage
        .from('summarized-text')
        .list(user.id);
      
      const transcribedFileNames = new Set(
        transcribedFiles?.map(file => file.name.replace('.txt', '.mp3')) || []
      );

      // Automatically start transcription for files that haven't been transcribed
      audioFiles.forEach(file => {
        if (!transcribedFileNames.has(file.name)) {
          transcribeAudio(file.name);
        } else {
          setTranscriptionStatus(prev => ({ ...prev, [file.name]: 'completed' }));
        }
      });
    } catch (err) {
      console.error('Error fetching audio files:', err);
      setError('Failed to fetch audio files');
    }
  };

  const transcribeAudio = async (fileName) => {
    if (transcriptionStatus[fileName] === 'transcribing') return;
    
    setTranscriptionStatus(prev => ({ ...prev, [fileName]: 'uploading' }));

    try {
      // Get the audio file URL from Supabase
      const { data: { publicUrl } } = supabase
        .storage
        .from('audio-files')
        .getPublicUrl(`${user.id}/${fileName}`);

      // Step 1: Upload the audio file to AssemblyAI
      const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
        method: 'POST',
        headers: {
          'Authorization': assemblyApiKey,
        },
        body: await fetch(publicUrl).then(r => r.blob())
      });

      if (!uploadResponse.ok) throw new Error('Failed to upload audio to AssemblyAI');
      const { upload_url } = await uploadResponse.json();

      // Step 2: Start the transcription
      const transcribeResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: {
          'Authorization': assemblyApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio_url: upload_url,
          language_code: 'en'
        })
      });

      if (!transcribeResponse.ok) throw new Error('Failed to start transcription');
      const { id: transcriptId } = await transcribeResponse.json();

      // Step 3: Poll for transcription completion
      setTranscriptionStatus(prev => ({ ...prev, [fileName]: 'transcribing' }));
      
      const result = await pollTranscriptionStatus(transcriptId);
      
      // Step 4: Save transcription to Supabase
      const transcriptionFileName = fileName.replace(/\.[^/.]+$/, '') + '.txt';
      const transcriptionPath = `${user.id}/${transcriptionFileName}`;
      
      const { error: uploadError } = await supabase
        .storage
        .from('summarized-text')
        .upload(transcriptionPath, result.text, {
          contentType: 'text/plain',
          upsert: true
        });

      if (uploadError) throw uploadError;

      setTranscriptionStatus(prev => ({ ...prev, [fileName]: 'completed' }));
    } catch (err) {
      console.error('Transcription error:', err);
      setError(`Failed to transcribe ${fileName}: ${err.message}`);
      setTranscriptionStatus(prev => ({ ...prev, [fileName]: 'error' }));
    }
  };

  const pollTranscriptionStatus = async (transcriptId) => {
    const maxAttempts = 60; // 5 minutes maximum (with 5-second intervals)
    let attempts = 0;

    while (attempts < maxAttempts) {
      const response = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: {
          'Authorization': assemblyApiKey,
        }
      });

      if (!response.ok) throw new Error('Failed to check transcription status');
      
      const result = await response.json();
      
      if (result.status === 'completed') {
        return result;
      } else if (result.status === 'error') {
        throw new Error('Transcription failed');
      }

      // Wait 5 seconds before next attempt
      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
    }

    throw new Error('Transcription timed out');
  };

  return (
    <div className="transcription-container">
      <h1>Audio Files Transcription Status</h1>
      
      {error && <p className="error-message">{error}</p>}
      
      <div className="audio-files-list">
        {audioFiles.map((file) => (
          <div key={file.name} className="audio-file-item">
            <span>{file.name}</span>
            <div className="status-and-actions">
              <span className={`status ${transcriptionStatus[file.name] || 'pending'}`}>
                {transcriptionStatus[file.name] || 'Pending'}
              </span>
            </div>
          </div>
        ))}
        
        {audioFiles.length === 0 && (
          <p>No audio files found in your storage.</p>
        )}
      </div>
    </div>
  );
};

export default TextTranscription;
