import React, { useState } from 'react';
import './LoginForm.css';
import googleIcon from '../../assets/google.webp';
import appleIcon from '../../assets/apple.png';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate, useLocation } from 'react-router-dom';

const LoginForm = ({ onClose, onSwitchToSignUp, isModal = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/history';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      // Always close the form after successful login
      onClose();
      // Navigate to home page
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid email or password');
      console.error('Login error:', err.message);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-form-container" onClick={onClose}>
      <div className="login-form" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        <h2>Welcome Back</h2>
        <p className="subtitle">Log in to continue to Noter AI</p>
        {error && <p className="error-message">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
              <button 
                type="button" 
                className="password-toggle"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="forgot-password">
            <a href="#" onClick={(e) => e.preventDefault()}>Forgot Password?</a>
          </div>

          <button type="submit" className="form-login-btn">Log In</button>
        </form>

        <div className="divider">
          <span>continue with</span>
        </div>

        <div className="social-login">
          <button className="social-btn">
            <img src={googleIcon} alt="Google" />
            Log in with Google
          </button>
          <button className="social-btn">
            <img src={appleIcon} alt="Apple" />
            Log in with Apple
          </button>
        </div>

        <div className="signup-link">
          Don't have an account? <a href="#" onClick={(e) => {
            e.preventDefault();
            if (isModal) {
              onClose();
              onSwitchToSignUp();
            } else {
              navigate('/signup');
            }
          }}>Sign up</a>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
