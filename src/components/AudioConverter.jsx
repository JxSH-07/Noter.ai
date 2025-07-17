import React, { useState, useEffect } from 'react';

const AudioConverter = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [serverStatus, setServerStatus] = useState('online');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'video/mp4') {
      setFile(selectedFile);
      setError(null);
      console.log("File selected:", selectedFile.name, selectedFile.size, "bytes");
    } else {
      setFile(null);
      setError('Please select an MP4 file');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an MP4 file');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      console.log('Starting conversion process...');
      
      // First, ensure the backend server is reachable
      const healthCheck = await fetch('http://localhost:5000/health')
        .catch(err => {
          throw new Error('Backend server is not running. Please start the server.');
        });
      
      console.log('Sending file to server:', file.name, file.size, "bytes");
      
      const response = await fetch('http://localhost:5000/convert', {
        method: 'POST',
        body: formData,
      });

      console.log('Response received:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to convert file');
      }

      const data = await response.json();
      console.log('Conversion successful:', data);

      if (!data.file_url) {
        throw new Error('No file URL returned from server');
      }

      setResult(data);
      
      // Show alert when transcription is complete
      alert('Transcription completed successfully!');
      
    } catch (err) {
      console.error('Conversion error:', err);
      setError(err.message || 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4">Convert MP4 to MP3</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">
            Select MP4 File:
          </label>
          <input
            type="file"
            accept="video/mp4"
            onChange={handleFileChange}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        
        <button
          type="submit"
          disabled={loading || !file}
          className={`w-full py-2 px-4 rounded ${
            loading || !file
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {loading ? 'Converting...' : 'Generate Transcribe'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-4 p-3 bg-green-100 text-green-700 rounded">
          <p>Conversion successful!</p>
          <a
            href={result.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            Download MP3
          </a>
        </div>
      )}
    </div>
  );
};

export default AudioConverter;