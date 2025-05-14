import React, { useState } from 'react';

const CreateInvoiceModal = ({ onClose, onSubmit }) => {
  const [items, setItems] = useState([
    { description: '', quantity: 1, price: 0 }
  ]);

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, price: 0 }]);
  };

  const updateItem = (index, field, value) => {
    const updatedItems = items.map((item, i) => {
      if (i === index) {
        let processedValue = value;
        if (field === 'quantity') {
          processedValue = parseInt(value) || 0;
        } else if (field === 'price') {
          processedValue = parseFloat(value) || 0;
        }
        return { ...item, [field]: processedValue };
      }
      return item;
    });
    setItems(updatedItems);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.price), 0).toFixed(2);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ items });
  };

  return (
    <div className="modal">
      <div className="modal-header">
        <h2 className="modal-title">Create New Invoice</h2>
        <button 
          className="close-button"
          onClick={onClose}
          disabled={isSubmitting}
        >
          ×
        </button>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Client Name</label>
          <input
            type="text"
            className="form-control"
            value={formData.clientName}
            onChange={(e) => setFormData({...formData, clientName: e.target.value})}
            required
          />
        </div>
        <div className="items-list">
          {items.map((item, index) => (
            <div key={index} className="item-row">
              <input
                type="text"
                placeholder="Description"
                value={item.description}
                onChange={(e) => updateItem(index, 'description', e.target.value)}
                required
              />
              <input
                type="number"
                placeholder="Quantity"
                value={item.quantity}
                onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                min="1"
                required
              />
              <input
                type="number"
                placeholder="Price"
                value={item.price}
                onChange={(e) => updateItem(index, 'price', e.target.value)}
                min="0"
                step="0.01"
                required
              />
              {items.length > 1 && (
                <button
                  type="button"
                  className="remove-item"
                  onClick={() => removeItem(index)}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="button button-secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="button button-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Invoice'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateInvoiceModal; 