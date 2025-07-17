import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignUpForm.css';
import googleIcon from '../../assets/google.webp';
import appleIcon from '../../assets/apple.png';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';


const SignUpForm = ({ onClose, onSwitchToLogin, isModal = false }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const { signUp } = useAuth(); // ✅ Get signUp from AuthContext

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    try {
      const { error } = await signUp(email, password);

      if (error) {
        setError(error.message);
      } else {
        alert('Signup successful! Please check your email to confirm your account.');
        onClose();
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    }
  };

  const handleClose = (e) => {
    e.stopPropagation();
    onClose();
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="signup-form-container" onClick={onClose}>
      <div className="signup-form" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        <h2>Create Account</h2>
        <p className="subtitle">Sign up to get started with Noter AI</p>

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
                type={showPassword ? 'text' : 'password'}
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

          <div className="form-group">
            <label htmlFor="confirm-password">Confirm Password</label>
            <div className="password-input">
              <input
                type={showPassword ? 'text' : 'password'}
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
              />
            </div>
          </div>

          <button type="submit" className="form-signup-btn">Create Account</button>
        </form>

        <div className="divider">
          <span>or continue with</span>
        </div>

        <div className="social-signup">
          <button className="social-btn">
            <img src={googleIcon} alt="Google" />
            Sign up with Google
          </button>
          <button className="social-btn">
            <img src={appleIcon} alt="Apple" />
            Sign up with Apple
          </button>
        </div>

        <div className="login-link">
          Already have an account?{' '}
          <a href="#" onClick={(e) => {
            e.preventDefault();
            if (isModal) {
              onSwitchToLogin();
            } else {
              navigate('/login');
            }
          }}>Log in</a>
        </div>
      </div>
    </div>
  );
};

export default SignUpForm;
