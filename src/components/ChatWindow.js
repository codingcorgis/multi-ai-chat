import React, { useState, useEffect, useRef } from 'react';
import Message from './Message';
import MessageInput from './MessageInput';
import ModelSelector from './ModelSelector';
import SummaryToolbar from './SummaryToolbar';

const ChatWindow = () => {
  const [messages, setMessages] = useState([
    { text: 'Hello! Ask me anything.', sender: 'System', timestamp: new Date() },
  ]);
  const [selectedModels, setSelectedModels] = useState({
    gemini: true,
    chatgpt: true,
    claude: true,
  });
  const [modelOrder, setModelOrder] = useState({
    gemini: 1,
    chatgpt: 2,
    claude: 3,
  });
  const [status, setStatus] = useState('Ready');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    console.log('Model order updated:', modelOrder);
  }, [modelOrder]);

  const handleSendMessage = async (text) => {
    const userMessage = { text, sender: 'User', timestamp: new Date() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsProcessing(true);

    try {
      // Show initial status
      setStatus('Processing with selected AIs...');
      
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages,
          selectedModels,
          modelOrder,
        }),
      });

      const data = await response.json();
      
      // Add order numbers to AI responses based on their sequence
      let aiOrder = 1;
      const aiResponses = data.responses.map(res => ({
        text: res.message,
        sender: res.model,
        order: aiOrder++,
        timestamp: new Date()
      }));

      setMessages([...newMessages, ...aiResponses]);
      setStatus('Ready');
    } catch (error) {
      console.error('Error fetching AI response:', error);
      setMessages([
        ...newMessages,
        { text: 'Sorry, something went wrong.', sender: 'System', timestamp: new Date() },
      ]);
      setStatus('Error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleContinueConversation = async () => {
    setIsProcessing(true);

    try {
      setStatus('Continuing conversation with AIs...');
      
      const response = await fetch('http://localhost:3001/api/continue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages,
          selectedModels,
          modelOrder,
        }),
      });

      const data = await response.json();
      
      // Add order numbers to AI responses based on their sequence
      let aiOrder = 1;
      const aiResponses = data.responses.map(res => ({
        text: res.message,
        sender: res.model,
        order: aiOrder++,
        timestamp: new Date()
      }));

      setMessages([...messages, ...aiResponses]);
      setStatus('Ready');
    } catch (error) {
      console.error('Error continuing conversation:', error);
      setMessages([
        ...messages,
        { text: 'Sorry, something went wrong while continuing the conversation.', sender: 'System', timestamp: new Date() },
      ]);
      setStatus('Error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOrderChange = (newOrder) => {
    console.log('Order changed to:', newOrder);
    setModelOrder(newOrder);
  };

  const handleClearChat = () => {
    const hasConversation = messages.length > 1;
    
    if (hasConversation) {
      const confirmed = window.confirm('Are you sure you want to clear the chat? This will start a fresh conversation and cannot be undone.');
      if (!confirmed) {
        return;
      }
    }
    
    setMessages([
      { text: 'Hello! Ask me anything.', sender: 'System', timestamp: new Date() },
    ]);
    setStatus('Ready');
    setIsProcessing(false);
  };

  return (
    <div className="chat-window">
      {/* Fixed Header */}
      <div className="chat-header">
        <div className="chat-title">
          <h1>Multi AI Group Chat</h1>
        </div>
        <ModelSelector
          selectedModels={selectedModels}
          onModelChange={setSelectedModels}
          onOrderChange={handleOrderChange}
          modelOrder={modelOrder}
        />
        
        {/* Status Bar */}
        <div className="status-bar">
          <div className="status-indicator">
            <span className={`status-dot ${isProcessing ? 'processing' : 'ready'}`}></span>
            <span className="status-text">{status}</span>
          </div>
          <button 
            className="clear-chat-btn"
            onClick={handleClearChat}
            disabled={isProcessing}
            title="Clear chat and start fresh"
          >
            🗑️ {messages.length > 1 ? 'Clear Chat' : 'New Chat'}
          </button>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="chat-main-content">
        {/* Scrollable Chat Container */}
        <div className="chat-container">
          <div className="messages">
            {messages.map((message, index) => (
              <Message
                key={index}
                text={message.text}
                sender={message.sender}
                order={message.order}
                timestamp={message.timestamp}
              />
            ))}
            {isProcessing && (
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <MessageInput 
            onSendMessage={handleSendMessage} 
            onContinueConversation={handleContinueConversation}
            disabled={isProcessing} 
            canContinue={messages.length > 1 && !isProcessing}
          />
        </div>
        
        {/* Summary Toolbar */}
        <SummaryToolbar messages={messages} />
      </div>
    </div>
  );
};

export default ChatWindow;
