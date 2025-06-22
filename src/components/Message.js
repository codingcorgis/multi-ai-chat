import React from 'react';

const Message = ({ text, sender, order, timestamp, onDelete, index }) => {
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getAvatarText = (sender) => {
    if (sender === 'User') return 'U';
    if (sender === 'System') return 'S';
    return sender.charAt(0).toUpperCase();
  };

  const getAvatarColor = (sender) => {
    if (sender === 'User') return '#007bff';
    if (sender === 'System') return '#6c757d';
    if (sender === 'Gemini') return '#4285f4';
    if (sender === 'Chatgpt') return '#10a37f';
    if (sender === 'Claude') return '#ff6b35';
    return '#444b58';
  };

  return (
    <div className={`message ${sender.toLowerCase()}`}>
      <div className="message-content">
        <div className="message-header">
          <div className="message-info">
            <div 
              className="avatar" 
              style={{ backgroundColor: getAvatarColor(sender) }}
            >
              {order && <span className="order-number">{order}</span>}
              {getAvatarText(sender)}
            </div>
            <div className="message-details">
              <div className="sender-name">{sender}</div>
              <div className="timestamp">{formatTime(timestamp)}</div>
            </div>
          </div>
          {sender !== 'User' && sender !== 'System' && (
            <button 
              className="delete-message-btn"
              onClick={() => onDelete(index)}
              title="Delete this response"
            >
              ✕
            </button>
          )}
        </div>
        <div className="message-text">{text}</div>
      </div>
    </div>
  );
};

export default Message;
