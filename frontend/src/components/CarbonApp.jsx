import React, { useState, useEffect } from 'react';
import {
  Header,
  HeaderContainer,
  HeaderName,
  HeaderGlobalBar,
  HeaderGlobalAction,
  SkipToContent,
  Content,
  Theme
} from '@carbon/react';
import {
  Light,
  Asleep
} from '@carbon/icons-react';
import CarbonChatInterface from './CarbonChatInterface';
import './CarbonApp.css';

function CarbonApp() {
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('carbonTheme') || 'white';
  });

  const themes = [
  { value: 'white', label: 'White' },
  { value: 'g90', label: 'Gray 90' }
  ];

  useEffect(() => {
    localStorage.setItem('carbonTheme', currentTheme);
  }, [currentTheme]);

  const toggleTheme = () => {
    const currentIndex = themes.findIndex(theme => theme.value === currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setCurrentTheme(themes[nextIndex].value);
  };

  return (
    <Theme theme={currentTheme}>
      <div className="carbon-app" data-carbon-theme={currentTheme}>
        <HeaderContainer
          render={() => (
            <>
                <Theme theme="g100">
                  <Header aria-label="AI Chatbot">
                    <SkipToContent />
                    <HeaderName href="#" prefix="IBM">
                      Maximo AI Assistant&nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#8d8d8d' }}>|</span>&nbsp;&nbsp;<span style={{ color: '#4589ff' }}>TESTING</span>
                    </HeaderName>
                    <HeaderGlobalBar>
                      <HeaderGlobalAction
                        aria-label="Toggle theme"
                        onClick={toggleTheme}
                        tooltipAlignment="end"
                      >
                        {currentTheme === 'white' ? 
                          <Asleep size={20} /> : 
                          <Light size={20} />
                        }
                      </HeaderGlobalAction>
                    </HeaderGlobalBar>
                  </Header>
                </Theme>
              <Content className="carbon-content">
                <CarbonChatInterface />
              </Content>
            </>
          )}
        />
      </div>
    </Theme>
  );
}

export default CarbonApp;
