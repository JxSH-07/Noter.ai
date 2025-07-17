import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiUser, FiMail, FiStar, FiPackage } from 'react-icons/fi';
import './Profile.css';

const Profile = () => {
  const { user, email } = useAuth();
  const [userData, setUserData] = useState({
    username: email ? email.split('@')[0] : 'User',
    email: email || 'Not available',
    subscription: 'Pro'
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            <div className="avatar-circle">
              <FiUser className="avatar-icon" />
            </div>
          </div>
          <h1 className="profile-name">{userData.username}</h1>
        </div>

        <div className="profile-info">
          <div className="info-item">
            <FiMail className="info-icon" />
            <div className="info-content">
              <label>Email</label>
              <p>{userData.email}</p>
            </div>
          </div>

          <div className="info-item">
            <FiStar className="info-icon" />
            <div className="info-content">
              <label>Subscription</label>
              <p>{userData.subscription}</p>
            </div>
          </div>

          <div className="subscription-cards">
            <div className="sub-card basic">
              <FiPackage className="sub-icon" />
              <h3>Basic</h3>
              <p>Free</p>
              <ul>
                <li>Basic features</li>
                <li>Limited storage</li>
                <li>Email support</li>
              </ul>
              {userData.subscription === 'Basic' ? (
                <button className="current-plan">Current Plan</button>
              ) : (
                <button className="upgrade-btn">Switch Plan</button>
              )}
            </div>

            <div className="sub-card pro">
              <FiStar className="sub-icon" />
              <h3>Pro</h3>
              <p>$9.99/mo</p>
              <ul>
                <li>All Basic features</li>
                <li>Unlimited storage</li>
                <li>Priority support</li>
                <li>Advanced analytics</li>
              </ul>
              {userData.subscription === 'Pro' ? (
                <button className="current-plan">Current Plan</button>
              ) : (
                <button className="upgrade-btn">Upgrade Now</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
