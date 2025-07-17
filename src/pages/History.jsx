import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSearch, FaEllipsisH, FaFileAlt } from 'react-icons/fa';
import { MdFileUpload } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './History_css.css';

const History = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [files, setFiles] = useState([]);
  const [notes, setNotes] = useState({});
  const [transcriptions, setTranscriptions] = useState({});
  const [dropdownPosition, setDropdownPosition] = useState(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [currentNote, setCurrentNote] = useState({ title: '', content: '' });

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };  

  useEffect(() => {
    if (user) {
      fetchFiles();
    }
  }, [user]);

  const fetchFiles = async () => {
    try {
      const { data: audioFiles, error: audioError } = await supabase
        .storage
        .from('audio-files')
        .list(user.id);
      if (audioError) throw audioError;

      const { data: textFiles, error: textError } = await supabase
        .storage
        .from('summarized-text')
        .list(user.id);
      if (textError) throw textError;

      const { data: noteFiles, error: noteError } = await supabase
        .storage
        .from('notes')
        .list(user.id);
      if (noteError) throw noteError;

      const transcriptionMap = {};
      textFiles?.forEach(file => {
        const audioFileName = file.name.replace('.txt', '.mp3');
        transcriptionMap[audioFileName] = file.name;
      });

      const notesMap = {};
      noteFiles?.forEach(file => {
        const audioFileName = file.name.replace('_notes.txt', '.mp3');
        notesMap[audioFileName] = file.name;
      });

      const processedFiles = audioFiles.map(file => ({
        id: file.id,
        name: file.name,
        uploaded: new Date(file.created_at).toLocaleString(),
        status: notesMap[file.name]
          ? 'completed'
          : transcriptionMap[file.name]
          ? 'transcribed'
          : 'pending',
        hasNotes: !!notesMap[file.name],
        notesFilename: notesMap[file.name] || null,
        transcriptionFilename: transcriptionMap[file.name] || null
      }));

      setFiles(processedFiles);
      setTranscriptions(transcriptionMap);
      setNotes(notesMap);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const handleClickOutside = (e) => {
    if (!e.target.closest('.dropdown-container')) {
      setActiveDropdown(null);
    }
  };

  const toggleDropdown = (fileId, e) => {
    e.stopPropagation();
    if (activeDropdown === fileId) {
      setActiveDropdown(null);
    } else {
      const button = e.currentTarget;
      const rect = button.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = 280;

      let top, left;
      left = rect.left - 230;

      if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
        top = rect.top - dropdownHeight + 10;
      } else {
        top = rect.top;
      }

      if (left < 10) {
        left = rect.right + 10;
      }

      setDropdownPosition({ top, left });
      setActiveDropdown(fileId);
    }
  };

  const handleFileSelect = (fileId) => {
    setSelectedFiles(prev =>
      prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]
    );
  };

  const handleSelectAll = () => {
    setSelectedFiles(
      selectedFiles.length === files.length ? [] : files.map(file => file.id)
    );
  };

  const handleViewNotes = async (file) => {
    try {
      if (!file.hasNotes) {
        alert('No notes available for this file.');
        return;
      }

      const { data, error } = await supabase
        .storage
        .from('notes')
        .download(`${user.id}/${file.notesFilename}`);

      if (error) throw error;

      const content = await data.text();
      setCurrentNote({
        title: file.name.replace('.mp3', ''),
        content: content
      });
      setShowNoteModal(true);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const handleDownloadPDF = () => {
    const input = document.getElementById('note-style-canvas');
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${currentNote.title}_Notes.pdf`);
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'green';
      case 'transcribed': return 'orange';
      case 'pending': return 'gray';
      default: return 'gray';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Notes Ready';
      case 'transcribed': return 'Transcribed';
      case 'pending': return 'Processing';
      default: return 'Unknown';
    }
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDownloadNotePDF = async (file) => {
    try {
      if (!file.hasNotes) {
        alert('No notes available to download.');
        return;
      }
  
      const { data, error } = await supabase
        .storage
        .from('notes')
        .download(`${user.id}/${file.notesFilename}`);
  
      if (error) throw error;
  
      const content = await data.text();
  
      // Create a temporary invisible container
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.fontFamily = `'Gloria Hallelujah', cursive`;
      tempDiv.style.fontSize = '16px';
      tempDiv.style.lineHeight = '1.9';
      tempDiv.style.whiteSpace = 'pre-wrap';
      tempDiv.style.padding = '2rem';
      tempDiv.style.width = '800px';
      tempDiv.style.backgroundImage = `url('https://raw.githubusercontent.com/itzmestar/noter-static/main/notebook-lines-light.png')`;
      tempDiv.style.backgroundSize = 'cover';
      tempDiv.innerText = content;
      document.body.appendChild(tempDiv);
  
      const canvas = await html2canvas(tempDiv);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
  
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${file.name.replace('.mp3', '')}_notes.pdf`);
  
      document.body.removeChild(tempDiv);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  const handleDeleteFile = async (file) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${file.name}"?`);
    if (!confirmDelete) return;
  
    try {
      // Construct file paths
      const audioPath = file.name ? `${user.id}/${file.name}` : null;
      const transcriptPath = file.transcriptionFilename ? `${user.id}/${file.transcriptionFilename}` : null;
      const notesPath = file.notesFilename ? `${user.id}/${file.notesFilename}` : null;
  
      console.log('🧹 Deleting:', {
        audioPath,
        transcriptPath,
        notesPath
      });
  
      // Delete from 'audio-files' bucket
      if (audioPath) {
        const { error } = await supabase.storage.from('audio-files').remove([audioPath]);
        if (error) console.error('Audio delete error:', error.message);
      }
  
      // Delete from 'summarized-text' bucket
      if (transcriptPath) {
        const { error } = await supabase.storage.from('summarized-text').remove([transcriptPath]);
        if (error) console.error('Transcript delete error:', error.message);
      }
  
      // Delete from 'notes' bucket
      if (notesPath) {
        const { error } = await supabase.storage.from('notes').remove([notesPath]);
        if (error) console.error('Notes delete error:', error.message);
      }
  
      alert('✅ File deleted successfully!');
      await fetchFiles(); // Refresh file list
  
    } catch (err) {
      console.error('❌ Delete failed:', err);
      alert('Failed to delete file. Please check the console for details.');
    }
  };
  
  
  return (
    <div className="history-container" onClick={handleClickOutside}>
      <div className="header">
        <div className="left-section">
          <h1>Recent Files</h1>
        </div>
        <div className="right-section">
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            className="transcribe-btn"
            onClick={() => navigate("/transcribe")}
          >
            <MdFileUpload /> TRANSCRIBE FILES
          </button>
        </div>
      </div>

      <div className="files-table">
        <table>
          <thead>
            <tr>
              <th></th>
              <th>Name</th>
              <th>Uploaded</th>
              <th>Status</th>
              <th>Actions</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredFiles.map((file) => (
              <tr
                key={file.id}
                className={selectedFiles.includes(file.id) ? "selected" : ""}
              >
                <td>{file.name}</td>
                <td>{file.uploaded}</td>
                <td>
                  <span
                    className={`status-badge ${getStatusColor(file.status)}`}
                  >
                    {getStatusText(file.status)}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    {file.hasNotes && (
                      <button
                        className="action-button notes-button"
                        onClick={() => handleViewNotes(file)}
                        title="View Notes"
                      >
                        <FaFileAlt /> Notes
                      </button>
                    )}
                    {file.transcriptionFilename && !file.hasNotes && (
                      <button
                        className="action-button generate-button"
                        onClick={() =>
                          navigate(`/notes/${file.transcriptionFilename}`)
                        }
                        title="Generate Notes"
                      >
                        <FaFileAlt /> Generate Notes
                      </button>
                    )}
                  </div>
                </td>
                <td>
                  <button
                    className="more-options-btn"
                    onClick={(e) => toggleDropdown(file.id, e)}
                  >
                    <FaEllipsisH />
                  </button>
                  {activeDropdown === file.id && (
                    <div
                      className="dropdown-container"
                      style={{
                        position: "fixed",
                        top: `${dropdownPosition?.top}px`,
                        left: `${dropdownPosition?.left}px`,
                      }}
                    >
                      <div className="dropdown-menu">
                        {file.hasNotes && (
                          <button onClick={() => handleViewNotes(file)}>
                            View Notes
                          </button>
                        )}
                        {file.transcriptionFilename && !file.hasNotes && (
                          <button
                            onClick={() =>
                              navigate(`/notes/${file.transcriptionFilename}`)
                            }
                          >
                            Generate Notes
                          </button>
                        )}
                        <button onClick={() => handleDownloadNotePDF(file)}>
                          Download Pdf
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDeleteFile(file)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showNoteModal && (
        <div
          className="note-modal-overlay"
          onClick={() => setShowNoteModal(false)}
        >
          <div
            className={`note-modal ${isFullscreen ? "fullscreen" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="note-modal-header">
              <h2>{currentNote.title}</h2>
              <button
                className="close-button"
                onClick={() => setShowNoteModal(false)}
              >
                ×
              </button>
            </div>
            <div className="note-modal-content">
              <div className="handwritten-wrapper" id="note-style-canvas">
                <pre className="handwritten-text">{currentNote.content}</pre>
              </div>
              <button onClick={toggleFullscreen} className="fullscreen-btn">
                {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              </button>

              {/* <button onClick={handleDownloadPDF} className="download-btn">Download as PDF</button> */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
