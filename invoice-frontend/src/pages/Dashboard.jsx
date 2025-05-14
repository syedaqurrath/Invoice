// src/pages/Dashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import InvoiceDetails from '../components/InvoiceDetails';
import CreateInvoiceModal from '../components/CreateInvoiceModal';
import '../styles/Dashboard.css';
import '../styles/Modal.css';

const Dashboard = () => {
  const { logout, token } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [lastFetch, setLastFetch] = useState(Date.now());
  const [filters, setFilters] = useState({
    status: 'all',
    searchTerm: '',
    dateRange: 'all'
  });
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    overdue: 0,
    totalAmount: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate dashboard statistics
  const calculateStats = useCallback((invoicesList) => {
    const newStats = {
      total: invoicesList.length,
      paid: invoicesList.filter(inv => inv.status === 'Paid').length,
      pending: invoicesList.filter(inv => inv.status === 'Pending').length,
      overdue: invoicesList.filter(inv => inv.status === 'Overdue').length,
      totalAmount: invoicesList.reduce((sum, inv) => sum + inv.totalAmount, 0)
    };
    setStats(newStats);
  }, []);

  // Fetch invoices with cleanup
  const fetchInvoices = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/invoices', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setInvoices(data);
        calculateStats(data);
        setError('');
        setLastFetch(Date.now());
      } else {
        setError(data.message || 'Failed to fetch invoices');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Error connecting to server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [token, calculateStats]);

  // Initial load with cleanup
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      if (!mounted) return;
      await fetchInvoices();
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [token, fetchInvoices]);

  // Auto-refresh effect
  useEffect(() => {
    const REFRESH_INTERVAL = 5 * 60 * 1000;
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastFetch >= REFRESH_INTERVAL) {
        fetchInvoices();
      }
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchInvoices, lastFetch]);

  // Error boundary effect
  useEffect(() => {
    const handleError = (error) => {
      console.error('Dashboard Error:', error);
      setError('An unexpected error occurred. Please refresh the page.');
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [setError]);

  // Handle status change
  const handleStatusChange = async (invoiceId, newStatus) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`http://localhost:5000/api/invoices/${invoiceId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        await fetchInvoices();
        if (selectedInvoice?._id === invoiceId) {
          setSelectedInvoice(prev => ({ ...prev, status: newStatus }));
        }
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to update invoice status');
      }
    } catch (err) {
      console.error('Status update error:', err);
      setError('Error connecting to server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle invoice deletion
  const handleDeleteInvoice = async (invoiceId) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`http://localhost:5000/api/invoices/${invoiceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setSelectedInvoice(null);
        await fetchInvoices();
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to delete invoice');
      }
    } catch (err) {
      console.error('Delete invoice error:', err);
      setError('Error connecting to server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle create invoice
  const handleCreateInvoice = async (invoiceData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:5000/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(invoiceData)
      });

      const data = await response.json();

      if (response.ok) {
        setShowCreateModal(false);
        await fetchInvoices();
        setError('');
      } else {
        setError(data.message || 'Failed to create invoice');
      }
    } catch (err) {
      console.error('Create invoice error:', err);
      setError('Error connecting to server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter invoices based on current filters
  const getFilteredInvoices = useCallback(() => {
    return invoices.filter(invoice => {
      // Status filter
      if (filters.status !== 'all' && invoice.status !== filters.status) {
        return false;
      }

      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const hasMatch = invoice.items.some(item => 
          item.description.toLowerCase().includes(searchLower)
        );
        if (!hasMatch) return false;
      }

      // Date range filter
      if (filters.dateRange !== 'all') {
        const now = new Date();
        const invoiceDate = new Date(invoice.createdAt);
        const daysDiff = (now - invoiceDate) / (1000 * 60 * 60 * 24);

        switch (filters.dateRange) {
          case 'week':
            if (daysDiff > 7) return false;
            break;
          case 'month':
            if (daysDiff > 30) return false;
            break;
          case 'quarter':
            if (daysDiff > 90) return false;
            break;
          default:
            break;
        }
      }

      return true;
    });
  }, [invoices, filters.status, filters.searchTerm, filters.dateRange]);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Invoice Dashboard</h1>
        <div className="dashboard-actions">
          <button 
            className="button button-primary"
            onClick={() => setShowCreateModal(true)}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Invoice'}
          </button>
          <button 
            className="button button-secondary"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Invoices</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">${stats.totalAmount.toFixed(2)}</div>
          <div className="stat-label">Total Amount</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.paid}</div>
          <div className="stat-label">Paid</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.overdue}</div>
          <div className="stat-label">Overdue</div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Status:</label>
          <select 
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
          >
            <option value="all">All</option>
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Date Range:</label>
          <select
            value={filters.dateRange}
            onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
          >
            <option value="all">All Time</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
          </select>
        </div>

        <div className="filter-group">
          <input
            type="text"
            placeholder="Search invoices..."
            className="search-input"
            value={filters.searchTerm}
            onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
          />
        </div>
      </div>

      {/* Error Message */}
      {error && <div className="error-message">{error}</div>}

      {/* Invoices Grid */}
      {loading ? (
        <div className="loading-spinner">Loading...</div>
      ) : (
        <div className="invoices-grid">
          {getFilteredInvoices().map(invoice => (
            <div 
              key={invoice._id}
              className="invoice-card"
              onClick={() => setSelectedInvoice(invoice)}
            >
              <div className="invoice-card-header">
                <span className={`status-badge ${invoice.status.toLowerCase()}`}>
                  {invoice.status}
                </span>
                <div className="status-actions">
                  <select 
                    className="status-select"
                    value={invoice.status}
                    onChange={(e) => {
                      e.stopPropagation(); // Prevent card click
                      handleStatusChange(invoice._id, e.target.value);
                    }}
                    disabled={isSubmitting}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="invoice-card-body">
                <div className="invoice-amount">
                  ${invoice.totalAmount.toFixed(2)}
                </div>
                <div className="invoice-items-count">
                  {invoice.items.length} items
                </div>
                <div className="invoice-due-date">
                  Due: {new Date(invoice.dueDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <InvoiceDetails
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onStatusChange={handleStatusChange}
          onDelete={handleDeleteInvoice}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <CreateInvoiceModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateInvoice}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
};

export default Dashboard;
