import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFriends, createFriend, deleteFriend } from '../utils/api';
import { generateKey } from '../utils/crypto';

const BASE_ORIGIN = window.location.origin;

export default function Dashboard() {
  const [friends, setFriends] = useState([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState(null);
  const navigate = useNavigate();

  const load = async () => {
    try {
      const res = await getFriends();
      setFriends(res.data);
    } catch {
      localStorage.clear();
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem('massenger_token')) navigate('/login');
    else load();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    try {
      // True E2EE: Generate key in browser
      const key = generateKey();
      
      const res = await createFriend(newName.trim());
      const newFriend = res.data;

      // Save key locally mapping by ID
      const localKeys = JSON.parse(localStorage.getItem('massenger_keys') || '{}');
      localKeys[newFriend.id] = key;
      localStorage.setItem('massenger_keys', JSON.stringify(localKeys));

      setNewName('');
      // Attach key locally for immediate UI use
      setFriends((prev) => [{ ...newFriend, chat_key: key }, ...prev]);
      alert(`Success: ${newName.trim()} added!`);
    } catch (err) {
      console.error('Failed to add friend:', err);
      alert('Error: Failed to add friend. Please check connection.');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    console.log('Delete button clicked for friend ID:', id);
    if (!confirm('Remove this friend and all their messages?')) return;
    try {
      console.log('Confirmed deletion for ID:', id);
      const res = await deleteFriend(id);
      console.log('Delete response:', res.data);
      
      // Clean up local key
      const localKeys = JSON.parse(localStorage.getItem('massenger_keys') || '{}');
      delete localKeys[id];
      localStorage.setItem('massenger_keys', JSON.stringify(localKeys));

      setFriends((prev) => prev.filter((f) => f.id !== id));
      alert('Friend removed successfully.');
    } catch (err) {
      console.error('Failed to delete friend:', err);
      alert(`Error: Failed to remove friend. ${err.response?.data?.detail || err.message}`);
    }
  };

  const inviteLink = (f) => {
    const localKeys = JSON.parse(localStorage.getItem('massenger_keys') || '{}');
    const key = f.chat_key || localKeys[f.id] || '';
    return `${BASE_ORIGIN}/f/${f.token}#key=${encodeURIComponent(key)}`;
  };

  const copyToClipboard = (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    } else {
      // Fallback for non-secure contexts (Self-signed IP)
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (err) {
        console.error('Fallback copy failed', err);
      }
      document.body.removeChild(textArea);
      return Promise.resolve();
    }
  };

  const copyLink = async (f, e) => {
    e.stopPropagation();
    try {
      await copyToClipboard(inviteLink(f));
      setCopied(f.id);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
      alert('Failed to copy link. Please copy it manually from the screen.');
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="dashboard-page">
      <header className="dash-header">
        <div className="dash-title">
          <span className="logo-icon-sm">📡</span>
          <span>SimpleChat</span>
        </div>
        <button id="logout-btn" onClick={logout} className="btn-ghost">
          Logout
        </button>
      </header>

      <div className="dash-content">
        <form onSubmit={handleAdd} className="add-friend-form">
          <input
            id="friend-name-input"
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Friend's name…"
            maxLength={60}
          />
          <button id="add-friend-btn" type="submit" className="btn-primary" disabled={adding}>
            {adding ? '…' : '+ Add'}
          </button>
        </form>

        {loading ? (
          <div className="empty-state">Loading…</div>
        ) : friends.length === 0 ? (
          <div className="empty-state">
            <span>👥</span>
            <p>No friends yet. Add your first one above!</p>
          </div>
        ) : (
          <ul className="friend-list">
            {friends.map((f) => {
              // Retrieve key from local storage if not in object
              const localKeys = JSON.parse(localStorage.getItem('massenger_keys') || '{}');
              const key = f.chat_key || localKeys[f.id];
              const fWithKey = { ...f, chat_key: key };

              return (
                <li
                  key={f.id}
                  className="friend-card"
                  onClick={() => navigate(`/chat/${f.id}`, { state: { friend: fWithKey } })}
                >
                  <div className="friend-avatar">{f.name[0].toUpperCase()}</div>
                  <div className="friend-info">
                    <div className="friend-name">{f.name}</div>
                    <div className="friend-link-preview">
                      {inviteLink(fWithKey).substring(0, 40)}…
                    </div>
                  </div>
                  <div className="friend-actions">
                    {f.unread_count > 0 && (
                      <span className="unread-badge">{f.unread_count}</span>
                    )}
                    <button
                      id={`copy-${f.id}`}
                      className="btn-icon"
                      title="Copy invite link"
                      onClick={(e) => copyLink(fWithKey, e)}
                    >
                      {copied === f.id ? '✅' : '🔗'}
                    </button>
                    <button
                      id={`del-${f.id}`}
                      className="btn-icon btn-danger"
                      title="Remove friend"
                      onClick={(e) => handleDelete(f.id, e)}
                    >
                      🗑
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
