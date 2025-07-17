import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const supabaseUrl = 'https://gkklfyvmhxulxdwjmjxz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdra2xmeXZtaHh1bHhkd2ptanh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzNDUwNDUsImV4cCI6MjA1OTkyMTA0NX0.bBJGZ1ORgqO0iAIzA4aoJPn9LDgYQ1BdfMj6vO4XaZA';
const supabase = createClient(supabaseUrl, supabaseKey);

// Get OpenAI API key from environment variables
const OPENAI_API_KEY =import.meta.env.VITE_OPENAI_API_KEY;


const OpenAI = () => {
  const { user } = useAuth();
  const { filename } = useParams();
  const navigate = useNavigate();
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [transcriptionText, setTranscriptionText] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (filename) {
      fetchTranscriptionText(filename);
    }
  }, [filename]);

  const fetchTranscriptionText = async (transcriptionFilename) => {
    try {
      if (!user) {
        setError('Please login to access transcriptions');
        return;
      }

      setLoading(true);
      
      // Download the transcription file
      const { data, error } = await supabase
        .storage
        .from('summarized-text')
        .download(`${user.id}/${transcriptionFilename}`);

      if (error) {
        console.error('Error fetching transcription:', error.message);
        setError(`Error fetching transcription: ${error.message}`);
        setLoading(false);
        return;
      }

      const text = await data.text();
      setTranscriptionText(text);
      
      // Automatically generate notes when transcription is loaded
      await generateNotes(text);
    } catch (err) {
      console.error('Error in fetchTranscriptionText:', err);
      setError(`Error: ${err.message}`);
      setLoading(false);
    }
  };

  const generateNotes = async (text) => {
    try {
      if (!text) {
        setError('No transcription text available');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      const prompt = `
You're a brilliant student writing detailed, easy-to-understand handwritten-style notes for your friend who missed a lecture.

📚 Your tone: Friendly, clear, and helpful — like you're explaining concepts to a friend.

🎯 Your goals:
- Break down complex concepts into simple terms.
- Explain *why* each topic is important and how it connects to real-world scenarios.
- Add relatable examples, analogies, or step-by-step walkthroughs.
- Avoid technical jargon unless necessary, and explain such terms when used.
- Use Markdown formatting: headings (#, ##), **bold**, bullet points (-), and line breaks.

✨ Extra Features:
- If the topic involves math or formulas, use LaTeX syntax inside $$ for display math and $ for inline math. Example:
  $$E = mc^2$$

- You can include short tips, definitions, or highlight sections like:
  > 💡 *Tip:* Always close your tags in HTML.

💡 Example of how a short section might look:

## CPU vs GPU

- **CPU (Central Processing Unit):** Good for sequential tasks.
- **GPU (Graphics Processing Unit):** Optimized for parallel processing.

Here’s the lecture transcription:
"""
${text}
"""

Now, generate clean, structured, student-friendly notes in Markdown format and dont behave like an AI assistant.
`;



      console.log('Sending request to OpenAI...');
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`OpenAI API error: ${res.status} ${errorText}`);
      }

      const data = await res.json();
      const generatedNotes = data?.choices?.[0]?.message?.content;
      
      if (!generatedNotes) {
        throw new Error('No notes generated from OpenAI');
      }
      
      setResponse(generatedNotes);
      
      // Save the notes to Supabase
      if (filename) {
        const notesFilename = filename.replace('.txt', '_notes.txt');
        await saveNotesToSupabase(notesFilename, generatedNotes);
      }
    } catch (err) {
      console.error('Error generating notes:', err);
      setError(`Failed to generate notes: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const saveNotesToSupabase = async (notesFilename, notesContent) => {
    try {
      if (!user) return;
      
      const notesPath = `${user.id}/${notesFilename}`;
      
      // Try to remove existing file if it exists
      try {
        await supabase.storage.from('notes').remove([notesPath]);
      } catch (e) {
        // Ignore errors if file doesn't exist
      }
      
      // Upload the notes
      const { error } = await supabase
        .storage
        .from('notes')
        .upload(notesPath, notesContent, {
          contentType: 'text/plain',
          upsert: true
        });

      if (error) {
        throw error;
      }
      
      console.log('Notes saved successfully to Supabase');
    } catch (err) {
      console.error('Error saving notes to Supabase:', err);
      // Don't set error state here to avoid overriding the UI with this error
      // Just log it since the notes are still displayed to the user
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">AI Notes Generator</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {/* <button
        onClick={() => generateNotes(transcriptionText)}
        disabled={loading || !transcriptionText}
        className="px-6 py-3 bg-purple-600 text-zinc-900 rounded hover:bg-purple-700 transition disabled:bg-gray-400"
      >
        {loading ? 'Generating Notes...' : 'Regenerate Notes'}
      </button> */}
      
      {/* <button
        onClick={() => navigate('/history')}
        className="ml-4 px-6 py-3 bg-gray-600 text-black rounded hover:bg-gray-700 transition"
      >
        Back to History
      </button> */}

      {response && (
        <div className="mt-6 p-4 bg-gray-50 rounded shadow">
          <pre className="whitespace-pre-wrap font-sans text-sm">{response}</pre>
        </div>
      )}
    </div>
  );
};

export default OpenAI;
