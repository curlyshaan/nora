import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './components/Auth';
import Chat from './components/Chat';
import Profile from './components/Profile';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(true); // Default to dark mode

  useEffect(() => {
    const savedUser = localStorage.getItem('noraUser');
    if (savedUser) setUser(JSON.parse(savedUser));

    const savedTheme = localStorage.getItem('noraTheme');
    if (savedTheme) setDarkMode(savedTheme === 'dark');

    setLoading(false);
  }, []);

  useEffect(() => {
    document.body.className = darkMode ? 'dark-mode' : 'light-mode';
    localStorage.setItem('noraTheme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('noraUser', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('noraUser');
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  if (loading) return <div className="loading-screen">Loading Nora...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/auth" element={!user ? <Auth onLogin={handleLogin} /> : <Navigate to="/chat" />} />
        <Route path="/chat" element={user ? <Chat user={user} onLogout={handleLogout} darkMode={darkMode} toggleTheme={toggleTheme} /> : <Navigate to="/auth" />} />
        <Route path="/profile" element={user ? <Profile user={user} onLogout={handleLogout} darkMode={darkMode} toggleTheme={toggleTheme} /> : <Navigate to="/auth" />} />
        <Route path="*" element={<Navigate to={user ? "/chat" : "/auth"} />} />
      </Routes>
    </Router>
  );
}

export default App;
