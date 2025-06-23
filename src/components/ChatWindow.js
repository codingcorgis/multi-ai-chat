import React, { useState, useEffect, useRef } from 'react';
import Message from './Message';
import MessageInput from './MessageInput';
import AgentManager from './AgentManager';
import SummaryToolbar from './SummaryToolbar';

const ChatWindow = () => {
  const [messages, setMessages] = useState([
    { text: 'Welcome to brAIn Trust! Add an agent to begin.', sender: 'System', timestamp: new Date(), id: 'system-start' },
  ]);
  const [agents, setAgents] = useState([]);
  const [status, setStatus] = useState('Ready');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleAgentsChange = (newAgents) => {
    setAgents(newAgents);
  };

  const handleSendMessage = async (text) => {
    const userMessage = { text, sender: 'User', timestamp: new Date(), id: 'user-' + Date.now() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    if (agents.filter(a => a.active !== false).length === 0) return;

    setIsProcessing(true);
    setStatus('Processing with agents...');

    try {
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages,
          agents: agents.filter(a => a.active !== false),
        }),
      });

      const data = await response.json();
      
      const aiResponses = data.responses.map((res, index) => ({
        ...res,
        timestamp: new Date(),
        id: 'ai-' + Date.now() + '-' + index
      }));

      setMessages(prev => [...prev, ...aiResponses]);
      setStatus('Ready');
    } catch (error) {
      console.error('Error fetching AI response:', error);
      setMessages(prev => [
        ...prev,
        { text: 'Sorry, something went wrong.', sender: 'System', timestamp: new Date(), id: 'system-error-' + Date.now() },
      ]);
      setStatus('Error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleContinueConversation = async () => {
    if (agents.filter(a => a.active !== false).length === 0) return;
    
    setIsProcessing(true);
    setStatus('Continuing conversation with agents...');

    try {
      const response = await fetch('http://localhost:3001/api/continue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages,
          agents: agents.filter(a => a.active !== false),
        }),
      });

      const data = await response.json();
      
      const aiResponses = data.responses.map((res, index) => ({
        ...res,
        timestamp: new Date(),
        id: 'ai-' + Date.now() + '-' + index
      }));

      setMessages(prev => [...prev, ...aiResponses]);
      setStatus('Ready');
    } catch (error) {
      console.error('Error continuing conversation:', error);
      setMessages(prev => [
        ...prev,
        { text: 'Sorry, something went wrong while continuing.', sender: 'System', timestamp: new Date(), id: 'system-error-' + Date.now() },
      ]);
      setStatus('Error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearChat = () => {
    if (messages.length > 1) {
      if (window.confirm('Are you sure you want to clear the chat? This cannot be undone.')) {
        setMessages([
          { text: 'Welcome to brAIn Trust! Add an agent to begin.', sender: 'System', timestamp: new Date(), id: 'system-start' },
        ]);
        setStatus('Ready');
      }
    }
  };

  const handleDeleteMessage = (messageId) => {
    const messageToDelete = messages.find(m => m.id === messageId);
    if (!messageToDelete) return;
    
    if (window.confirm(`Are you sure you want to delete the message from ${messageToDelete.sender}?`)) {
      setMessages(prev => prev.filter(m => m.id !== messageId));
    }
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-title">
          <h1>brAIn Trust</h1>
        </div>
        <div className="status-bar">
          <div className="status-indicator">
            <span className={`status-dot ${isProcessing ? 'processing' : 'ready'}`}></span>
            <span className="status-text">{status}</span>
          </div>
          <button 
            className="clear-chat-btn"
            onClick={handleClearChat}
            disabled={isProcessing || messages.length <= 1}
            title="Clear chat"
          >
            🗑️ Clear Chat
          </button>
        </div>
      </div>
      
      <div className="chat-main-content">
        <div className="chat-container">
          <div className="messages">
            {messages.map((message) => (
              <Message
                key={message.id}
                message={message}
                onDelete={() => handleDeleteMessage(message.id)}
              />
            ))}
            {isProcessing && (
              <div className="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <MessageInput 
            onSendMessage={handleSendMessage} 
            onContinueConversation={handleContinueConversation}
            disabled={isProcessing || agents.filter(a => a.active !== false).length === 0} 
            canContinue={messages.length > 1 && !isProcessing && agents.filter(a => a.active !== false).length > 0}
          />
        </div>
        
        <div className="right-toolbar">
          <div className="toolbar-section">
            <AgentManager
              agents={agents}
              onAgentsChange={handleAgentsChange}
            />
          </div>
          <div className="toolbar-section">
            <SummaryToolbar messages={messages} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
