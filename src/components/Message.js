import React from 'react';

const Message = ({ text, sender, order, timestamp }) => {
  const isUser = sender === 'User';
  const isSystem = sender === 'System';
  
  let avatar;
  if (isUser) {
    avatar = 'U';
  } else if (isSystem) {
    avatar = 'S';
  } else {
    // For AI messages, show the first letter and order number
    avatar = sender.charAt(0).toUpperCase();
  }

  const formatTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`message ${isUser ? 'user' : ''}`}>
      <div className="avatar">
        {avatar}
        {!isUser && !isSystem && order && (
          <span className="order-number">{order}</span>
        )}
      </div>
      <div className="content">
        {!isUser && <strong>{sender}</strong>}
        <div>{text}</div>
      </div>
      {timestamp && <span className="timestamp">{formatTime(timestamp)}</span>}
    </div>
  );
};

export default Message;
