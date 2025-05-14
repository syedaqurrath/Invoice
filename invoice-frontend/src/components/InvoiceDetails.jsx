import React from 'react';

const InvoiceDetails = ({ invoice, onStatusChange, onClose, isSubmitting }) => {
  const statusOptions = ['Pending', 'Paid', 'Overdue', 'Cancelled'];

  const handleStatusChange = async (newStatus) => {
    onStatusChange(invoice._id, newStatus);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateTotal = (items) => {
    return items.reduce((sum, item) => sum + (item.quantity * item.price), 0).toFixed(2);
  };

  return (
    <div className="modal-overlay">
      <div className="invoice-details">
        <div className="invoice-details-header">
          <h2>Invoice Details</h2>
        </div>
        <button 
          onClick={onClose} 
          className="close-button"
          disabled={isSubmitting}
          aria-label="Close"
        >
          ×
        </button>

        <div className="invoice-details-content">
          <div className="invoice-status-section">
            <div className="status-label">Current Status</div>
            <div className="status-buttons">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  className={`status-button ${status} ${invoice.status === status ? 'active' : ''}`}
                  onClick={() => handleStatusChange(status)}
                  disabled={isSubmitting}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="invoice-info">
            <div>
              <strong>Created Date</strong>
              <p>{formatDate(invoice.createdAt)}</p>
            </div>
            <div>
              <strong>Due Date</strong>
              <p>{formatDate(invoice.dueDate)}</p>
            </div>
            <div>
              <strong>Invoice Number</strong>
              <p>#{invoice._id.slice(-6).toUpperCase()}</p>
            </div>
            <div>
              <strong>Total Amount</strong>
              <p>${calculateTotal(invoice.items)}</p>
            </div>
          </div>

          <div className="invoice-items">
            <h3>Invoice Items</h3>
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={index}>
                    <td>{item.description}</td>
                    <td>{item.quantity}</td>
                    <td>${item.price.toFixed(2)}</td>
                    <td>${(item.quantity * item.price).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="invoice-total">
              Total: ${calculateTotal(invoice.items)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetails; 