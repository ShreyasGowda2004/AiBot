import React, { useState, useEffect } from 'react';
import {
  Grid,
  Column,
  Tile,
  Button,
  DataTable,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  InlineNotification,
  Loading,
  Tag,
  ProgressIndicator,
  ProgressStep,
  Modal,
  TextInput,
  Select,
  SelectItem,
  Accordion,
  AccordionItem,
  CodeSnippet,
  StructuredListWrapper,
  StructuredListHead,
  StructuredListRow,
  StructuredListCell,
  StructuredListBody
} from '@carbon/react';
import {
  Renew,
  Download,
  Settings,
  Information,
  CheckmarkFilled,
  WarningFilled,
  ErrorFilled,
  Time,
  Analytics,
  Cloud
} from '@carbon/icons-react';
import './CarbonAdminPanel.css';

function CarbonAdminPanel() {
  const [systemHealth, setSystemHealth] = useState(null);
  const [repositoryData, setRepositoryData] = useState(null);
  const [systemStats, setSystemStats] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [repoStats, setRepoStats] = useState({
    totalDocuments: 0,
    totalFiles: 0,
    totalSize: 0,
    lastUpdated: null
  });

  useEffect(() => {
    loadSystemData();
  }, []);

  const loadSystemData = async () => {
    setIsLoading(true);
    
    try {
      // Load system health
      const healthResponse = await fetch('/api/health');
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        setSystemHealth(healthData);
      }

      // Load repository data
      const repoResponse = await fetch('/api/admin/repositories');
      if (repoResponse.ok) {
        const repoData = await repoResponse.json();
        setRepositoryData(repoData);
      }

      // Load system stats
      const statsResponse = await fetch('/api/admin/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setSystemStats(statsData);
      }

      // Load last sync time
      const syncResponse = await fetch('/api/admin/last-sync');
      if (syncResponse.ok) {
        const syncData = await syncResponse.json();
        setLastSync(new Date(syncData.timestamp));
      }
    } catch (err) {
      console.error('Failed to load system data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshRepositories = async () => {
    setIsRefreshing(true);
    
    try {
      const response = await fetch('/api/admin/refresh', {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error(`Refresh failed: ${response.status}`);
      }

      const result = await response.json();
      await loadSystemData(); // Reload all data
      
      setLastSync(new Date());
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getHealthIcon = (status) => {
    switch(status) {
      case 'healthy': return <CheckmarkFilled size={16} style={{ color: '#42be65' }} />;
      case 'warning': return <WarningFilled size={16} style={{ color: '#f1c21b' }} />;
      case 'error': return <ErrorFilled size={16} style={{ color: '#da1e28' }} />;
      default: return <Information size={16} />;
    }
  };

  const getHealthStatus = () => {
    if (!systemHealth) return 'gray';
    
    const { ollama, github, database } = systemHealth;
    
    if (ollama === 'healthy' && github === 'healthy' && database === 'healthy') {
      return 'green';
    } else if (ollama === 'error' || github === 'error' || database === 'error') {
      return 'red';
    } else {
      return 'warm-gray';
    }
  };

  const getHealthStatusText = () => {
    if (!systemHealth) return 'unknown';
    
    const { ollama, github, database } = systemHealth;
    
    if (ollama === 'healthy' && github === 'healthy' && database === 'healthy') {
      return 'healthy';
    } else if (ollama === 'error' || github === 'error' || database === 'error') {
      return 'error';
    } else {
      return 'warning';
    }
  };

  if (isLoading) {
    return (
      <div className="carbon-admin-panel">
        <Grid>
          <Column span={16}>
            <Loading description="Loading system data..." />
          </Column>
        </Grid>
      </div>
    );
  }

  return (
    <div className="carbon-admin-panel">
      <Grid>
        {/* Header */}
        <Column span={16}>
          <div className="panel-header">
            <h2>System Administration</h2>
            <div className="header-actions">
              <Tag type={getHealthStatus()}>
                {getHealthIcon(getHealthStatusText())}
                System {getHealthStatusText()}
              </Tag>
              <Button
                kind="secondary"
                size="sm"
                onClick={refreshRepositories}
                renderIcon={Renew}
                disabled={isRefreshing}
              >
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </Column>

        {/* System Health Cards */}
        <Column lg={4} md={8} sm={16}>
          <Tile className="health-tile">
            <div className="tile-header">
              <CheckmarkFilled size={20} />
              <h4>Ollama Service</h4>
            </div>
            <div className="health-status">
              {getHealthIcon(systemHealth?.ollama)}
              <span>{systemHealth?.ollama || 'Unknown'}</span>
            </div>
            {systemHealth?.ollamaModel && (
              <p className="model-info">Model: {systemHealth.ollamaModel}</p>
            )}
          </Tile>
        </Column>

        <Column lg={4} md={8} sm={16}>
          <Tile className="health-tile">
            <div className="tile-header">
              <Cloud size={20} />
              <h4>GitHub API</h4>
            </div>
            <div className="health-status">
              {getHealthIcon(systemHealth?.github)}
              <span>{systemHealth?.github || 'Unknown'}</span>
            </div>
            <div className="actions">
              {isRefreshing ? (
                <Loading description="Refreshing..." />
              ) : (
                <div className="action-buttons">
                  <Button
                    kind="ghost"
                    size="sm"
                    onClick={refreshRepositories}
                    renderIcon={Renew}
                    disabled={isRefreshing}
                  >
                    Sync
                  </Button>
                </div>
              )}
            </div>
          </Tile>
        </Column>

        <Column lg={4} md={8} sm={16}>
          <Tile className="health-tile">
            <div className="tile-header">
              <Settings size={20} />
              <h4>Database</h4>
            </div>
            <div className="health-status">
              {getHealthIcon(systemHealth?.database)}
              <span>{systemHealth?.database || 'Unknown'}</span>
            </div>
            {systemStats && (
              <p className="stats-info">
                {systemStats.totalDocuments} documents
              </p>
            )}
          </Tile>
        </Column>

        <Column lg={4} md={8} sm={16}>
          <Tile className="metrics-tile">
            <div className="tile-header">
              <Analytics size={20} />
              <h4>Performance</h4>
            </div>
            <div className="metrics">
              {systemHealth?.responseTime && (
                <div className="metric">
                  <Time size={16} />
                  <span>Avg Response: {systemHealth.responseTime}ms</span>
                </div>
              )}
              {systemStats?.totalRequests && (
                <div className="metric">
                  <span>Total Requests: {systemStats.totalRequests}</span>
                </div>
              )}
            </div>
          </Tile>
        </Column>

        {/* Repository Information */}
        <Column span={16}>
          <Tile>
            <div className="section-header">
              <h3>Repository Information</h3>
              <div className="repository-actions">
                <Button kind="primary" size="sm" onClick={refreshRepositories}>
                  Refresh Data
                </Button>
              </div>
            </div>
            
            {repositoryData ? (
              <div className="repository-details">
                <div className="repo-summary">
                  <h4>{repositoryData.name}</h4>
                  <p>{repositoryData.description}</p>
                  
                  <div className="repo-stats-grid">
                    <div className="stat-item">
                      <label>Total Files:</label>
                      <span>{repositoryData.totalFiles || 0}</span>
                    </div>
                    <div className="stat-item">
                      <label>Processed Documents:</label>
                      <span>{repositoryData.processedDocuments || 0}</span>
                    </div>
                    <div className="stat-item">
                      <label>Total Size:</label>
                      <span>{formatBytes(repositoryData.totalSize || 0)}</span>
                    </div>
                    <div className="stat-item">
                      <label>Last Updated:</label>
                      <span>{formatDateTime(repositoryData.lastUpdated ? new Date(repositoryData.lastUpdated) : null)}</span>
                    </div>
                  </div>
                </div>

                {repositoryData.fileTypes && (
                  <div className="file-types">
                    <h5>File Types</h5>
                    <div className="file-type-tags">
                      {Object.entries(repositoryData.fileTypes).map(([type, count]) => (
                        <Tag key={type} type="outline">
                          {type}: {count}
                        </Tag>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <InlineNotification
                kind="info"
                title="No repository data"
                subtitle="Repository information will appear here once data is loaded."
              />
            )}
          </Tile>
        </Column>

        {/* System Logs */}
        <Column span={16}>
          <Tile>
            <div className="section-header">
              <h3>Recent Activity</h3>
            </div>
            
            <div className="activity-list">
              {lastSync && (
                <div className="activity-item">
                  <Time size={16} />
                  <span>Last synchronization: {formatDateTime(lastSync)}</span>
                </div>
              )}
              
              {systemStats?.lastRequest && (
                <div className="activity-item">
                  <Information size={16} />
                  <span>Last request: {formatDateTime(new Date(systemStats.lastRequest))}</span>
                </div>
              )}
              
              <div className="activity-item">
                <CheckmarkFilled size={16} />
                <span>System initialized successfully</span>
              </div>
            </div>
          </Tile>
        </Column>
      </Grid>
    </div>
  );
}

export default CarbonAdminPanel;
