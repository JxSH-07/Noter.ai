import React from 'react';
import { FaInfinity, FaUpload, FaCog, FaBolt, FaUsers, FaPercent, FaCreditCard } from 'react-icons/fa';
import './Pricing.css';

const Pricing = () => {
  // Prevent page scroll when viewing pricing
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <div className="pricing-container">
      <div className="pricing-cards">
        {/* Free Plan */}
        <div className="pricing-card free">
          <h2>Noter Free</h2>
          <div className="price">
            <h1>Free</h1>
            <p>100% Free</p>
          </div>
          <div className="features">
            <div className="feature">
              <div className="feature-icon">🎙️</div>
              <div className="feature-details">
                <h3>3 Transcripts Daily</h3>
                <p>Transcribe 3 files for free every day.</p>
              </div>
            </div>
            <div className="feature">
              <div className="feature-icon">
                <FaUpload />
              </div>
              <div className="feature-details">
                <h3>30 Minute Uploads</h3>
                <p>Each file can be up to 30 minutes long.<br />Upload 1 file at a time.</p>
              </div>
            </div>
            <div className="feature">
              <div className="feature-icon">⚡</div>
              <div className="feature-details">
                <h3>Lower Priority</h3>
                <p>Wait longer before your files are transcribed.</p>
              </div>
            </div>
          </div>
          <button className="current-plan">CURRENT PLAN</button>
        </div>

        {/* Unlimited Plan */}
        <div className="pricing-card unlimited">
          <h2>Noter Unlimited</h2>
          <div className="price">
            <h1>$10</h1>
            <p>/ month</p>
          </div>
          <div className="billing">
            <p>$120 billed yearly <span className="save">SAVE 50%</span></p>
            <p className="small">≈ €10,384.71 billed yearly</p>
          </div>
          <div className="features">
            <div className="feature">
              <div className="feature-icon">
                <FaInfinity />
              </div>
              <div className="feature-details">
                <h3>Unlimited Transcriptions</h3>
                <p>Unlimited transcriptions for one person.</p>
              </div>
            </div>
            <div className="feature">
              <div className="feature-icon">
                <FaUpload />
              </div>
              <div className="feature-details">
                <h3>10 Hour Uploads</h3>
                <p>Each file can be up to 10 hours long / 5 GB.<br />Upload 50 files at a time.</p>
              </div>
            </div>
            <div className="feature">
              <div className="feature-icon">
                <FaCog />
              </div>
              <div className="feature-details">
                <h3>All Features</h3>
                <p>Translation to 134+ languages. Bulk exports, all transcription modes. Unlimited storage.</p>
              </div>
            </div>
            <div className="feature">
              <div className="feature-icon">
                <FaBolt />
              </div>
              <div className="feature-details">
                <h3>Highest Priority</h3>
                <p>We'll always transcribe your files ASAP with the highest priority.</p>
              </div>
            </div>
          </div>
          <button className="go-unlimited">GO UNLIMITED</button>
        </div>

        {/* Teams Plan */}
        <div className="pricing-card teams">
          <h2>Noter for Teams</h2>
          <div className="price">
            <h1>$120</h1>
            <p>/ year</p>
          </div>
          <div className="billing">
            <p>$240 / year <span className="save">SAVE 50%</span></p>
            <p className="small">≈ €10,384.71 billed yearly</p>
          </div>
          <div className="features">
            <div className="feature">
              <div className="feature-icon">
                <FaUsers />
              </div>
              <div className="feature-details">
                <h3>Unlimited transcription for multiple users.</h3>
              </div>
            </div>
            <div className="feature">
              <div className="feature-icon">
                <FaUsers />
              </div>
              <div className="feature-details">
                <h3>Access Management</h3>
                <p>Add or remove users at any time.</p>
              </div>
            </div>
            <div className="feature">
              <div className="feature-icon">
                <FaPercent />
              </div>
              <div className="feature-details">
                <h3>50% Savings</h3>
                <p>Billed at $120 per user per year, a 50% savings off our monthly price.</p>
              </div>
            </div>
            <div className="feature">
              <div className="feature-icon">
                <FaCreditCard />
              </div>
              <div className="feature-details">
                <h3>Simplified Billing</h3>
                <p>All users on your plan are billed under a single subscription.</p>
              </div>
            </div>
          </div>
          <button className="upgrade">UPGRADE</button>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
