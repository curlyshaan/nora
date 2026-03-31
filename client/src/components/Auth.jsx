import { useState } from 'react';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import axios from 'axios';
import './Auth.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function Auth({ onLogin }) {
  const [username, setUsername] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Get registration options
      const optionsRes = await axios.post(`${API_URL}/auth/register/options`, { username });

      // Start WebAuthn registration (Face ID / Touch ID)
      const credential = await startRegistration(optionsRes.data);

      // Verify registration
      const verifyRes = await axios.post(`${API_URL}/auth/register/verify`, {
        username,
        credential
      });

      if (verifyRes.data.verified) {
        onLogin({ userId: verifyRes.data.userId, username });
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.error || 'Registration failed. Make sure your device supports biometric authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Get authentication options
      const optionsRes = await axios.post(`${API_URL}/auth/login/options`, { username });

      // Start WebAuthn authentication (Face ID / Touch ID)
      const credential = await startAuthentication(optionsRes.data);

      // Verify authentication
      const verifyRes = await axios.post(`${API_URL}/auth/login/verify`, {
        username,
        credential
      });

      if (verifyRes.data.verified) {
        onLogin({ userId: verifyRes.data.userId, username: verifyRes.data.username });
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Login failed. Please check your username or register first.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Nora</h1>
        <p className="auth-subtitle">Your AI Investing Learning Assistant</p>

        <div className="auth-form">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="auth-input"
            disabled={loading}
          />

          {error && <div className="auth-error">{error}</div>}

          <button
            onClick={isRegistering ? handleRegister : handleLogin}
            className="auth-button primary"
            disabled={loading}
          >
            {loading ? 'Processing...' : isRegistering ? '🔐 Register with Face ID' : '🔐 Login with Face ID'}
          </button>

          <button
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
            }}
            className="auth-button secondary"
            disabled={loading}
          >
            {isRegistering ? 'Already have an account? Login' : 'New user? Register'}
          </button>
        </div>

        <div className="auth-info">
          <p>🔒 Secure biometric authentication</p>
          <p>📱 Works with Face ID, Touch ID, or device passkey</p>
        </div>
      </div>
    </div>
  );
}

export default Auth;
