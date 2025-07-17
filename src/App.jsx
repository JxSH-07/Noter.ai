import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import Navbar from './components/Navbar/Navbar.jsx';
import HeroSection from './components/HeroSection/HeroSection.jsx';
import History from './pages/History.jsx';
import Pricing from './pages/Pricing.jsx';
import Feedback from './pages/Feedback.jsx';
import LoginForm from './components/LoginForm/LoginForm.jsx';
import SignUpForm from './components/SignUpForm/SignUpForm.jsx';
import TranscribeService from './pages/TranscribeService';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import './App.css';
// Make sure the AudioConverter component is properly imported and rendered
import AudioConverter from './components/AudioConverter';
// Import the OpenAI component for notes generation
import OpenAI from './components/OpenAIChat/OpenAI';

// Import the test component
import Profile from './components/Profile/Profile';

function App() {
  const navigate = useNavigate();

  return (
    <AuthProvider>
      <div className="App">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<HeroSection />} />
            <Route path="/login" element={<LoginForm isModal={false} onClose={() => navigate('/')} />} />
            <Route path="/signup" element={<SignUpForm isModal={false} onClose={() => navigate('/')} />} />
            <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><div>Settings Page</div></ProtectedRoute>} />
            <Route path="/transcribe" element={<ProtectedRoute><TranscribeService /></ProtectedRoute>} />
            {/* Route for OpenAI notes generation */}
            <Route path="/notes/:filename" element={<ProtectedRoute><OpenAI /></ProtectedRoute>} />
            {/* Fix: Add a proper route for AudioConverter */}
            <Route path="/convert" element={<AudioConverter />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}

function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default AppWrapper;
