import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin, lookupFriend } from '../utils/api';

export default function Home() {
  // Friend Portal State
  const [friendName, setFriendName] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [searching, setSearching] = useState(false);

  // Admin Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!friendName.trim()) return;
    setLookupError('');
    setSearching(true);
    try {
      const res = await lookupFriend(friendName.trim());
      sessionStorage.setItem('friend_token', res.data.token);
      navigate('/messenger');
    } catch (err) {
      setLookupError('Sorry, we couldn’t find a chat with that name.');
    } finally {
      setSearching(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAdminError('');
    setLoading(true);
    try {
      const res = await adminLogin(username, password);
      localStorage.setItem('massenger_token', res.data.access_token);
      localStorage.setItem('massenger_user', res.data.username);
      navigate('/dashboard');
    } catch {
      setAdminError('Invalid admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      {/* Main Friend Portal - Center */}
      <div className="friend-portal-section">
        <div className="hero-content">
          <div className="logo-pulse">📡</div>
          <h1>SimpleChat</h1>
          <p>Secure, private, and always encrypted.</p>
        </div>

        <form onSubmit={handleLookup} className="portal-form">
          <div className="portal-input-wrapper">
            <input
              type="text"
              value={friendName}
              onChange={(e) => setFriendName(e.target.value)}
              placeholder="Enter your name to find your chat…"
              className="portal-input"
            />
            <button type="submit" className="portal-btn" disabled={searching}>
              {searching ? 'Searching…' : 'Enter Chat ‹'}
            </button>
          </div>
          {lookupError && <p className="lookup-error">{lookupError}</p>}
        </form>
      </div>

      {/* Admin Login - Bottom */}
      <div className="admin-login-drawer">
        <div className="drawer-header">
          <span>Admin Access</span>
        </div>
        <form onSubmit={handleAdminLogin} className="mini-login-form">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            autoComplete="username"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
          />
          <button type="submit" disabled={loading}>
            {loading ? '…' : 'Login'}
          </button>
        </form>
        {adminError && <p className="admin-error-text">{adminError}</p>}
      </div>
    </div>
  );
}
