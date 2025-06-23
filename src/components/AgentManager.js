import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

const AgentModal = ({ agent, onSave, onClose }) => {
  const [name, setName] = useState(agent?.name || '');
  const [model, setModel] = useState(agent?.model || 'chatgpt');
  const [personality, setPersonality] = useState(agent?.personality || '');

  const handleSave = () => {
    if (!name) {
      alert('Please provide a name for the agent.');
      return;
    }
    onSave({
      ...agent,
      id: agent?.id || uuidv4(),
      name,
      model,
      personality,
      active: agent?.active !== false // default to true if undefined
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{agent?.id ? 'Edit' : 'Add'} Agent</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Agent Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Sarcastic Pirate"
            />
          </div>
          <div className="form-group">
            <label>AI Model</label>
            <select value={model} onChange={(e) => setModel(e.target.value)}>
              <option value="chatgpt">ChatGPT (OpenAI)</option>
              <option value="gemini">Gemini (Google)</option>
              <option value="claude">Claude (Anthropic)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Personality Prompt</label>
            <textarea
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              placeholder="e.g., You are a pirate. You speak in pirate slang."
              rows={5}
            />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSave}>
            Save Agent
          </button>
        </div>
      </div>
    </div>
  );
};

const AgentManager = ({ agents, onAgentsChange }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [draggedAgentId, setDraggedAgentId] = useState(null);

  const handleAddAgent = () => {
    setEditingAgent(null);
    setIsModalOpen(true);
  };

  const handleEditAgent = (agent) => {
    setEditingAgent(agent);
    setIsModalOpen(true);
  };

  const handleSaveAgent = (savedAgent) => {
    const newAgents = [...agents];
    const index = newAgents.findIndex(a => a.id === savedAgent.id);

    if (index > -1) {
      newAgents[index] = savedAgent;
    } else {
      newAgents.push(savedAgent);
    }
    onAgentsChange(newAgents);
    setIsModalOpen(false);
  };

  const handleDeleteAgent = (agentId) => {
    if (window.confirm('Are you sure you want to delete this agent?')) {
      onAgentsChange(agents.filter(a => a.id !== agentId));
    }
  };

  const handleMuteAgent = (agentId) => {
    onAgentsChange(
      agents.map(a =>
        a.id === agentId ? { ...a, active: !a.active } : a
      )
    );
  };

  const handleDragStart = (e, agentId) => {
    setDraggedAgentId(agentId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    const draggedIndex = agents.findIndex(a => a.id === draggedAgentId);
    const newAgents = [...agents];
    const [draggedItem] = newAgents.splice(draggedIndex, 1);
    newAgents.splice(dropIndex, 0, draggedItem);
    onAgentsChange(newAgents);
    setDraggedAgentId(null);
  };

  return (
    <div className="agent-manager">
      <div className="agent-manager-header">
        <h2>Agent Lineup</h2>
        <button className="btn-primary" onClick={handleAddAgent}>
          + Add Agent
        </button>
      </div>
      <div className="agent-list" onDragOver={(e) => e.preventDefault()}>
        {agents.map((agent, index) => (
          <div
            key={agent.id}
            className={`agent-card${agent.active === false ? ' muted' : ''}`}
            draggable
            onDragStart={(e) => handleDragStart(e, agent.id)}
            onDrop={(e) => handleDrop(e, index)}
          >
            <div className="agent-info">
              <div className="agent-order-handle">⠿</div>
              <div className="agent-details">
                <span className="agent-name">{agent.name}</span>
                <span className="agent-model">{agent.model}</span>
              </div>
            </div>
            <div className="agent-actions">
              <button onClick={() => handleMuteAgent(agent.id)} title={agent.active === false ? 'Unmute agent' : 'Mute agent'}>
                {agent.active === false ? '🔈' : '🔇'}
              </button>
              <button onClick={() => handleEditAgent(agent)}>Edit</button>
              <button onClick={() => handleDeleteAgent(agent.id)}>Delete</button>
            </div>
          </div>
        ))}
        {agents.length === 0 && (
          <div className="empty-agents">
            <p>No agents yet.</p>
            <p>Click "+ Add Agent" to start building your brAIn Trust.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <AgentModal
          agent={editingAgent}
          onSave={handleSaveAgent}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default AgentManager; 