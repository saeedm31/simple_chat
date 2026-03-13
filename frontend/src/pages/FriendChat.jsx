import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getFriendInfo, getFriendMessages, friendSendMessage } from '../utils/api';
import { encryptMessage, decryptMessage } from '../utils/crypto';
import { encodeToNumbers } from '../utils/encode';
import MessageBubble from '../components/MessageBubble';
import EncodeInput from '../components/EncodeInput';

export default function FriendChat() {
  const { token } = useParams();
  const [chatKey, setChatKey] = useState('');
  const [friendName, setFriendName] = useState('');
  const [messages, setMessages] = useState([]);
  const [decrypted, setDecrypted] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sent, setSent] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    // Extract AES key from URL hash: #key=<base64key>
    const hash = window.location.hash;
    const match = hash.match(/[#&]key=([^&]+)/);
    if (!match) {
      setError('Invalid invite link — missing encryption key.');
      setLoading(false);
      return;
    }
    const key = decodeURIComponent(match[1]);
    setChatKey(key);
    loadChat(key);
  }, [token]);

  const loadChat = async (key) => {
    try {
      const [infoRes, msgRes] = await Promise.all([
        getFriendInfo(token),
        getFriendMessages(token),
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
      setError('Invalid or expired invite link.');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (text, isEncoded) => {
    const plaintext = isEncoded ? encodeToNumbers(text) : text;
    const { ciphertext, iv } = await encryptMessage(plaintext, chatKey);
    const res = await friendSendMessage(token, {
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
