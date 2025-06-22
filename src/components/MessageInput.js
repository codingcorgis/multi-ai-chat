import React, { useState } from 'react';

const MessageInput = ({ onSendMessage, onContinueConversation, disabled = false, canContinue = false }) => {
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (event) => {
    if (!disabled) {
      setInputValue(event.target.value);
    }
  };

  const handleSendClick = () => {
    if (inputValue.trim() && !disabled) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !disabled) {
      handleSendClick();
    }
  };

  return (
    <div className="message-input">
      <input
        type="text"
        placeholder={disabled ? "Processing..." : "Type your message..."}
        value={inputValue}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        disabled={disabled}
      />
      <div className="message-buttons">
        <button onClick={handleSendClick} disabled={disabled}>
          {disabled ? "Processing..." : "Send"}
        </button>
        <button 
          onClick={onContinueConversation} 
          disabled={disabled || !canContinue}
          className="continue-btn"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
