import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { decodeFromNumbers } from '../utils/encode';

function isRTL(text) {
  // Detect Persian/Arabic characters
  return /[\u0600-\u06FF\u0750-\u077F]/.test(text);
}

function isNumberSequence(text) {
  return /^\d+(\s+\d+)*$/.test(text?.trim());
}

export default function MessageBubble({ msg, text, isAdmin, isFriendView, onDelete }) {
  const [isRevealed, setIsRevealed] = useState(false);
  const isOutgoing = isFriendView ? msg.sender === 'friend' : msg.sender === 'admin';
  const isNumbers = isNumberSequence(text);
  
  // Ephemeral timer for revealing message
  useEffect(() => {
    let timer;
    if (isRevealed) {
      timer = setTimeout(() => {
        setIsRevealed(false);
      }, 30000); // 30 seconds
    }
    return () => clearTimeout(timer);
  }, [isRevealed]);

  const toggleReveal = () => {
    if (isNumbers) setIsRevealed(!isRevealed);
  };

  const rtl = isRTL(text);
  const timeStr = msg.timestamp ? format(new Date(msg.timestamp), 'HH:mm') : '';

  // Determine what to display based on reveal state
  const displayContent = isNumbers && !isRevealed ? (
    <div className="radio-msg-wrapper">
      <span className="radio-signal-icon">📡</span>
      <span className="radio-numbers">{text}</span>
      <div className="radio-flicker-overlay"></div>
    </div>
  ) : (
    <span className={isRevealed ? 'revealed-text' : ''}>
      {isRevealed && isNumbers ? decodeFromNumbers(text) : text}
    </span>
  );

  return (
    <div className={`bubble-row ${isOutgoing ? 'outgoing' : 'incoming'}`}>
      <div 
        className={`bubble ${isOutgoing ? 'bubble-out' : 'bubble-in'} ${isNumbers && !isRevealed ? 'bubble-radio' : ''} ${isRevealed ? 'bubble-revealed' : ''}`}
        onClick={toggleReveal}
        style={{ cursor: isNumbers ? 'pointer' : 'default' }}
        title={isNumbers ? (isRevealed ? 'Click to hide' : 'Click to reveal (30s)') : ''}
      >
        <p
          className="bubble-text"
          dir={rtl ? 'rtl' : 'ltr'}
          style={{ textAlign: rtl ? 'right' : 'left' }}
        >
          {displayContent}
        </p>
        <div className="bubble-meta">
          <span className="bubble-time">{timeStr}</span>
          {isOutgoing && !isFriendView && (
            <button
              className="btn-delete-msg"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              title="Delete message"
            >
              ×
            </button>
          )}
          {!isFriendView && !isOutgoing && (
            <button
              className="btn-delete-msg"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              title="Delete message"
            >
              ×
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
