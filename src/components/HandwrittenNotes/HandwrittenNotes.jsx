// ✅ HandwrittenNotes.jsx (Displays the note content with Markdown + images)
import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import './HandwrittenNotes.css';

const supabase = createClient(
  'https://gkklfyvmhxulxdwjmjxz.supabase.co',
  'YOUR_SUPABASE_ANON_KEY' // Replace with your real anon key
);

const HandwrittenNotes = () => {
  const [formattedText, setFormattedText] = useState('');

  useEffect(() => {
    const fetchNotes = async () => {
      const { data, error } = await supabase
        .storage
        .from('notes')
        .download('final_notes.txt');

      if (error) {
        console.error('Error fetching notes:', error.message);
        return;
      }

      const rawText = await data.text();
      const formatted = formatNoteContent(rawText);
      setFormattedText(formatted);
    };
    fetchNotes();
  }, []);

  const handleDownloadPDF = () => {
    const input = document.getElementById('note-style-canvas');
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('Lecture_Notes.pdf');
    });
  };

  return (
    <div className="notebook-container">
      <div className="notebook-paper" id="note-style-canvas">
        <ReactMarkdown rehypePlugins={[rehypeRaw, rehypeSanitize]}>
          {formattedText}
        </ReactMarkdown>
      </div>
      <button onClick={handleDownloadPDF} className="download-btn">
        Download as PDF
      </button>
    </div>
  );
};

export default HandwrittenNotes;

// ✅ Formatter Function
function formatNoteContent(rawText) {
  let text = rawText;

  // Merge broken markdown image: ![alt]\n(url)
  text = text.replace(/!\[(.*?)\]\s*\n\s*\((.*?)\)/g, '![$1]($2)');

  // Convert **bold** to <b>
  text = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

  // Convert images
  text = text.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, url) => {
    const altLower = alt.toLowerCase();
    if (url === 'image_url') {
      let imageUrl = '';
      if (altLower.includes('gpu')) {
        imageUrl = 'https://upload.wikimedia.org/wikipedia/commons/7/76/GPU_Architecture.png';
      } else if (altLower.includes('linked list')) {
        imageUrl = 'https://upload.wikimedia.org/wikipedia/commons/2/2b/Linked_list.svg';
      } else if (altLower.includes('dbms')) {
        imageUrl = 'https://static.javatpoint.com/dbms/images/dbms-architecture.png';
      } else if (altLower.includes('binary tree')) {
        imageUrl = 'https://upload.wikimedia.org/wikipedia/commons/f/f7/Binary_tree.svg';
      }
      return imageUrl
        ? `<div style="text-align:center;margin:1rem 0;"><img src="${imageUrl}" alt="${alt}" width="400"/></div>`
        : `<div style="text-align:center;margin:1rem 0;"><em>[Image: ${alt}]</em></div>`;
    }
    return `<div style="text-align:center;margin:1rem 0;"><img src="${url}" alt="${alt}" width="400"/></div>`;
  });

  // Replace horizontal rule
  text = text.replace(/---/g, '<hr>');

  // Split lines to center the first one as title
  const lines = text.split('\n');
  if (lines[0]) {
    lines[0] = `<div style="text-align: center; font-size: 1.4rem; font-weight: bold; margin-bottom: 1rem;">${lines[0]}</div>`;
  }

  return lines.join('\n');
}
