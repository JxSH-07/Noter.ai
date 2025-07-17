import { supabase } from "../supabaseClient"; // adjust path if needed

// ✅ Extract video ID from YouTube URL
const extractVideoId = (url) => {
  const regExp = /(?:v=|youtu\.be\/)([^&]+)/;
  const match = url.match(regExp);
  return match ? match[1] : null;
};

// ✅ Fetch transcript from Supadata API
export const getYouTubeTranscript = async (youtubeUrl) => {
  try {
    const response = await fetch(
      `https://supadata.vercel.app/api/transcript?url=${encodeURIComponent(youtubeUrl)}`
    );
    const data = await response.json();

    if (data && data.transcript) {
      const fullTranscript = data.transcript.map((t) => t.text).join(" ");
      return fullTranscript;
    } else {
      return "Transcript not available.";
    }
  } catch (error) {
    console.error("Error fetching transcript:", error);
    return "Error fetching transcript.";
  }
};

// ✅ Upload transcript to your Supabase bucket 'summarized-text'
export const uploadTranscriptToSupabase = async (userId, transcript, videoUrl) => {
  const videoId = extractVideoId(videoUrl) || "unknown";
  const fileName = `transcript_${videoId}_${Date.now()}.txt`;
  const file = new Blob([transcript], { type: "text/plain" });

  const { data, error } = await supabase.storage
    .from("summarized-text") // ← updated here!
    .upload(`${userId}/${fileName}`, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Error uploading to Supabase:", error.message);
    return null;
  }

  console.log("Uploaded transcript to Supabase:", data);
  return data;
};
