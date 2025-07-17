import React from 'react';
import './HomePage.css';

const HomePage = () => {
  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <h1>Welcome to Noter AI</h1>
          <p>Your AI-powered note-taking assistant</p>
          <div className="cta-buttons">
            <button className="primary-btn">Try Services</button>
            <button className="secondary-btn">Learn More</button>
          </div>
        </div>
      </section>

      <section className="features-section">
        <h2>Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>AI-Powered Notes</h3>
            <p>Get smart suggestions and summaries</p>
          </div>
          <div className="feature-card">
            <h3>Real-time Collaboration</h3>
            <p>Work together with your team</p>
          </div>
          <div className="feature-card">
            <h3>Smart Organization</h3>
            <p>Automatically categorize your notes</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage; 