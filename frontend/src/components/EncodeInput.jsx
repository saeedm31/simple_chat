import { useState } from 'react';
import { encodeToNumbers } from '../utils/encode';

export default function EncodeInput({ onSend }) {
  const [text, setText] = useState('');
  const [encoded, setEncoded] = useState('');
  const [step, setStep] = useState('write'); // 'write' | 'preview' | 'sending'

  const isRTL = (t) => /[\u0600-\u06FF]/.test(t);

  const handlePrepare = () => {
    if (!text.trim()) return;
    const nums = encodeToNumbers(text);
    setEncoded(nums);
    setStep('preview');
  };

  const handleTransmit = async () => {
    if (step === 'sending') return;
    setStep('sending');
    try {
      // Always send as encoded sequence
      await onSend(text, true); 
      setText('');
      setEncoded('');
      setStep('write');
    } catch (err) {
      console.error('Transmission failed:', err);
      // Reset state if it fails so it doesn't stay frozen in "sending" state
      setStep('preview');
    }
  };

  const handleCancel = () => {
    setEncoded('');
    setStep('write');
  };

  return (
    <div className="encode-input-container">
      {step === 'preview' && (
        <div className="radio-preview mystic-radio-mode">
          <div className="radio-preview-label">📡 Mystic Radio Transmission</div>
          <div className="radio-preview-numbers">{encoded}</div>
          <div className="radio-preview-actions">
            <button id="cancel-encode-btn" className="btn-ghost" onClick={handleCancel}>
              ✏️ Abort & Edit
            </button>
            <button id="send-encoded-btn" className="btn-primary" onClick={handleTransmit}>
              Transmit 📡
            </button>
          </div>
        </div>
      )}

      {step !== 'preview' && (
        <div className="compose-row">
          <textarea
            id="message-input"
            className="compose-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a mystic message…"
            rows={1}
            dir={isRTL(text) ? 'rtl' : 'ltr'}
            disabled={step === 'sending'}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (text.trim()) handlePrepare();
              }
            }}
          />
          <div className="compose-buttons">
            <button
              id="transmit-btn"
              className="btn-send"
              onClick={handlePrepare}
              disabled={!text.trim() || step === 'sending'}
              title="Prepare Transmission"
            >
              {step === 'sending' ? '…' : '📡'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
