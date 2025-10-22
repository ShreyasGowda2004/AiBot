import React, { useState, useEffect } from 'react';
import { RefreshCw, Database, GitBranch, Clock, Activity, AlertCircle, CheckCircle } from 'lucide-react';
import './AdminPanel.css';

const AdminPanel = () => {
  const [repositoryStatus, setRepositoryStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    fetchRepositoryStatus();
  }, []);

  const fetchRepositoryStatus = async () => {
    try {
      const response = await fetch('/api/admin/status');
      if (response.ok) {
        const status = await response.json();
        setRepositoryStatus(status);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch repository status:', error);
    }
  };

  const handleInitialize = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/initialize', {
        method: 'POST'
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Initialization started:', result);
        // Refresh status after a delay
        setTimeout(fetchRepositoryStatus, 2000);
      }
    } catch (error) {
      console.error('Failed to initialize repository:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReindex = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/reindex', {
        method: 'POST'
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Reindexing started:', result);
        // Refresh status after a delay
        setTimeout(fetchRepositoryStatus, 2000);
      }
    } catch (error) {
      console.error('Failed to reindex repository:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Never';
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now - past;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffHours > 24) {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h2>System Administration</h2>
        <button
          onClick={fetchRepositoryStatus}
          className="refresh-button"
          title="Refresh Status"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      <div className="admin-content">
        {/* Repository Status Card */}
        <div className="status-card">
          <div className="card-header">
            <div className="card-title">
              <Database size={20} />
              Repository Status
            </div>
            <div className="status-indicator">
              {repositoryStatus?.indexingInProgress ? (
                <>
                  <Activity size={16} className="status-icon indexing" />
                  <span className="status-text indexing">Indexing</span>
                </>
              ) : (
                <>
                  <CheckCircle size={16} className="status-icon ready" />
                  <span className="status-text ready">Ready</span>
                </>
              )}
            </div>
          </div>

          {repositoryStatus && (
            <div className="status-details">
              <div className="detail-row">
                <GitBranch size={16} />
                <span className="detail-label">Repository:</span>
                <span className="detail-value">
                  {repositoryStatus.repositoryOwner}/{repositoryStatus.repositoryName}
                </span>
              </div>
              
              <div className="detail-row">
                <GitBranch size={16} />
                <span className="detail-label">Branch:</span>
                <span className="detail-value">{repositoryStatus.branchName}</span>
              </div>
              
              <div className="detail-row">
                <Clock size={16} />
                <span className="detail-label">Last Indexed:</span>
                <span className="detail-value">
                  {formatTimeAgo(repositoryStatus.lastIndexTime)}
                  <small>({formatDate(repositoryStatus.lastIndexTime)})</small>
                </span>
              </div>
              
              <div className="detail-row">
                <RefreshCw size={16} />
                <span className="detail-label">Status Updated:</span>
                <span className="detail-value">{formatTimeAgo(lastUpdate)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions Card */}
        <div className="actions-card">
          <div className="card-header">
            <div className="card-title">
              <Activity size={20} />
              Repository Actions
            </div>
          </div>

          <div className="actions-content">
            <div className="action-item">
              <div className="action-info">
                <h4>Initialize Repository</h4>
                <p>
                  Load and index all repository files for the first time. 
                  This will create embeddings for all text files.
                </p>
              </div>
              <button
                onClick={handleInitialize}
                disabled={isLoading || repositoryStatus?.indexingInProgress}
                className="action-button primary"
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={16} className="spinning" />
                    Initializing...
                  </>
                ) : (
                  <>
                    <Database size={16} />
                    Initialize
                  </>
                )}
              </button>
            </div>

            <div className="action-item">
              <div className="action-info">
                <h4>Reindex Repository</h4>
                <p>
                  Clear existing index and rebuild from scratch. 
                  Use this to update the knowledge base with latest changes.
                </p>
              </div>
              <button
                onClick={handleReindex}
                disabled={isLoading || repositoryStatus?.indexingInProgress}
                className="action-button secondary"
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={16} className="spinning" />
                    Reindexing...
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} />
                    Reindex
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* System Information Card */}
        <div className="info-card">
          <div className="card-header">
            <div className="card-title">
              <AlertCircle size={20} />
              System Information
            </div>
          </div>

          <div className="info-content">
            <div className="info-section">
              <h4>About This System</h4>
              <ul>
                <li>Advanced RAG (Retrieval-Augmented Generation) system</li>
                <li>Real-time GitHub repository processing</li>
                <li>Ollama-powered AI responses</li>
                <li>Vector-based semantic search</li>
                <li>Automatic document chunking and embedding</li>
              </ul>
            </div>

            <div className="info-section">
              <h4>Performance Notes</h4>
              <ul>
                <li>Initial indexing may take several minutes for large repositories</li>
                <li>The system processes text files including markdown, code, and documentation</li>
                <li>Responses include references to source files when available</li>
                <li>Automatic reindexing occurs every 6 hours</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
