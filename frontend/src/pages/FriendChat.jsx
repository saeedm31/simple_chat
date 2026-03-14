import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFriendInfo, getFriendMessages, friendSendMessage } from '../utils/api';
import { encryptMessage, decryptMessage } from '../utils/crypto';
import { encodeToNumbers } from '../utils/encode';
import MessageBubble from '../components/MessageBubble';
import EncodeInput from '../components/EncodeInput';

import { deriveKey } from '../utils/crypto';

export default function FriendChat() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [activeToken, setActiveToken] = useState('');
  const [chatKey, setChatKey] = useState('');
  const [unlockPass, setUnlockPass] = useState('');
  const [friendName, setFriendName] = useState('');
  const [messages, setMessages] = useState([]);
  const [decrypted, setDecrypted] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sent, setSent] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    let currentToken = token || sessionStorage.getItem('friend_token');
    
    if (token) {
      // If arrived via direct link, save and mask URL
      sessionStorage.setItem('friend_token', token);
      setTimeout(() => navigate('/messenger', { replace: true }), 100);
    }

    if (!currentToken) {
      setError('No chat session found. Please find your chat on the home page.');
      setLoading(false);
      return;
    }

    setActiveToken(currentToken);

    // Check locally for encryption keys
    const localKeys = JSON.parse(localStorage.getItem('massenger_keys') || '{}');
    const key = localKeys[currentToken];
    if (key) {
      setChatKey(key);
      loadChat(currentToken, key);
    } else {
      setLoading(false);
    }
  }, [token, navigate]);

  const handleUnlock = (e) => {
    e.preventDefault();
    if (!unlockPass.trim()) return;
    const key = deriveKey(unlockPass.trim());
    
    // Save locally
    const localKeys = JSON.parse(localStorage.getItem('massenger_keys') || '{}');
    localKeys[activeToken] = key;
    localStorage.setItem('massenger_keys', JSON.stringify(localKeys));
    
    setChatKey(key);
    setUnlockPass('');
    setLoading(true);
    loadChat(activeToken, key);
  };

  const loadChat = async (targetToken, key) => {
    try {
      const [infoRes, msgRes] = await Promise.all([
        getFriendInfo(targetToken),
        getFriendMessages(targetToken),
      ]);
      setFriendName(infoRes.data.name);
      setMessages(msgRes.data);
      // Decrypt
      const dec = {};
      for (const msg of msgRes.data) {
        dec[msg.id] = await decryptMessage(msg.content_encrypted, msg.iv, key);
      }
      setDecrypted(dec);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch {
      setError('Invalid or expired chat session.');
    } finally {
      setLoading(false);
    }
  };


  const handleSend = async (text, isEncoded) => {
    const plaintext = isEncoded ? encodeToNumbers(text) : text;
    const { ciphertext, iv } = await encryptMessage(plaintext, chatKey);
    const res = await friendSendMessage(activeToken, {
      content_encrypted: ciphertext,
      iv,
      is_encoded: isEncoded,
    });
    const newMsg = res.data;
    setMessages((prev) => [...prev, newMsg]);
    setDecrypted((prev) => ({ ...prev, [newMsg.id]: plaintext }));
    setSent(true);
    setTimeout(() => {
      setSent(false);
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 1500);
  };

  if (error) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="logo-icon">🔒</div>
          <h2>Access Denied</h2>
          <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-page">
      <header className="chat-header">
        <div className="logo-icon-sm">📡</div>
        <div className="chat-header-info">
          <div className="chat-avatar">{friendName?.[0]?.toUpperCase() || '?'}</div>
          <div>
            <div className="chat-name">{friendName || 'Loading…'}</div>
            <div className="chat-sub">End-to-end encrypted · Massenger</div>
          </div>
        </div>
        <button
          id="friend-refresh-btn"
          className="btn-icon"
          onClick={() => loadChat(chatKey)}
          title="Refresh"
        >
          ↻
        </button>
      </header>

      <div className="messages-area">
        {!loading && !chatKey && (
          <div className="unlock-overlay">
            <div className="unlock-card">
              <span className="logo-icon">🔐</span>
              <h3>Encrypted Connection</h3>
              <p>This chat is secured with E2EE. Please enter the passphrase provided by your friend in person.</p>
              <form onSubmit={handleUnlock}>
                <input
                  type="password"
                  value={unlockPass}
                  onChange={(e) => setUnlockPass(e.target.value)}
                  placeholder="Secret Passphrase…"
                  autoFocus
                />
                <button type="submit" className="btn-primary">Unlock 📡</button>
              </form>
            </div>
          </div>
        )}
        {loading ? (
          <div className="empty-state">Loading…</div>
        ) : messages.length === 0 ? (
          <div className="empty-state">
            <p>Send your first message below! 👇</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              text={decrypted[msg.id] || '…'}
              isAdmin={msg.sender === 'admin'}
              isFriendView
            />
          ))
        )}
        {sent && (
          <div className="sent-toast">✅ Message sent!</div>
        )}
        <div ref={bottomRef} />
      </div>

      <EncodeInput onSend={handleSend} />
    </div>
  );
}
