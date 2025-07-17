import React from 'react';
import { useAuth } from '../../context/AuthContext';
import './ProfileIcon.css';

const ProfileIcon = () => {
  const { user, logout } = useAuth();

  return (
    <div className="profile-icon">
      <div className="profile-initial">
        {user?.email?.[0].toUpperCase() || 'U'}
      </div>
      <div className="profile-dropdown">
        <div className="profile-info">
          <div className="profile-initial large">{user?.email?.[0].toUpperCase() || 'U'}</div>
          <div className="profile-email">{user?.email}</div>
        </div>
        <button onClick={logout} className="logout-btn">Logout</button>
      </div>
    </div>
  );
};

export default ProfileIcon; 