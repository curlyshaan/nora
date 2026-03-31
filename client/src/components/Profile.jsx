import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Profile.css';
import './ProfileTheme.css';

const API_URL = 'http://localhost:3001/api';

function Profile({ user, onLogout, darkMode, toggleTheme }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    fund_amount: '',
    family_size: '',
    investment_timeline: '',
    risk_tolerance: '',
    financial_goals: '',
    emergency_fund: false,
    debts_status: '',
    additional_context: ''
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await axios.get(`${API_URL}/profile/${user.userId}`);
      if (res.data) {
        setProfile(res.data);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);

    try {
      await axios.post(`${API_URL}/profile/${user.userId}`, profile);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save profile:', err);
      alert('Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setProfile({ ...profile, [field]: value });
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <button onClick={() => navigate('/chat')} className="back-btn">← Back to Chat</button>
        <h1>Your Investment Profile</h1>
        <div className="header-actions">
          <button onClick={toggleTheme} className="theme-btn">
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-info">
          <p>📊 Help Nora provide better personalized guidance by sharing your investment context.</p>
          <p>🔒 This information is stored securely and only used to tailor educational responses.</p>
        </div>

        <div className="profile-form">
          <div className="form-group">
            <label>💰 Investment Fund Amount ($)</label>
            <input
              type="number"
              value={profile.fund_amount}
              onChange={(e) => handleChange('fund_amount', e.target.value)}
              placeholder="e.g., 10000"
            />
          </div>

          <div className="form-group">
            <label>👨‍👩‍👧‍👦 Family Size</label>
            <input
              type="number"
              value={profile.family_size}
              onChange={(e) => handleChange('family_size', e.target.value)}
              placeholder="e.g., 4"
            />
          </div>

          <div className="form-group">
            <label>⏰ Investment Timeline</label>
            <select
              value={profile.investment_timeline}
              onChange={(e) => handleChange('investment_timeline', e.target.value)}
            >
              <option value="">Select timeline</option>
              <option value="short">Short-term (1-3 years)</option>
              <option value="medium">Medium-term (3-7 years)</option>
              <option value="long">Long-term (7+ years)</option>
              <option value="retirement">Retirement (10+ years)</option>
            </select>
          </div>

          <div className="form-group">
            <label>📈 Risk Tolerance</label>
            <select
              value={profile.risk_tolerance}
              onChange={(e) => handleChange('risk_tolerance', e.target.value)}
            >
              <option value="">Select risk tolerance</option>
              <option value="conservative">Conservative (Low risk, stable returns)</option>
              <option value="moderate">Moderate (Balanced risk/reward)</option>
              <option value="aggressive">Aggressive (High risk, high potential)</option>
            </select>
          </div>

          <div className="form-group">
            <label>🎯 Financial Goals</label>
            <textarea
              value={profile.financial_goals}
              onChange={(e) => handleChange('financial_goals', e.target.value)}
              placeholder="e.g., Save for retirement, buy a house, children's education..."
              rows={3}
            />
          </div>

          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                checked={profile.emergency_fund}
                onChange={(e) => handleChange('emergency_fund', e.target.checked)}
              />
              ✅ I have an emergency fund (3-6 months expenses)
            </label>
          </div>

          <div className="form-group">
            <label>💳 Debt Status</label>
            <textarea
              value={profile.debts_status}
              onChange={(e) => handleChange('debts_status', e.target.value)}
              placeholder="e.g., No high-interest debt, mortgage only, student loans..."
              rows={2}
            />
          </div>

          <div className="form-group">
            <label>📝 Additional Context</label>
            <textarea
              value={profile.additional_context}
              onChange={(e) => handleChange('additional_context', e.target.value)}
              placeholder="Any other relevant information about your financial situation or goals..."
              rows={3}
            />
          </div>

          <div className="form-actions">
            <button onClick={handleSave} disabled={loading} className="save-btn">
              {loading ? 'Saving...' : saved ? '✓ Saved!' : '💾 Save Profile'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
