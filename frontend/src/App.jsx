import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import AdminPanel from './components/AdminPanel';
import { Settings, MessageCircle } from 'lucide-react';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [systemStatus, setSystemStatus] = useState({ status: 'unknown' });

  useEffect(() => {
    // Check system health on startup
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setSystemStatus(data))
      .catch(err => console.error('Health check failed:', err));
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">
            <MessageCircle size={24} />
            AI Chatbot - GitHub Knowledge Assistant
          </h1>
          <div className="header-controls">
            <div className={`status-indicator ${systemStatus.status?.toLowerCase()}`}>
              <span className="status-dot"></span>
              {systemStatus.status || 'Unknown'}
            </div>
            <nav className="tab-navigation">
              <button
                className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`}
                onClick={() => setActiveTab('chat')}
              >
                <MessageCircle size={18} />
                Chat
              </button>
              <button
                className={`tab-button ${activeTab === 'admin' ? 'active' : ''}`}
                onClick={() => setActiveTab('admin')}
              >
                <Settings size={18} />
                Admin
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="app-main">
        {activeTab === 'chat' && <ChatInterface />}
        {activeTab === 'admin' && <AdminPanel />}
      </main>
    </div>
  );
}

export default App;
