import React, { useState, useEffect } from 'react';
import {
  Content,
  Header,
  HeaderContainer,
  HeaderName,
  HeaderNavigation,
  HeaderMenuButton,
  HeaderMenuItem,
  HeaderGlobalBar,
  HeaderGlobalAction,
  SideNav,
  SideNavItems,
  SideNavMenuItem,
  Theme,
  ToastNotification,
  Grid,
  Column
} from '@carbon/react';
import {
  Chat,
  Settings,
  StatusPartial,
  StatusGood,
  StatusCritical
} from '@carbon/icons-react';
import CarbonChatInterface from './components/CarbonChatInterface';
import CarbonAdminPanel from './components/CarbonAdminPanel';
import '@carbon/styles/css/styles.css';
import './CarbonApp.css';

function CarbonApp() {
  const [activeTab, setActiveTab] = useState('chat');
  const [systemStatus, setSystemStatus] = useState({ status: 'unknown' });
  const [theme, setTheme] = useState('white'); // Default to Carbon White
  const [isSideNavExpanded, setIsSideNavExpanded] = useState(false);

  useEffect(() => {
    // Check system health on startup
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setSystemStatus(data))
      .catch(err => {
        console.error('Health check failed:', err);
        setSystemStatus({ status: 'error' });
      });
  }, []);

  const getStatusIcon = () => {
    switch (systemStatus.status?.toLowerCase()) {
      case 'healthy':
      case 'up':
        return <StatusGood size={16} />;
      case 'degraded':
      case 'warning':
        return <StatusPartial size={16} />;
      case 'error':
      case 'down':
        return <StatusCritical size={16} />;
      default:
        return <StatusPartial size={16} />;
    }
  };

  const getStatusKind = () => {
    switch (systemStatus.status?.toLowerCase()) {
      case 'healthy':
      case 'up':
        return 'success';
      case 'degraded':
      case 'warning':
        return 'warning';
      case 'error':
      case 'down':
        return 'error';
      default:
        return 'info';
    }
  };

  const themes = [
    { value: 'white', label: 'Carbon White' },
    { value: 'g90', label: 'Carbon Gray 90' }
  ];

  return (
    <Theme theme={theme}>
      <div className="carbon-app">
        <HeaderContainer
          render={({ isSideNavExpanded, onClickSideNavExpand }) => (
            <>
              <Header aria-label="Maximo Application Suite - AI Knowledge Assistant">
                <HeaderMenuButton
                  aria-label="Open menu"
                  onClick={onClickSideNavExpand}
                  isActive={isSideNavExpanded}
                />
                <HeaderName prefix="IBM">
                  Maximo AI Knowledge Assistant
                </HeaderName>
                
                <HeaderNavigation aria-label="Main navigation">
                  <HeaderMenuItem
                    href="#"
                    isCurrentPage={activeTab === 'chat'}
                    onClick={() => setActiveTab('chat')}
                  >
                    Chat
                  </HeaderMenuItem>
                  <HeaderMenuItem
                    href="#"
                    isCurrentPage={activeTab === 'admin'}
                    onClick={() => setActiveTab('admin')}
                  >
                    Administration
                  </HeaderMenuItem>
                </HeaderNavigation>

                <HeaderGlobalBar>
                  <div className="status-notification">
                    <ToastNotification
                      kind={getStatusKind()}
                      iconDescription="System status"
                      hideCloseButton
                      lowContrast
                      title={`System ${systemStatus.status || 'Unknown'}`}
                      style={{ 
                        minWidth: '200px',
                        margin: '0',
                        '--cds-notification-background-success': '#f4f4f4',
                        '--cds-notification-background-info': '#f4f4f4'
                      }}
                    />
                  </div>
                  {themes.map((themeOption) => (
                    <HeaderGlobalAction
                      key={themeOption.value}
                      aria-label={themeOption.label}
                      tooltipAlignment="end"
                      onClick={() => setTheme(themeOption.value)}
                      isActive={theme === themeOption.value}
                    >
                      <div className={`theme-dot theme-${themeOption.value}`} />
                    </HeaderGlobalAction>
                  ))}
                </HeaderGlobalBar>
              </Header>

              <SideNav
                aria-label="Side navigation"
                expanded={isSideNavExpanded}
                isPersistent={false}
              >
                <SideNavItems>
                  <SideNavMenuItem
                    href="#"
                    isActive={activeTab === 'chat'}
                    onClick={() => setActiveTab('chat')}
                  >
                    <Chat size={20} style={{ marginRight: '0.5rem' }} />
                    Knowledge Chat
                  </SideNavMenuItem>
                  <SideNavMenuItem
                    href="#"
                    isActive={activeTab === 'admin'}
                    onClick={() => setActiveTab('admin')}
                  >
                    <Settings size={20} style={{ marginRight: '0.5rem' }} />
                    System Administration
                  </SideNavMenuItem>
                </SideNavItems>
              </SideNav>

              <Content>
                <Grid className="content-grid">
                  <Column lg={16} md={8} sm={4}>
                    {activeTab === 'chat' && <CarbonChatInterface />}
                    {activeTab === 'admin' && <CarbonAdminPanel />}
                  </Column>
                </Grid>
              </Content>
            </>
          )}
        />
      </div>
    </Theme>
  );
}

export default CarbonApp;
