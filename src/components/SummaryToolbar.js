import React, { useState, useEffect } from 'react';

const SummaryToolbar = ({ messages }) => {
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastMessageCount, setLastMessageCount] = useState(0);

  const generateSummary = async () => {
    if (messages.length <= 1) {
      setSummary('');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages.filter(msg => msg.sender !== 'System'),
        }),
      });

      const data = await response.json();
      if (data.summary) {
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      setSummary('Failed to generate summary');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only regenerate summary if message count has changed significantly
    if (Math.abs(messages.length - lastMessageCount) >= 2) {
      setLastMessageCount(messages.length);
      generateSummary();
    }
  }, [messages]);

  return (
    <div className="summary-toolbar">
      <div className="summary-header">
        <h3>Chat Summary</h3>
        <button 
          className="refresh-summary-btn"
          onClick={generateSummary}
          disabled={isLoading || messages.length <= 1}
        >
          {isLoading ? '⏳' : '🔄'}
        </button>
      </div>
      
      <div className="summary-content">
        {messages.length <= 1 ? (
          <p className="no-summary">Start a conversation to see a summary</p>
        ) : isLoading ? (
          <div className="summary-loading">
            <span></span>
            <span></span>
            <span></span>
          </div>
        ) : (
          <div className="summary-text">
            {summary || 'Click refresh to generate summary'}
          </div>
        )}
      </div>
      
      <div className="summary-stats">
        <div className="stat">
          <span className="stat-label">Messages:</span>
          <span className="stat-value">{messages.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Participants:</span>
          <span className="stat-value">
            {new Set(messages.map(m => m.sender)).size}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SummaryToolbar; 