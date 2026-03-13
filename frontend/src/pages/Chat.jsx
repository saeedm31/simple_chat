import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { getAdminChat, adminReply, deleteMessage, getFriends } from '../utils/api';
import { encryptMessage, decryptMessage } from '../utils/crypto';
import { encodeToNumbers } from '../utils/encode';
import MessageBubble from '../components/MessageBubble';
import EncodeInput from '../components/EncodeInput';

export default function Chat() {
  const { friendId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [friend, setFriend] = useState(location.state?.friend || null);
  const [messages, setMessages] = useState([]);
  const [decrypted, setDecrypted] = useState({});
  const [loading, setLoading] = useState(true);
  const [unlockPass, setUnlockPass] = useState('');
  const bottomRef = useRef(null);

  // Load friend info if not passed via state
  useEffect(() => {
    if (!localStorage.getItem('massenger_token')) { navigate('/login'); return; }
    
    // Retrieve key locally for True E2EE
    const localKeys = JSON.parse(localStorage.getItem('massenger_keys') || '{}');
    const localKey = localKeys[friendId];
    console.log(`Chat: Friend ID ${friendId}, Key found in storage: ${!!localKey}`);

    const updateFriend = (f) => {
      const k = f.chat_key || localKeys[f.id];
      setFriend({ ...f, chat_key: k });
    };

    if (!friend || !friend.chat_key) {
      getFriends().then((res) => {
        const f = res.data.find((x) => x.id === parseInt(friendId));
        if (f) {
           updateFriend(f);
        } else {
           navigate('/dashboard');
        }
      });
    }
  }, [friendId, friend]);

  useEffect(() => {
    if (!friend || !friend.chat_key) return;
    loadMessages();
  }, [friend]);

  const loadMessages = async () => {
    const res = await getAdminChat(friendId);
    setMessages(res.data);
    setLoading(false);
    // Decrypt all messages using the friend's local chat_key
    const dec = {};
    for (const msg of res.data) {
      dec[msg.id] = await decryptMessage(msg.content_encrypted, msg.iv, friend.chat_key);
    }
    setDecrypted(dec);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleSend = async (text, isEncoded) => {
    try {
      if (!friend?.chat_key) {
        throw new Error('Encryption key missing. Try refreshing the page or re-adding the friend.');
      }
      // text is the original message, isEncoded is always true now
      const plaintext = isEncoded ? encodeToNumbers(text) : text;
      const { ciphertext, iv } = await encryptMessage(plaintext, friend.chat_key);
      const res = await adminReply(friendId, {
        content_encrypted: ciphertext,
        iv,
        is_encoded: isEncoded,
      });
      const newMsg = res.data;
      setMessages((prev) => [...prev, newMsg]);
      setDecrypted((prev) => ({ ...prev, [newMsg.id]: plaintext }));
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      console.error('Send message failed:', err);
      alert('Error: ' + err.message);
      throw err; // Re-throw to let EncodeInput know it failed
    }
  };

  const handleUnlock = (e) => {
    e.preventDefault();
    if (!unlockPass.trim()) return;
    const key = deriveKey(unlockPass.trim());
    
    // Save locally
    const localKeys = JSON.parse(localStorage.getItem('massenger_keys') || '{}');
    localKeys[friendId] = key;
    localStorage.setItem('massenger_keys', JSON.stringify(localKeys));
    
    setFriend((prev) => ({ ...prev, chat_key: key }));
    setUnlockPass('');
  };

  const handleDelete = async (msgId) => {
    await deleteMessage(msgId);
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
  };

  return (
    <div className="chat-page">
      <header className="chat-header">
        <button id="back-btn" className="btn-icon" onClick={() => navigate('/dashboard')}>
          ‹
        </button>
        <div className="chat-header-info">
          <div className="chat-avatar">{friend?.name?.[0]?.toUpperCase() || '?'}</div>
          <div>
            <div className="chat-name">{friend?.name || '…'}</div>
            <div className="chat-sub">End-to-end encrypted</div>
          </div>
        </div>
        <button id="refresh-btn" className="btn-icon" onClick={loadMessages} title="Refresh">
          ↻
        </button>
      </header>

      <div className="messages-area">
        {!loading && friend && !friend.chat_key && (
          <div className="unlock-overlay">
            <div className="unlock-card">
              <span className="logo-icon">🔐</span>
              <h3>Chat Locked</h3>
              <p>Enter the secret passphrase to unlock this conversation.</p>
              <form onSubmit={handleUnlock}>
                <input
                  type="password"
                  value={unlockPass}
                  onChange={(e) => setUnlockPass(e.target.value)}
                  placeholder="Passphrase…"
                  autoFocus
                />
                <button type="submit" className="btn-primary">Unlock 📡</button>
              </form>
            </div>
          </div>
        )}
        {loading ? (
          <div className="empty-state">Loading messages…</div>
        ) : messages.length === 0 ? (
          <div className="empty-state">
            <p>No messages yet. Share the invite link with your friend!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              text={decrypted[msg.id] || '…'}
              isAdmin={msg.sender === 'admin'}
              onDelete={() => handleDelete(msg.id)}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <EncodeInput onSend={handleSend} />
    </div>
  );
}
