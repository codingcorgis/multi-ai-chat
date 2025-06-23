import React from 'react';

const Message = ({ message, onDelete }) => {
  const { text, sender, order, timestamp, id } = message;

  const formatTime = (ts) => {
    return new Date(ts).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAvatarText = () => {
    if (sender === 'User') return 'U';
    if (sender === 'System') return 'S';
    // For AI agents, use the first letter of their name
    return sender.charAt(0).toUpperCase();
  };
  
  const getAvatarColor = () => {
    // A simple hash function to get a color for a string
    let hash = 0;
    for (let i = 0; i < sender.length; i++) {
      hash = sender.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    const color = "00000".substring(0, 6 - c.length) + c;

    if (sender === 'User') return '#007bff';
    if (sender === 'System') return '#6c757d';
    return `#${color}`;
  };

  return (
    <div className={`message ${sender === 'User' ? 'user' : 'ai'}`}>
      <div className="message-content">
        <div className="message-header">
          <div className="message-info">
            <div
              className="avatar"
              style={{ backgroundColor: getAvatarColor() }}
            >
              {order && <span className="order-number">{order}</span>}
              {getAvatarText()}
            </div>
            <div className="message-details">
              <div className="sender-name">{sender}</div>
              <div className="timestamp">{formatTime(timestamp)}</div>
            </div>
          </div>
          {sender !== 'System' && (
            <button
              className="delete-message-btn"
              onClick={onDelete}
              title="Delete this message"
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
