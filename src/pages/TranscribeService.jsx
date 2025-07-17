import React, { useState } from "react";
import "./TranscribeService.css";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const TranscribeService = () => {
  const [file, setFile] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [progress, setProgress] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const assemblyApiKey = import.meta.env.VITE_ASSEMBLYAI_API_KEY;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type.startsWith("video/")) {
      setFile(selectedFile);
      setError("");
      setSuccess("");
      setAudioUrl(null);
      setYoutubeUrl(""); // Clear YouTube URL when file is selected
    } else {
      setError("Please select a valid video file");
      setFile(null);
    }
  };

  const handleYoutubeUrlChange = (e) => {
    setYoutubeUrl(e.target.value);
    setFile(null); // Clear file when YouTube URL is entered
    setError("");
    setSuccess("");
    setAudioUrl(null);
  };

  const validateYoutubeUrl = (url) => {
    // Support both standard and shortened YouTube URLs
    const patterns = [
      /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]{11}/,
      /^(https?:\/\/)?(www\.)?youtube\.com\/v\/[a-zA-Z0-9_-]{11}/,
      /^(https?:\/\/)?(www\.)?youtube\.com\/embed\/[a-zA-Z0-9_-]{11}/,
    ];
    return patterns.some((pattern) => pattern.test(url));
  };

  const transcribeAudio = async (audioFileName) => {
    try {
      // Get the audio file URL from Supabase
      const {
        data: { publicUrl },
      } = supabase.storage
        .from("audio-files")
        .getPublicUrl(`${user.id}/${audioFileName}`);

      // Step 1: Upload the audio file to AssemblyAI
      const uploadResponse = await fetch(
        "https://api.assemblyai.com/v2/upload",
        {
          method: "POST",
          headers: {
            Authorization: assemblyApiKey,
          },
          body: await fetch(publicUrl).then((r) => r.blob()),
        }
      );

      if (!uploadResponse.ok)
        throw new Error("Failed to upload audio to AssemblyAI");
      const { upload_url } = await uploadResponse.json();

      // Step 2: Start the transcription
      const transcribeResponse = await fetch(
        "https://api.assemblyai.com/v2/transcript",
        {
          method: "POST",
          headers: {
            Authorization: assemblyApiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            audio_url: upload_url,
            language_code: "en",
          }),
        }
      );

      if (!transcribeResponse.ok)
        throw new Error("Failed to start transcription");
      const { id: transcriptId } = await transcribeResponse.json();

      // Step 3: Poll for transcription completion
      const result = await pollTranscriptionStatus(transcriptId);

      // Step 4: Save transcription to Supabase
      const transcriptionFileName =
        audioFileName.replace(/\.[^/.]+$/, "") + ".txt";
      const transcriptionPath = `${user.id}/${transcriptionFileName}`;

      const { error: uploadError } = await supabase.storage
        .from("summarized-text")
        .upload(transcriptionPath, result.text, {
          contentType: "text/plain",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      setSuccess(
        "Audio converted and transcribed successfully. Generating notes..."
      );

      // Step 5: Automatically generate notes
      try {
        await generateNotesFromTranscription(transcriptionFileName);
        setSuccess(
          "Audio converted, transcribed, and notes generated successfully!"
        );
      } catch (noteErr) {
        console.error("Notes generation error:", noteErr);
        setSuccess(
          "Audio converted and transcribed successfully, but note generation failed."
        );
      }

      navigate("/history"); // Redirect to history page to see the result
    } catch (err) {
      console.error("Transcription error:", err);
      setError(
        `Failed to transcribe audio: ${err.message || JSON.stringify(err)}`
      );
    }
  };

  const generateNotesFromTranscription = async (transcriptionFileName) => {
    try {
      // Get the session token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No active session - please login");
      }

      console.log(
        `Sending request to process transcription: ${transcriptionFileName}`
      );
      const response = await fetch(
        "http://localhost:5000/process-transcription",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            filename: transcriptionFileName,
          }),
        }
      );

      // Log the raw response for debugging
      const responseText = await response.text();
      console.log("Raw response:", responseText);

      // Parse the response text as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        throw new Error(
          `Failed to parse server response: ${responseText.substring(
            0,
            100
          )}...`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            `Server error: ${response.status} ${response.statusText}`
        );
      }

      if (!data.success) {
        throw new Error(
          data.error || "Failed to generate notes from transcription"
        );
      }

      return data;
    } catch (err) {
      console.error("Notes generation error:", err);
      // Include more details in the error message
      throw new Error(
        `Failed to generate notes: ${err.message || JSON.stringify(err)}`
      );
    }
  };

  const pollTranscriptionStatus = async (transcriptId) => {
    const maxAttempts = 60; // 5 minutes maximum (with 5-second intervals)
    let attempts = 0;

    while (attempts < maxAttempts) {
      const response = await fetch(
        `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
        {
          headers: {
            Authorization: assemblyApiKey,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to check transcription status");

      const result = await response.json();

      if (result.status === "completed") {
        return result;
      } else if (result.status === "error") {
        throw new Error("Transcription failed");
      }

      // Wait 5 seconds before next attempt
      await new Promise((resolve) => setTimeout(resolve, 5000));
      attempts++;
    }

    throw new Error("Transcription timed out");
  };

  const handleGenerate = async () => {
    if (file) {
      await handleVideoConversion();
    } else if (youtubeUrl) {
      await handleYoutubeConversion();
    } else {
      setError("Please select a video file or enter a YouTube URL");
    }
  };

  const handleYoutubeConversion = async () => {
    if (!youtubeUrl) {
      setError("Please enter a YouTube URL");
      return;
    }

    const trimmedUrl = youtubeUrl.trim();
    if (!validateYoutubeUrl(trimmedUrl)) {
      setError(
        "Please enter a valid YouTube URL (e.g., https://youtube.com/watch?v=... or https://youtu.be/...)"
      );
      return;
    }

    if (!user) {
      setError("Please login first");
      navigate("/login");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setAudioUrl(null);

    try {
      // Get the session token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No active session - please login");
      }

      setSuccess("Starting YouTube video conversion...");

      const response = await fetch("http://localhost:5000/convert-youtube", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          url: trimmedUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to convert YouTube video");
      }

      if (data.success && data.url) {
        setAudioUrl(data.url);
        setSuccess(
          "Converting YouTube video to audio and starting transcription..."
        );
        setYoutubeUrl("");
        setProgress(100);
        setTimeout(() => setProgress(0), 1000);

        // Start the transcription process
        await transcribeAudio(data.filename);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      console.error("YouTube conversion error:", err);
      setError(
        err.message || "Failed to convert YouTube video. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVideoConversion = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    if (!user) {
      setError("Please login first");
      navigate("/login");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setAudioUrl(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Get the session token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No active session - please login");
      }

      const response = await fetch("http://localhost:5000/convert", {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      }).catch((err) => {
        throw new Error(
          "Cannot connect to server. Please make sure the backend is running."
        );
      });

      if (!response) {
        throw new Error("No response from server");
      }

      let data;
      try {
        data = await response.json();
      } catch (err) {
        throw new Error("Invalid response from server");
      }

      if (!response.ok) {
        throw new Error(data.error || "Conversion failed");
      }

      if (data.success && data.url) {
        setAudioUrl(data.url);
        setSuccess("Converting video to audio and starting transcription...");
        setFile(null);
        setProgress(100);
        setTimeout(() => setProgress(0), 1000);

        // Start the transcription process
        await transcribeAudio(data.filename);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      setError(err.message || "Failed to convert video. Please try again.");
      console.error("Conversion error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="transcribe-container">
      <h1 className="transcribe-header">Convert Video to Audio & Transcribe</h1>

      <div className="options-container">
        <div className="option-section">
          <h2>Option 1: Upload Video File</h2>
          <div
            className="file-upload-container"
            onClick={() => document.getElementById("file-input").click()}
          >
            <input
              type="file"
              id="file-input"
              className="file-input"
              accept="video/*"
              onChange={handleFileChange}
            />
            <p>Click or drag a video file here</p>
            {file && <p className="file-info">Selected: {file.name}</p>}
          </div>
        </div>

        <div className="option-divider">
          <span>OR</span>
        </div>

        <div className="option-section">
          <h2>Option 2: YouTube URL</h2>
          <div className="youtube-input-container">
            <input
              type="text"
              placeholder="Paste YouTube URL here"
              value={youtubeUrl}
              onChange={handleYoutubeUrlChange}
              className="youtube-input"
            />
          </div>
        </div>
      </div>

      <button
        className="generate-button"
        onClick={handleGenerate}
        disabled={(!file && !youtubeUrl) || loading}
      >
        {loading ? "Processing..." : "Generate"}
      </button>

      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}

      {progress > 0 && (
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {audioUrl && (
        <div className="audio-result">
          <p>Audio file ready!</p>
          <audio controls src={audioUrl} />
          <a
            href={audioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="download-link"
          >
            Download Audio
          </a>
        </div>
      )}
    </div>
  );
};

export default TranscribeService;
