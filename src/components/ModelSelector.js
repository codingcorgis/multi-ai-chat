import React, { useState } from 'react';

const ModelSelector = ({ selectedModels, onModelChange, onOrderChange, modelOrder, healthStatus, aiPersonalities, onPersonalityChange }) => {
  const [draggedModel, setDraggedModel] = useState(null);
  const [settingsModal, setSettingsModal] = useState({ show: false, model: null });

  const getOrderedModels = (isActive) => {
    return Object.entries(modelOrder)
      .filter(([model]) => selectedModels[model] === isActive)
      .sort(([, a], [, b]) => a - b)
      .map(([model]) => model);
  };

  const activeModels = getOrderedModels(true);
  const standbyModels = getOrderedModels(false);

  const handleDragStart = (e, model) => {
    setDraggedModel(model);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDropOnActive = (e) => {
    e.preventDefault();
    if (!draggedModel || selectedModels[draggedModel]) return;

    const newSelected = { ...selectedModels, [draggedModel]: true };
    const newOrder = { ...modelOrder, [draggedModel]: activeModels.length + 1 };
    
    onModelChange(newSelected);
    onOrderChange(newOrder);
    setDraggedModel(null);
  };
  
  const handleDropOnStandby = (e) => {
    e.preventDefault();
    if (!draggedModel || !selectedModels[draggedModel]) return;

    const newSelected = { ...selectedModels, [draggedModel]: false };
    
    const newActiveModels = activeModels.filter(m => m !== draggedModel);
    const newOrder = { ...modelOrder };
    newActiveModels.forEach((model, index) => {
      newOrder[model] = index + 1;
    });

    onModelChange(newSelected);
    onOrderChange(newOrder);
    setDraggedModel(null);
  };

  const handleDropOnSlot = (e, dropModel) => {
    e.preventDefault();
    if (!draggedModel || draggedModel === dropModel || !selectedModels[draggedModel]) return;

    const dragIndex = modelOrder[draggedModel];
    const dropIndex = modelOrder[dropModel];

    const newOrder = { ...modelOrder, [draggedModel]: dropIndex, [dropModel]: dragIndex };

    onOrderChange(newOrder);
    setDraggedModel(null);
  };

  const getHealthIndicator = (model) => {
    if (!healthStatus || !healthStatus[model]) {
      return <span className="health-dot loading" title="Checking availability...">⏳</span>;
    }
    
    const status = healthStatus[model];
    if (status.available) {
      return <span className="health-dot available" title="Available">🟢</span>;
    } else {
      return <span className="health-dot unavailable" title={`Unavailable: ${status.error}`}>🔴</span>;
    }
  };

  const openSettings = (model) => {
    setSettingsModal({ show: true, model });
  };

  const closeSettings = () => {
    setSettingsModal({ show: false, model: null });
  };

  const handlePersonalitySave = (personality) => {
    onPersonalityChange(settingsModal.model, personality);
    closeSettings();
  };

  const renderModelSlot = (model, isActive = true) => (
    <div
      key={model}
      className={isActive ? "order-slot" : "standby-slot"}
      draggable
      onDragStart={(e) => handleDragStart(e, model)}
      onDragOver={handleDragOver}
      onDrop={isActive ? (e) => handleDropOnSlot(e, model) : undefined}
    >
      <div className="slot-header">
        {isActive && <div className="slot-number">AI {modelOrder[model]}</div>}
        <button 
          className="settings-btn"
          onClick={(e) => {
            e.stopPropagation();
            openSettings(model);
          }}
          title="Set AI personality"
        >
          ⚙️
        </button>
      </div>
      <div className="model-name">
        {getHealthIndicator(model)}
        {model.charAt(0).toUpperCase() + model.slice(1)}
      </div>
      {aiPersonalities[model] && (
        <div className="personality-indicator" title="Personality set">
          🎭
        </div>
      )}
    </div>
  );

  return (
    <div className="model-selector">
      <h2>AI Response Order</h2>
      <div className="model-selector-container">
        {/* Active AI Order Section */}
        <div 
          className="model-order-section"
          onDragOver={handleDragOver}
          onDrop={handleDropOnActive}
        >
          <h3>Active AIs</h3>
          <div className="model-order-slots">
            {activeModels.map((model) => renderModelSlot(model, true))}
          </div>
        </div>

        {/* Standby Section */}
        <div 
          className="model-standby-section"
          onDragOver={handleDragOver}
          onDrop={handleDropOnStandby}
        >
          <h3>Standby</h3>
          <div className="model-standby-slots">
            {standbyModels.map((model) => renderModelSlot(model, false))}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {settingsModal.show && (
        <PersonalityModal
          model={settingsModal.model}
          currentPersonality={aiPersonalities[settingsModal.model] || ''}
          onSave={handlePersonalitySave}
          onClose={closeSettings}
        />
      )}
    </div>
  );
};

// Personality Modal Component
const PersonalityModal = ({ model, currentPersonality, onSave, onClose }) => {
  const [personality, setPersonality] = useState(currentPersonality);

  const handleSave = () => {
    onSave(personality);
  };

  const handleClear = () => {
    setPersonality('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Set {model.charAt(0).toUpperCase() + model.slice(1)} Personality</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p className="modal-description">
            Set a personality prompt that will be applied to {model.charAt(0).toUpperCase() + model.slice(1)} for the entire conversation.
          </p>
          <textarea
            className="personality-input"
            value={personality}
            onChange={(e) => setPersonality(e.target.value)}
            placeholder="Example: You are a friendly and enthusiastic AI who loves to explain complex topics in simple terms..."
            rows={6}
          />
          <div className="modal-actions">
            <button className="btn-secondary" onClick={handleClear}>
              Clear Personality
            </button>
            <div className="btn-group">
              <button className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSave}>
                Save Personality
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelSelector;
