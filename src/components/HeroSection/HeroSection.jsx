import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './HeroSection.css';
import './HeroAnimations.css';

const HeroSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleTryService = () => {
    if (user) {
      navigate('/transcribe');
    } else {
      navigate('/login');
    }
  };

  return (
    <section id="hero" className="hero">
      <div className="floating-shapes">
        {[...Array(6)].map((_, i) => (
          <div key={i} className={`shape shape-${i + 1}`} />
        ))}
      </div>
      <div className="overlay">
      <h1>
        <span className="line">Rewriting the</span>
        <span className="line">way you learn</span>
        <span className="line"><span className="highlight">with AI</span></span>
      </h1>
      <p>
        Our AI-powered platform turns lecture recordings into clear, structured notes with summaries, visuals, and easy exports like PDF or DOCX. Whether you're a student catching up or an educator sharing content, we make it simple. With features like Last-Minute Notes for quick revision, you can focus on learning or teaching — while we handle the rest.
      </p>
      <button className="try-service-btn" onClick={handleTryService}>Try Service</button>
    </div>
  </section>
  );
};

export default HeroSection;
