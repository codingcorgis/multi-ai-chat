import React, { useState } from 'react';

const ModelSelector = ({ selectedModels, onModelChange, onOrderChange, modelOrder }) => {
  const [draggedModel, setDraggedModel] = useState(null);

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
            {activeModels.map((model) => (
              <div
                key={model}
                className="order-slot"
                draggable
                onDragStart={(e) => handleDragStart(e, model)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropOnSlot(e, model)}
              >
                <div className="slot-number">AI {modelOrder[model]}</div>
                <div className="model-name">
                  {model.charAt(0).toUpperCase() + model.slice(1)}
                </div>
              </div>
            ))}
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
            {standbyModels.map((model) => (
              <div
                key={model}
                className="standby-slot"
                draggable
                onDragStart={(e) => handleDragStart(e, model)}
              >
                <div className="model-name">
                  {model.charAt(0).toUpperCase() + model.slice(1)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelSelector;
