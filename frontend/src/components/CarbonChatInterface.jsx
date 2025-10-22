import React, { useState, useRef, useEffect } from 'react';
import {
  Button,
  Tile,
  Grid,
  Column,
  Loading,
  InlineNotification,
  SkeletonText,
  CodeSnippet,
  Link,
  Modal,
  Checkbox
} from '@carbon/react';
import {
  Send,
  User,
  Watsonx,
  Erase,
  StopFilledAlt,
  PlayFilledAlt,
  ChevronDown,
  ChevronUp
} from '@carbon/icons-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { v4 as uuidv4 } from 'uuid';
import './CarbonChatInterface.css';
import ExecutionConsole from './ExecutionConsole';

// Helper to extract plain text from a react-markdown node's children
function getNodeText(node) {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(getNodeText).join('');
  if (node.props && node.props.children) return getNodeText(node.props.children);
  if (node.children) return node.children.map(getNodeText).join('');
  return '';
}

// Welcome Screen Component
const WelcomeScreen = ({ onSampleClick }) => {
  const sampleQuestions = [
    "Give DB2 setup",
    "How to Create Company Set", 
    "How to create Organization",
    "How to Install OpenShift in local"
  ];

  return (
    <div className="welcome-screen">
      <div className="welcome-header">
        <div className="welcome-icon">
          <Watsonx size={32} />
        </div>
        <h1 className="welcome-title">Welcome to IBM Maximo AI Assistant</h1>
        <p className="welcome-subtitle">
          Your intelligent assistant for IBM Maximo Application Suite. Get help with installation, configuration, database setup, and organizational management. Ask questions about DB2, OpenShift, company sets, and more.
        </p>
      </div>
      
      <div className="welcome-illustration">
        <svg viewBox="0 0 400 200" className="watson-illustration">
          {/* Central brain/AI node */}
          <circle cx="200" cy="100" r="40" fill="#4589ff" opacity="0.2" />
          <circle cx="200" cy="100" r="25" fill="#4589ff" />
          
          {/* Connected nodes */}
          <circle cx="120" cy="60" r="15" fill="#be95ff" />
          <circle cx="280" cy="60" r="15" fill="#33b1ff" />
          <circle cx="120" cy="140" r="15" fill="#ff8389" />
          <circle cx="280" cy="140" r="15" fill="#42be65" />
          <circle cx="160" cy="40" r="8" fill="#82cfff" />
          <circle cx="240" cy="40" r="8" fill="#d4bbff" />
          <circle cx="160" cy="160" r="8" fill="#ffb3ba" />
          <circle cx="240" cy="160" r="8" fill="#8dd3c7" />
          
          {/* Connection lines */}
          <line x1="200" y1="100" x2="120" y2="60" stroke="#4589ff" strokeWidth="2" opacity="0.6" />
          <line x1="200" y1="100" x2="280" y2="60" stroke="#4589ff" strokeWidth="2" opacity="0.6" />
          <line x1="200" y1="100" x2="120" y2="140" stroke="#4589ff" strokeWidth="2" opacity="0.6" />
          <line x1="200" y1="100" x2="280" y2="140" stroke="#4589ff" strokeWidth="2" opacity="0.6" />
          <line x1="120" y1="60" x2="160" y2="40" stroke="#be95ff" strokeWidth="1" opacity="0.5" />
          <line x1="280" y1="60" x2="240" y2="40" stroke="#33b1ff" strokeWidth="1" opacity="0.5" />
          <line x1="120" y1="140" x2="160" y2="160" stroke="#ff8389" strokeWidth="1" opacity="0.5" />
          <line x1="280" y1="140" x2="240" y2="160" stroke="#42be65" strokeWidth="1" opacity="0.5" />
        </svg>
      </div>

      <div className="sample-questions">
        <h3 className="sample-title">Sample questions</h3>
        <div className="question-grid">
          {sampleQuestions.map((question, index) => (
            <button
              key={index}
              className="sample-question-btn"
              onClick={() => onSampleClick(question)}
            >
              <span>{question}</span>
              <Send size={16} className="question-arrow" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Helper: reformat single-line Kubernetes/IBM YAML manifest into multiline fenced block
function reformatYamlIfNeeded(raw) {
  if (!raw) return raw;
  const trimmed = raw.trim();
  // If already fenced or has multiple lines, leave (unless it's a single compressed line)
  const hasNewlines = /\n/.test(trimmed);
  const hasFence = /^```/.test(trimmed);
  const looksLikeYaml = /apiVersion:\s*[^\s]+/i.test(trimmed) && /kind:\s*[^\s]+/i.test(trimmed);
  if (!looksLikeYaml) return raw;
  if (hasFence) return raw; // already formatted
  // If it already has proper newlines, just wrap in fence for code styling
  if (hasNewlines && /metadata:/.test(trimmed)) {
    return '```yaml\n' + trimmed + '\n```';
  }
  // Compressed single line -> insert newlines before known YAML keys
  const keys = ['apiVersion','kind','metadata','spec','features','license','installIBMCatalogSource','isDisconnected','deployment','meterDefinitionCatalogServer','registration','name','namespace','accept'];
  let reformatted = trimmed;
  // Ensure a space after colons already; then add newlines
  keys.forEach(k => {
    const re = new RegExp('(?<!^)\\s+' + k + ':(?=\\s|$)','g');
    reformatted = reformatted.replace(re, '\n' + k + ':');
  });
  // Indent nested structure heuristically
  // Basic indentation for blocks after metadata:, spec:, features:, license:
  reformatted = reformatted
    .replace(/metadata:\n([^\n]+)/,'metadata:\n  $1')
    .replace(/spec:\n([^\n]+)/,'spec:\n  $1')
    .replace(/features:\n([^\n]+)/,'features:\n    $1')
    .replace(/license:\n([^\n]+)/,'license:\n    $1');
  return '```yaml\n' + reformatted + '\n```';
}

// Helper: reformat compressed multi-command shell snippets into a proper bash code block
function reformatShellIfNeeded(raw) {
  if (!raw) return raw;
  const trimmed = raw.trim();
  const alreadyFenced = /^```/.test(trimmed);
  // Heuristic: treat as shell script if it has shebang or typical shell keywords
  const isShell = /#!\//.test(trimmed) || /(export\s+\w+=|\boc\s+|\bkubectl\s+|\bhelm\s+|chmod\s+\+x|^bash\s)/m.test(trimmed);
  if (!isShell) return raw;
  if (alreadyFenced) return raw; // don't double wrap

  // Normalize: break chained commands on ' && ' and ';'
  let script = trimmed
    .replace(/\s*&&\s*/g, ' && ') // standard spacing
    .replace(/;\s*/g, ';')
    .replace(/;(?=[^\n])/g, '\n')
    .replace(/ && /g, ' &&\n');

  // If the entire script is on one line but has multiple exports / oc / kubectl, split
  script = script
    .replace(/\s+(?=export\s+\w+=)/g, '\n')
    .replace(/\s+(?=oc\s+)/g, '\n')
    .replace(/\s+(?=kubectl\s+)/g, '\n');

  // Collapse more than two blank lines
  script = script.replace(/\n{3,}/g, '\n\n');

  // Trim each line
  script = script.split('\n').map(l => l.trimEnd()).join('\n');

  return '```bash\n' + script + '\n```';
}

// Helper: detect Java source and wrap in fenced code block if not already fenced
function reformatJavaIfNeeded(raw) {
  if (!raw) return raw;
  if (/```/.test(raw)) return raw; // already has fenced block
  // Quick signal that this is likely Java
  if (!/(public\s+class|class\s+\w+|package\s+[\w\.]+;)/.test(raw)) return raw;
  const lines = raw.split(/\r?\n/);
  const startIdx = lines.findIndex(l => /^(package\s+|import\s+|public\s+|class\s+)/.test(l.trim()));
  if (startIdx === -1) return raw;
  const before = lines.slice(0, startIdx).join('\n').trim();
  const code = lines.slice(startIdx).join('\n').trim();
  if (!code) return raw;
  if (before) return `${before}\n\n\`\`\`java\n${code}\n\`\`\``.replace(/`{3}/g,'```');
  return '```java\n' + code + '\n```';
}

// Memoized message component to avoid re-rendering all previous messages on each keystroke
const MessageComponent = React.memo(function MessageComponent({ message, isStreaming, onOpenExec, onOpenExecSection, onOpenGitFile, hidden, collapsed, onToggleCollapse, onRevealManual, prereqText, canExecute = false }) {
  const isUser = message.type === 'user';
  const isError = message.isError;
  
  
  // Check if this is the special loading placeholder message
  if (message.isLoading) {
    return (
      <div className="message-container assistant-message">
        <div className="message-header">
          <div className="message-avatar">
            <Watsonx size={20} />
          </div>
          <div className="message-info">
            <span className="message-sender">Maximo AI Assistant</span>
            <span className="message-timestamp">{message.timestamp.toLocaleTimeString()}</span>
          </div>
        </div>
        <div className="loading-inline-spinner" aria-live="polite" aria-busy>
          <div className="ring-spinner" role="status" aria-label="Loading" />
        </div>
      </div>
    );
  }

  return (
    <div className={`message-container ${isUser ? 'user-message' : 'assistant-message'} ${isStreaming ? 'streaming' : ''}`}>
      <div className="message-header">
        <div className="message-avatar">
          {isUser ? <User size={20} /> : <Watsonx size={20} />}
        </div>
        <div className="message-info">
          <span className="message-sender">{isUser ? 'You' : 'Maximo AI Assistant'}</span>
          <span className="message-timestamp">{message.timestamp.toLocaleTimeString()}</span>
        </div>
      </div>
      <Tile className={`message-content ${isError ? 'error-message' : ''} ${isStreaming ? 'streaming-content' : ''}`}>
        {!isUser && (
          <div className="message-tools-bar">
            <button className="collapse-btn tools-icon-btn" title={collapsed ? 'Expand' : 'Collapse'} onClick={onToggleCollapse} aria-label={collapsed ? 'Expand response' : 'Collapse response'}>
              {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
          </div>
        )}
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <div className="assistant-response">
            {hidden ? (
              <div>
                {prereqText && prereqText.trim() && (
                  <div className="inline-prereq" style={{ marginBottom: '0.5rem' }}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({ href, children }) => {
                          const url = href || '';
                          const isGitHub = /^https?:\/\/(?:github\.com|github\.ibm\.com)\//i.test(url);
                          const isBlobOrRaw = /\/(blob|raw)\//.test(url);
                          if (isGitHub && isBlobOrRaw && onOpenGitFile) {
                            return (
                              <Link
                                href={url}
                                onClick={(e) => {
                                  e.preventDefault();
                                  onOpenGitFile(url);
                                }}
                              >
                                {children}
                              </Link>
                            );
                          }
                          return (
                            <Link href={url} target="_blank" rel="noopener noreferrer">{children}</Link>
                          );
                        }
                      }}
                    >
                      {prereqText}
                    </ReactMarkdown>
                  </div>
                )}
                <div className="inline-choice" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
                  <div style={{ color: 'var(--cds-text-secondary, #6f6f6f)' }}>
                    Choose how to proceed: Manual (show) or Automatic (execute)
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button size="sm" kind="secondary" onClick={onRevealManual}>Manual</Button>
                    <Button size="sm" kind="primary" onClick={() => onOpenExec(message)}>Automatic</Button>
                  </div>
                </div>
              </div>
            ) : collapsed ? (
              <div className="placeholder small" style={{ color: 'var(--cds-text-secondary, #6f6f6f)' }}>
                Response collapsed. Click ▸ to expand.
              </div>
            ) : (
            <div className="markdown-content">
              {canExecute && (
                <div className="inline-exec-toolbar" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.25rem' }}>
                  <button
                    className="section-play-btn tools-icon-btn"
                    title="Execute this request"
                    aria-label="Execute this request"
                    onClick={() => onOpenExec && onOpenExec(message)}
                  >
                    <PlayFilledAlt size={16} />
                  </button>
                </div>
              )}
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Heading renderers (no inline execute buttons)
                  h1: ({children}) => (
                    <h3 style={{marginTop: '1.5rem', marginBottom: '0.5rem', fontWeight: 600}}>{children}</h3>
                  ),
                  h2: ({children}) => (
                    <h4 style={{marginTop: '1rem', marginBottom: '0.5rem', fontWeight: 600}}>{children}</h4>
                  ),
                  h3: ({children}) => (
                    <h5 style={{marginTop: '0.75rem', marginBottom: '0.25rem', fontWeight: 600}}>{children}</h5>
                  ),
                  // Paragraph renderer (no inline execute buttons)
                  p({children, node, ...props}) {
                    const hasCodeBlock = node && node.children && node.children.some(child =>
                      child.type === 'element' && child.tagName === 'code' && !child.properties?.className?.includes('inline')
                    );
                    if (hasCodeBlock) return <div {...props}>{children}</div>;
                    return <p {...props}>{children}</p>;
                  },
                  code({node, inline, className, children, ...props}) {
                    const language = className ? className.replace('language-', '') : '';
                    if (!inline) {
                      // While streaming, use a simple <pre> block to prevent the CodeSnippet component
                      // from re-rendering and glitching on every new word.
                      if (isStreaming) {
                        return (
                          <pre className="streaming-code-block">
                            <code>{String(children)}</code>
                          </pre>
                        );
                      }
                      // Once streaming is done, render the full Carbon component.
                      return (
                        <CodeSnippet
                          type="multi"
                          language={language}
                          style={{ margin: '8px 0' }}
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </CodeSnippet>
                      );
                    }
                    return (
                      <code className={`inline-code ${className || ''}`.trim()} {...props}>
                        {children}
                      </code>
                    );
                  },
                  pre({children}) { return <>{children}</>; },
                  ul: ({children}) => <ul style={{paddingLeft: '1.5rem', marginBottom: '1rem'}}>{children}</ul>,
                  ol: ({children}) => <ol style={{paddingLeft: '1.5rem', marginBottom: '1rem'}}>{children}</ol>,
                  li: ({children}) => <li style={{marginBottom: '0.25rem'}}>{children}</li>,
                  a: ({ href, children }) => {
                    const url = href || '';
                    const isGitHub = /^https?:\/\/(?:github\.com|github\.ibm\.com)\//i.test(url);
                    const isBlobOrRaw = /\/(blob|raw)\//.test(url);
                    if (isGitHub && isBlobOrRaw && onOpenGitFile) {
                      return (
                        <Link
                          href={url}
                          onClick={(e) => {
                            e.preventDefault();
                            onOpenGitFile(url);
                          }}
                        >
                          {children}
                        </Link>
                      );
                    }
                    return (
                      <Link href={url} target="_blank" rel="noopener noreferrer">{children}</Link>
                    );
                  }
                }}
              >
                {message.content.replace(/\\u003c/g, '<').replace(/\\u003e/g, '>')}
              </ReactMarkdown>
            </div>
            )}
            {isStreaming && <div className="typing-cursor">▊</div>}
          </div>
        )}
      </Tile>
    </div>
  );
});

function CarbonChatInterface() {
  const [messages, setMessages] = useState(() => {
    try {
      const raw = localStorage.getItem('chatMessages');
      if (raw) {
        const parsed = JSON.parse(raw).map(m => ({...m, timestamp: new Date(m.timestamp)}));
        if (parsed.length) return parsed;
      }
    } catch (e) { /* ignore */ }
    // No default welcome message - use welcome screen instead for streaming consistency
    return [];
  });
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState(null);
  const [error, setError] = useState(null);
  const [showExec, setShowExec] = useState(false);
  const [execPrefill, setExecPrefill] = useState({ url: '', method: 'GET' });
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const cancelStreamRef = useRef(false);
  const abortControllerRef = useRef(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [skipClearConfirm, setSkipClearConfirm] = useState(() => {
    try { return localStorage.getItem('clearConfirmSkip') === 'true'; } catch { return false; }
  });
  const [showWelcome, setShowWelcome] = useState(true); // Show welcome screen initially

  // GitHub file preview modal state
  const [gitModal, setGitModal] = useState({
    open: false,
    loading: false,
    error: null,
    title: '',
    content: '',
    meta: null,
  });

  // No automatic execution flow; manual console only

  // Hide/Collapse state per message and post-exec prompt
  const [hiddenMessageIds, setHiddenMessageIds] = useState({});
  const [collapsedMessageIds, setCollapsedMessageIds] = useState({});
  const [prereqById, setPrereqById] = useState({});

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Persist messages
    try {
      localStorage.setItem('chatMessages', JSON.stringify(messages));
    } catch (e) { /* ignore quota errors */ }
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (showWelcome) {
      setShowWelcome(false);
    }
    
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: uuidv4(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
      sourceFiles: []
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);
    cancelStreamRef.current = false;
    abortControllerRef.current = new AbortController();

    const assistantMessageId = uuidv4();
    const loadingMessage = {
      id: assistantMessageId,
      type: 'assistant',
      isLoading: true,
      timestamp: new Date(),
      fullContent: true // anticipate full content mode
    };
    setMessages(prev => [...prev, loadingMessage]);

    // Intercept greetings to always reply in the same Watsonx-like format
    const isGreeting = /^(hi|hello|hey|howdy|hi there|good (morning|afternoon|evening))\b/i.test(
      userMessage.content.trim()
    );

    try {
      let sourceFiles = [];

      if (isGreeting) {
        // Handle greetings with immediate streaming
        const greetingText = `# Hello\n\n---\n\nI'm here to help with any questions or topics you'd like to discuss. How can I assist you today?`;
        
        // Start streaming immediately
        setIsLoading(false);
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId 
            ? { 
                ...msg, 
                isLoading: false,
                content: '',
                sourceFiles: []
              }
            : msg
        ));
        setIsStreaming(true);
        setStreamingMessageId(assistantMessageId);
        await streamResponse(greetingText, assistantMessageId, []);
      } else {
        // Make the API call
        const response = await fetch('/api/chat/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMessage.content,
            sessionId: 'web-session-' + Date.now(),
            includeContext: true,
            fastMode: true,
            fullContent: true
          }),
          signal: abortControllerRef.current.signal,
        });

        if (response.ok) {
          // Start streaming immediately when response starts
          setIsLoading(false);
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { 
                  ...msg, 
                  isLoading: false,
                  content: '',
                  sourceFiles: []
                }
              : msg
          ));
          setIsStreaming(true);
          setStreamingMessageId(assistantMessageId);

          // Process response in real-time chunks; hidden/prereq set inside
          await streamResponseFromFetch(response, assistantMessageId);
        } else {
          // Handle error with streaming
          const errorText = 'Backend service unavailable. Please try again later.';
          setIsLoading(false);
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { 
                  ...msg, 
                  isLoading: false,
                  content: '',
                  sourceFiles: []
                }
              : msg
          ));
          setIsStreaming(true);
          setStreamingMessageId(assistantMessageId);
          await streamResponse(errorText, assistantMessageId, []);
          setPrereqById(prev => ({ ...prev, [assistantMessageId]: '' }));
        }
      }

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted by user.');
        // When fetch is aborted, remove the loading placeholder message
        setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
      } else {
        console.log('Backend not available or other error:', error);
        const responseText = 'Unable to connect to backend service. Please check your connection and try again.';
        
        // Use streaming for error messages too to ensure consistency
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId 
            ? { 
                ...msg, 
                isLoading: false,
                content: '',
                isError: true,
                sourceFiles: []
              }
            : msg
        ));
        setIsStreaming(true);
        setStreamingMessageId(assistantMessageId);
        await streamResponse(responseText, assistantMessageId, []);
      }
    } finally {
      setIsStreaming(false);
      setStreamingMessageId(null);
      setIsLoading(false);
      abortControllerRef.current = null;
      inputRef.current?.focus();
    }
  };

  const stopStreaming = () => {
    cancelStreamRef.current = true;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsStreaming(false);
    setStreamingMessageId(null);
    setIsLoading(false);
    
    // Remove any loading messages that might be stuck
    setMessages(prev => prev.filter(msg => !msg.isLoading));
  };

  // Open GitHub file modal and fetch content via backend
  const openGitFileModal = async (fileUrl) => {
    setGitModal({ open: true, loading: true, error: null, title: 'Loading…', content: '', meta: null });
    try {
      const resp = await fetch(`/api/github/file?url=${encodeURIComponent(fileUrl)}`);
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(data && data.error ? data.error : `Failed to load file (status ${resp.status})`);
      }
      const title = data.name || data.path || 'GitHub File';
      setGitModal({
        open: true,
        loading: false,
        error: null,
        title,
        content: data.content || '',
        meta: { path: data.path, repository: data.repository, branch: data.branch },
      });
    } catch (e) {
      setGitModal({ open: true, loading: false, error: e.message || 'Failed to fetch file', title: 'Error', content: '', meta: null });
    }
  };

  // Helper: extract request details from assistant message content
  const extractRequestFromContent = (text) => {
    // Wrapper that prefers a "Create" section; used for top-level play button
    let searchText = text || '';
    let createSectionText = '';
    let prereqText = '';
    try {
      // Find all headings and mark sections
      const headingRe = /(^|\n)\s*(?:#{1,6}\s*|\d+\.\s+)([^\n]+)/gi;
      let createStart = -1, createEnd = -1; let match;
      const headings = [];
      while ((match = headingRe.exec(text)) !== null) {
        const title = (match[2] || '').toLowerCase();
        headings.push({ start: match.index + (match[1] ? match[1].length : 0), title });
      }
      
      // Look for a "Create..." section first
      for (let i = 0; i < headings.length; i++) {
        const t = headings[i].title;
        if (t.includes('create')) {
          createStart = headings[i].start;
          createEnd = (i + 1 < headings.length) ? headings[i + 1].start : text.length;
          createSectionText = text.slice(createStart, createEnd);
          break;
        }
      }

      // Extract prerequisites section if present
      const preIdx = headings.findIndex(h => /\b(prerequisites|requirements)\b/i.test(h.title));
      if (preIdx !== -1) {
        const start = headings[preIdx].start;
        const end = preIdx + 1 < headings.length ? headings[preIdx + 1].start : text.length;
        prereqText = text.slice(start, end).trim();
      }
    } catch {}

    // Use createSectionText first if available, otherwise use full text for all searches
    const primaryText = createSectionText || text;
    const fullText = text; // Always keep full text as backup

    return extractRequestFromPrimaryAndFull(primaryText, fullText, prereqText);
  };

  // Parse API details given a primary text slice (e.g., a section) and the full message text
  const extractRequestFromPrimaryAndFull = (primaryText, fullText, prereqText = '') => {

    // First try to find method in the create section, then in the full text if needed
  let method = 'GET';
  const labeledMethod = primaryText.match(/\s*(?:Method|HTTP\s*Method)\s*[:=]\s*(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/im) || 
             fullText.match(/\s*(?:Method|HTTP\s*Method)\s*[:=]\s*(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/im) ||
             // Support value on next line: "Method:\nPOST"
             primaryText.match(/\b(?:Method|HTTP\s*Method)\s*:\s*\n\s*(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/i) ||
             fullText.match(/\b(?:Method|HTTP\s*Method)\s*:\s*\n\s*(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/i);
    if (labeledMethod) method = labeledMethod[1].toUpperCase();

    // First identify and exclude prerequisites sections from URL extraction
    let nonPrereqText = fullText;
    try {
      const prereqRe = /(^|\n)\s*(?:#{1,6}\s*|\d+\.\s+)?(?:prerequisites|requirements)\b[^\n]*\n([\s\S]*?)(?=(\n\s*(?:#{1,6}\s*|\d+\.\s+)[^\n]+\n)|$)/gi;
      nonPrereqText = fullText.replace(prereqRe, '$1');
    } catch (e) {
      console.error("Error filtering prerequisites:", e);
    }
    
    // For URL extraction, prioritize: 1. Primary section, 2. Non-prereq text, 3. Full text
    let url = '';
    // First look for labeled URL in the primary (section) text
    const labeledUrlInCreate = primaryText ? 
      (primaryText.match(/\s*(?:URL|Endpoint|Request\s*URL|API\s*URL)\s*[:=]\s*(https?:\/\/\S+)/im) ||
       // Support value on next line: "URL:\nhttps://..."
       primaryText.match(/\b(?:URL|Endpoint|Request\s*URL|API\s*URL)\s*:\s*\n\s*(https?:\/\/\S+)/i)) : null;
    if (labeledUrlInCreate) url = labeledUrlInCreate[1];
    
    // If not found, try non-prereq text
    if (!url) {
  const labeledUrlNonPrereq = nonPrereqText.match(/\s*(?:URL|Endpoint|Request\s*URL|API\s*URL)\s*[:=]\s*(https?:\/\/\S+)/im) ||
              nonPrereqText.match(/\b(?:URL|Endpoint|Request\s*URL|API\s*URL)\s*:\s*\n\s*(https?:\/\/\S+)/i);
      if (labeledUrlNonPrereq) url = labeledUrlNonPrereq[1];
    }
    
    // If still not found, look for method+URL pattern in the primary section
    if (!url && primaryText) {
      const methodAndUrlCreate = primaryText.match(/\b(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b\s+(https?:\/\/[^\s"'()`<>]+)/i);
      if (methodAndUrlCreate) {
        if (!labeledMethod) method = methodAndUrlCreate[1].toUpperCase();
        url = methodAndUrlCreate[2];
      }
    }
    
    // If still not found, try method+URL in non-prereq text
    if (!url) {
      const methodAndUrlNonPrereq = nonPrereqText.match(/\b(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b\s+(https?:\/\/[^\s"'()`<>]+)/i);
      if (methodAndUrlNonPrereq) {
        if (!labeledMethod) method = methodAndUrlNonPrereq[1].toUpperCase();
        url = methodAndUrlNonPrereq[2];
      }
    }
    
    // Last resort: look for any URL in primary section or non-prereq text
    if (!url && primaryText) {
      const urlOnlyCreate = primaryText.match(/https?:\/\/[^\s)"']+/);
      if (urlOnlyCreate) url = urlOnlyCreate[0];
    }
    
    if (!url) {
      const urlOnlyNonPrereq = nonPrereqText.match(/https?:\/\/[^\s)"']+/);
      url = urlOnlyNonPrereq ? urlOnlyNonPrereq[0] : '';
    }

    // Extract params from create section first, then full text
    const params = [];
    const paramSectionMatch = primaryText.match(/(?:Query\s*Params?|Parameters?)[:\n]+([\s\S]{0,400})/i) ||
                             fullText.match(/(?:Query\s*Params?|Parameters?)[:\n]+([\s\S]{0,400})/i);
    if (paramSectionMatch) {
      let block = paramSectionMatch[1];
      const cut = block.search(/\n(?:Headers?|Body|Request|Response)\b|\n\n/);
      if (cut !== -1) block = block.slice(0, cut);
      block.split(/\r?\n/).forEach(line => {
        const trimmed = line.trim(); if (!trimmed) return;
        let m = trimmed.match(/^([A-Za-z0-9_.-]+)\s*=\s*(.+)$/);
        if (!m) m = trimmed.match(/^([A-Za-z0-9_.-]+)\s*[:]\s*(.+)$/);
        if (m) params.push({ id: Date.now()+Math.random(), key: m[1].trim(), value: m[2].trim(), enabled: true });
      });
    }
    try {
      if (url && url.includes('?')) {
        const qStr = url.split('?')[1].split('#')[0];
        new URLSearchParams(qStr).forEach((v,k) => {
          if (!params.some(p => p.key === k)) params.push({ id: Date.now()+Math.random(), key: k, value: v, enabled: true });
        });
      }
    } catch {}
    if (!params.length) params.push({ id: 1, key: '', value: '', enabled: true });

    // Extract headers from create section first, then full text if needed
    const headers = [];
    const headerSectionMatch = primaryText.match(/(?:Headers?|Request Headers?)[:\n]+([\s\S]{0,400})/i) ||
                              fullText.match(/(?:Headers?|Request Headers?)[:\n]+([\s\S]{0,400})/i);
    if (headerSectionMatch) {
      let block = headerSectionMatch[1];
      const cut = block.search(/\n(?:Query\s*Params?|Parameters?|Body|Request|Response)\b|\n\n/);
      if (cut !== -1) block = block.slice(0, cut);
      block.split(/\r?\n/).forEach(line => {
        const trimmed = line.trim(); if (!trimmed) return;
        const m = trimmed.match(/^(?:-\s*)?([A-Za-z0-9-]+)\s*[:=]\s*(.+)$/);
        if (m) {
          const key = m[1].trim(); if (params.some(p => p.key === key)) return;
          headers.push({ id: Date.now()+Math.random(), key, value: m[2].trim(), enabled: true });
        }
      });
    }
    if (!headers.length) headers.push({ id: 1, key: '', value: '', enabled: true });

    // Extract request body from create section first, then full text if needed
    let body = '';
    // First get all content before any response sections
    const primaryPreResponse = primaryText.split(/\n(?:Response|Sample\s*Response|\w+\s*Response)\b/i)[0] || primaryText;
    const fullPreResponse = fullText.split(/\n(?:Response|Sample\s*Response|\w+\s*Response)\b/i)[0] || fullText;
    
    // Try to find in create section first
    const fenceRe = /```(?:json)?\n([\s\S]*?)```/gi;
    let fenceMatch;
    while ((fenceMatch = fenceRe.exec(primaryPreResponse)) !== null) {
      const idx = fenceMatch.index; 
      const context = primaryPreResponse.slice(Math.max(0, idx - 220), idx);
      if (/(Body|Request\s*Body|Payload|Request\s*Payload|Data|JSON\s*Body)\b/i.test(context)) { 
        body = fenceMatch[1].trim(); 
        break; 
      }
    }
    
    // Try labeled body section in create section
    if (!body) {
      const labeled = primaryPreResponse.match(/(?:Body|Request\s*Body|Payload|Request\s*Payload|Data|JSON\s*Body)[:\s]*\n([\s\S]{0,4000})/i);
      if (labeled) {
        const section = labeled[1];
        const inFence = section.match(/```(?:json)?\n([\s\S]*?)```/i);
        if (inFence) body = inFence[1].trim();
        else { const inline = section.match(/\{[\s\S]*\}/); if (inline && inline[0].length < 10000) body = inline[0]; }
      }
    }
    
    // If nothing found in create section, try the full text
    if (!body) {
      // Try full text fence blocks with body keyword context
      let fullTextMatch;
      const fullFenceRe = /```(?:json)?\n([\s\S]*?)```/gi;
      while ((fullTextMatch = fullFenceRe.exec(fullPreResponse)) !== null) {
        const idx = fullTextMatch.index; 
        const context = fullPreResponse.slice(Math.max(0, idx - 220), idx);
        if (/(Body|Request\s*Body|Payload|Request\s*Payload|Data|JSON\s*Body)\b/i.test(context)) { 
          body = fullTextMatch[1].trim(); 
          break; 
        }
      }
      
      // Try labeled body section in full text
      if (!body) {
        const labeled = fullPreResponse.match(/(?:Body|Request\s*Body|Payload|Request\s*Payload|Data|JSON\s*Body)[:\s]*\n([\s\S]{0,4000})/i);
        if (labeled) {
          const section = labeled[1];
          const inFence = section.match(/```(?:json)?\n([\s\S]*?)```/i);
          if (inFence) body = inFence[1].trim();
          else { const inline = section.match(/\{[\s\S]*\}/); if (inline && inline[0].length < 10000) body = inline[0]; }
        }
      }
    }
    
    // Last resort for POST/PUT methods - any fenced block
    if (!body && /^(POST|PUT|PATCH|DELETE)$/i.test(method)) {
      const createFence = primaryPreResponse.match(/```(?:json)?\n([\s\S]*?)```/i);
      const fullFence = fullPreResponse.match(/```(?:json)?\n([\s\S]*?)```/i);
      if (createFence) body = createFence[1].trim();
      else if (fullFence) body = fullFence[1].trim();
    }

    const decodeHtml = (str) => {
      if (!str) return '';
      const textarea = document.createElement('textarea');
      textarea.innerHTML = str;
      return textarea.value.replace(/\\u003c/g, '<').replace(/\\u003e/g, '>');
    };
    url = decodeHtml(url);
    headers.forEach(h => { h.key = decodeHtml(h.key); h.value = decodeHtml(h.value); });
    params.forEach(p => { p.key = decodeHtml(p.key); p.value = decodeHtml(p.value); });
    body = decodeHtml(body);

    return { method, url, headers, params, body, prerequisites: prereqText };
  };

  // Decide if a response is an executable API instruction with all required pieces
  const isExecutableApiResponse = (text) => {
    try {
      if (!text || typeof text !== 'string') return false;
      const { method, url, headers = [], body = '' } = extractRequestFromContent(text);
      const hasUrl = /^https?:\/\//i.test(url || '');
      const hasMethod = /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$/i.test((method || '').toUpperCase());
      const hasHeaders = Array.isArray(headers) && headers.some(h => (h?.key || '').trim().length > 0);
      const hasApiKey = Array.isArray(headers) && headers.some(h => {
        const key = (h?.key || '').toLowerCase();
        const val = (h?.value || '').toLowerCase();
        return /^(authorization|x-api-key|api-key|apikey)$/.test(key) || /bearer\s+[a-z0-9._-]+/i.test(val);
      });
      // Fallback body detection: look for labeled JSON body even if extractor couldn't isolate it
      const hasBodyLabelJson = /(?:Request\s*Body|Body|Payload|JSON\s*Body)[^\n]*\n[\s\S]*?\{[\s\S]*?\}/i.test(text);
      const hasAnyJsonBraces = /\{[\s\S]*\}/.test(text);
      const hasBody = (typeof body === 'string' && body.trim().length > 0) || hasBodyLabelJson || hasAnyJsonBraces;
      return hasUrl && hasMethod && hasHeaders && hasApiKey && hasBody;
    } catch {
      return false;
    }
  };

  // Handle play click: open manual Execution Console directly
  const handlePlayClick = (assistantMessage) => {
    openExecutionConsole(assistantMessage);
  };

  // Real-time streaming from fetch response
  const streamResponseFromFetch = async (response, messageId) => {
    try {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedData = '';
      let responseText = '';
      let sourceFiles = [];
      let hasStartedStreaming = false;

      while (true) {
        if (cancelStreamRef.current) break;

        const { done, value } = await reader.read();
        if (done) break;

        // Decode the chunk
        const chunk = decoder.decode(value, { stream: true });
        accumulatedData += chunk;

        // Try to parse JSON if we have complete data
        try {
          const data = JSON.parse(accumulatedData);
          responseText = data.rawData || data.response || data.message || 'No data available from backend.';
          sourceFiles = data.sourceFiles || [];
          
          // Apply formatting
          responseText = reformatShellIfNeeded(responseText);
          responseText = reformatYamlIfNeeded(responseText);
          responseText = reformatJavaIfNeeded(responseText);

          // Decide whether to show Manual/Automatic choice
          const shouldShowExecChoice = isExecutableApiResponse(responseText);
          setHiddenMessageIds(prev => {
            const next = { ...prev };
            if (shouldShowExecChoice) next[messageId] = true; else delete next[messageId];
            return next;
          });
          // Cache prerequisites if applicable
          if (shouldShowExecChoice) {
            const parsed = extractRequestFromContent(responseText);
            setPrereqById(prev => ({ ...prev, [messageId]: parsed.prerequisites || '' }));
          } else {
            setPrereqById(prev => ({ ...prev, [messageId]: '' }));
          }

          // Start streaming the complete response
          await streamResponse(responseText, messageId, sourceFiles);
          break;
        } catch (e) {
          // JSON is incomplete, continue reading
          // But start streaming any readable text we have
          if (!hasStartedStreaming && accumulatedData.length > 50) {
            hasStartedStreaming = true;
            // Extract any readable text and start streaming partial content
            const partialText = extractReadableText(accumulatedData);
            if (partialText) {
              await streamResponse(partialText + '...', messageId, []);
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
      // Fall back to error streaming
      await streamResponse('Error occurred while streaming response.', messageId, []);
    }
  };

  // Helper function to extract readable text from partial JSON
  const extractReadableText = (data) => {
    try {
      // Try to find response text in partial JSON
      const responseMatch = data.match(/"(?:rawData|response|message)"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/);
      if (responseMatch && responseMatch[1]) {
        return responseMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
      }
    } catch (e) {
      // Ignore parsing errors
    }
    return '';
  };

  // Enhanced streaming function with natural timing
  const streamResponse = async (responseText, messageId, sourceFiles) => {
    const words = responseText.split(' ');
    let currentContent = '';
    
    for (let i = 0; i < words.length; i++) {
      if (cancelStreamRef.current) break;
      currentContent += (i > 0 ? ' ' : '') + words[i];
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { 
              ...msg, 
              content: currentContent, 
              sourceFiles: i === words.length - 1 ? sourceFiles : [] // Add source files at the end
            }
          : msg
      ));
      
      // Watson-like streaming timing - faster and more natural
      let delay = 15; // Very fast base delay
      
      if (words[i].endsWith('.') || words[i].endsWith('!') || words[i].endsWith('?')) {
        delay = 100; // Brief pause at sentence endings
      } else if (words[i].endsWith(',') || words[i].endsWith(':') || words[i].endsWith(';')) {
        delay = 50; // Quick pause at punctuation
      } else if (words[i].includes('\n')) {
        delay = 80; // Pause at line breaks
      } else if (words[i].startsWith('```') || words[i].includes('```')) {
        delay = 120; // Pause at code blocks
      } else if (words[i].startsWith('**') || words[i].includes('**')) {
        delay = 30; // Slight pause for formatting
      } else if (words[i].length > 12) {
        delay = 25; // Slightly longer for very long words
      }
      
      // Add some randomness for natural feel (±5ms)
      delay += Math.random() * 10 - 5;
      delay = Math.max(5, delay); // Minimum 5ms delay
      
  await new Promise(resolve => setTimeout(resolve, delay));
    }
  };

  // Function to provide simple fallback responses
  const getMockResponse = (userInput) => {
    return `Backend service is currently unavailable. Your query "${userInput}" has been noted. Please try again later when the service is restored.`;
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading && inputMessage.trim()) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    // stop any ongoing stream
    cancelStreamRef.current = true;
    setIsStreaming(false);
    setStreamingMessageId(null);
    setIsLoading(false);
    setShowWelcome(true); // Show welcome screen again
    setMessages([]); // Clear all messages
    setInputMessage('');
    setError(null);
    try { localStorage.removeItem('chatMessages'); } catch (e) { /* ignore */ }
    inputRef.current?.focus();
  };

  const onEraseClick = () => {
    if (skipClearConfirm) {
      clearChat();
    } else {
      setShowClearConfirm(true);
    }
  };

  const handleConfirmClear = () => {
    // Preference is already persisted on checkbox change
    clearChat();
    setShowClearConfirm(false);
  };

  const handleCancelClear = () => {
    setShowClearConfirm(false);
  };

  const openExecutionConsole = (assistantMessage) => {
    const { method, url, headers, params, body } = extractRequestFromContent(assistantMessage.content || '');
    setExecPrefill({ url, method, headers, params, body });
    setShowExec(true);
  };

  // Open Execution Console for a specific section title within a message
  const openExecutionConsoleForSection = (assistantMessage, sectionTitle) => {
    try {
      const full = assistantMessage.content || '';
      // Build sections using the same heading detection as elsewhere
      const headingRe = /(^|\n)\s*(?:#{1,6}\s*|\d+\.\s+)([^\n]+)/gi;
      const indices = [];
      let match;
      while ((match = headingRe.exec(full)) !== null) {
        const title = (match[2] || '').trim();
        const start = match.index + (match[1] ? match[1].length : 0);
        indices.push({ title, start });
      }
      if (!indices.length) {
        // Fallback: use entire content
        const parsed = extractRequestFromPrimaryAndFull(full, full, '');
        setExecPrefill(parsed);
        setShowExec(true);
        return;
      }
      // Find the first heading whose title includes the sectionTitle text (case-insensitive)
      const idx = indices.findIndex(h => h.title.toLowerCase().includes(sectionTitle.toLowerCase()));
      const useIdx = idx !== -1 ? idx : 0;
      const start = indices[useIdx].start;
      const end = useIdx + 1 < indices.length ? indices[useIdx + 1].start : full.length;
      const sectionText = full.slice(start, end);
      const parsed = extractRequestFromPrimaryAndFull(sectionText, full, '');
      setExecPrefill(parsed);
      setShowExec(true);
    } catch (e) {
      // On any error, fallback to whole message extraction
      openExecutionConsole(assistantMessage);
    }
  };

  // Open Execution Console for a section derived from raw text (used by GitHub modal)
  const openExecutionConsoleForSectionFromRaw = (rawText, sectionTitle) => {
    try {
      const full = rawText || '';
      const headingRe = /(^|\n)\s*(?:#{1,6}\s*|\d+\.\s+)([^\n]+)/gi;
      const indices = [];
      let match;
      while ((match = headingRe.exec(full)) !== null) {
        const title = (match[2] || '').trim();
        const start = match.index + (match[1] ? match[1].length : 0);
        indices.push({ title, start });
      }
      if (!indices.length) {
        const parsed = extractRequestFromPrimaryAndFull(full, full, '');
        // Close GitHub modal first to avoid stacking issues
        setGitModal(prev => ({ ...prev, open: false }));
        setTimeout(() => { setExecPrefill(parsed); setShowExec(true); }, 0);
        return;
      }
      const idx = indices.findIndex(h => h.title.toLowerCase().includes(sectionTitle.toLowerCase()));
      const useIdx = idx !== -1 ? idx : 0;
      const start = indices[useIdx].start;
      const end = useIdx + 1 < indices.length ? indices[useIdx + 1].start : full.length;
      const sectionText = full.slice(start, end);
      const parsed = extractRequestFromPrimaryAndFull(sectionText, full, '');
      // Close GitHub modal first to avoid stacking issues
      setGitModal(prev => ({ ...prev, open: false }));
      setTimeout(() => { setExecPrefill(parsed); setShowExec(true); }, 0);
    } catch (e) {
      const parsed = extractRequestFromPrimaryAndFull(rawText || '', rawText || '', '');
      setGitModal(prev => ({ ...prev, open: false }));
      setTimeout(() => { setExecPrefill(parsed); setShowExec(true); }, 0);
    }
  };

  // No automatic execution flow

  const handleSampleQuestion = (question) => {
    setInputMessage(question);
    setShowWelcome(false);
    // Trigger sending the message after a brief delay to ensure state updates
    setTimeout(() => {
      sendMessageWithText(question);
    }, 100);
  };

  const sendMessageWithText = async (messageText = inputMessage) => {
    if (showWelcome) {
      setShowWelcome(false);
    }
    
    if (!messageText.trim()) return;

    const userMessage = {
      id: uuidv4(),
      type: 'user',
      content: messageText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setError(null);

    // Create loading placeholder message for assistant
    const assistantMessageId = uuidv4();
    const assistantMessage = {
      id: assistantMessageId,
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(true);

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();
    cancelStreamRef.current = false;

    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          sessionId: 'web-session-' + Date.now(),
          includeContext: true,
          fastMode: true,
          fullContent: true
        }),
        signal: abortControllerRef.current.signal,
      });

      if (response.ok) {
        // Start real-time streaming immediately
        setIsLoading(false);
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId 
            ? { 
                ...msg, 
                isLoading: false,
                content: '',
                sourceFiles: []
              }
            : msg
        ));
  setIsStreaming(true);
  setStreamingMessageId(assistantMessageId);
        
  // Use real-time streaming from fetch; hidden/prereq set inside
  await streamResponseFromFetch(response, assistantMessageId);
      } else {
        const responseText = 'Backend service unavailable. Please try again later.';
        // Use streaming for error messages too
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId
            ? {
                ...msg,
                isLoading: false,
                content: '',
                isError: true,
                sourceFiles: []
              }
            : msg
        ));
        setIsStreaming(true);
        setStreamingMessageId(assistantMessageId);
  await streamResponse(responseText, assistantMessageId, []);
  setPrereqById(prev => ({ ...prev, [assistantMessageId]: '' }));
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        const responseText = 'Unable to connect to backend service. Please check your connection and try again.';
        // Use streaming for error messages in catch block too
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId
            ? {
                ...msg,
                isLoading: false,
                content: '',
                isError: true,
                sourceFiles: []
              }
            : msg
        ));
        setIsStreaming(true);
        setStreamingMessageId(assistantMessageId);
  await streamResponse(responseText, assistantMessageId, []);
  setPrereqById(prev => ({ ...prev, [assistantMessageId]: '' }));
      } else {
        // If aborted, remove the loading message
        setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setStreamingMessageId(null);
      abortControllerRef.current = null;
      inputRef.current?.focus();
    }
  };

  return (
    <div className="carbon-chat-interface">
      {error && (
        <InlineNotification
          kind="error"
          title="Connection Error"
          subtitle={error}
          onCloseButtonClick={() => setError(null)}
          lowContrast
        />
      )}

      {showWelcome ? (
        <WelcomeScreen onSampleClick={handleSampleQuestion} />
      ) : (
        <div className="messages-container">
          {messages.map((message) => (
            <MessageComponent
              key={message.id}
              message={message}
              isStreaming={isStreaming && message.id === streamingMessageId}
              onOpenExec={handlePlayClick}
              onOpenExecSection={openExecutionConsoleForSection}
              onOpenGitFile={openGitFileModal}
              hidden={!!hiddenMessageIds[message.id]}
              collapsed={!!collapsedMessageIds[message.id]}
              onToggleCollapse={() => setCollapsedMessageIds(prev => ({ ...prev, [message.id]: !prev[message.id] }))}
              onRevealManual={() => {
                setHiddenMessageIds(prev => { const n = { ...prev }; delete n[message.id]; return n; });
                setCollapsedMessageIds(prev => ({ ...prev, [message.id]: false }));
              }}
              canExecute={isExecutableApiResponse(message.content || '')}
              prereqText={prereqById[message.id] || extractRequestFromContent(message.content || '').prerequisites}
            />
          ))}

          <div ref={messagesEndRef} className="scroll-anchor" />
        </div>
      )}

      <div className="input-container">
        <div className="typing-box">
          <div className={`watson-input ${isLoading ? 'disabled' : ''}`}>
            <input
              ref={inputRef}
              id="message-input"
              type="text"
              placeholder="Type something..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isLoading}
              className={isLoading || isStreaming ? 'input-active' : ''}
              autoComplete="off"
            />
            <button
              type="button"
              className="icon-btn erase"
              onClick={onEraseClick}
              aria-label="Clear chat"
              title="Clear chat"
            >
              <Erase size={20} />
            </button>
            <button
              type="button"
              className={`icon-btn send ${isStreaming || isLoading ? 'as-stop' : ''}`}
              onClick={isStreaming || isLoading ? stopStreaming : sendMessage}
              disabled={!inputMessage.trim() && !(isStreaming || isLoading)}
              aria-label={isStreaming || isLoading ? 'Stop generation' : 'Send message'}
              title={isStreaming || isLoading ? 'Stop' : 'Send message'}
            >
              {isStreaming || isLoading ? (
                <StopFilledAlt size={20} />
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>
          <div className="input-glow" aria-hidden="true"></div>
        </div>
        <div className="footer-gradient" aria-hidden="true"></div>
      </div>
      {/* Clear chat confirmation modal */}
      <Modal
        open={showClearConfirm}
        modalHeading="Clear chat conversation?"
        primaryButtonText="Clear"
        secondaryButtonText="Cancel"
        onRequestClose={handleCancelClear}
        onRequestSubmit={handleConfirmClear}
        preventCloseOnClickOutside
        className="clear-chat-modal"
      >
        <div className="clear-modal-body">
          <p>
            If you clear this chat, you save it in the session history. You will begin a new chat.
          </p>
          <div className="clear-modal-checkbox">
            <Checkbox
              id="skip-clear-confirm"
              labelText="Don't show this again"
              checked={skipClearConfirm}
              onChange={(arg1, arg2) => {
                // Support both signatures: (checked, id) and (event, { checked })
                const next = typeof arg1 === 'boolean'
                  ? arg1
                  : (arg2 && typeof arg2.checked === 'boolean')
                    ? arg2.checked
                    : !!(arg1 && arg1.target && arg1.target.checked);
                setSkipClearConfirm(next);
                try { localStorage.setItem('clearConfirmSkip', String(next)); } catch {}
              }}
            />
          </div>
        </div>
      </Modal>
      {/* Automatic/Manual flow removed: play button opens manual console directly */}
      {/* Inline choice in message; modal removed */}

      {/* GitHub file preview modal */}
      <Modal
        open={gitModal.open}
        passiveModal
        modalHeading={gitModal.title || 'GitHub File'}
        onRequestClose={() => setGitModal(prev => ({ ...prev, open: false }))}
        className="github-preview-modal"
        size="lg"
      >
        <div className="github-modal-body">
          {gitModal.meta && (
            <div className="github-meta" style={{ marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--cds-text-secondary, #6f6f6f)' }}>
              {gitModal.meta.repository}
              {gitModal.meta.branch ? `@${gitModal.meta.branch}` : ''}
              {gitModal.meta.path ? ` — ${gitModal.meta.path}` : ''}
            </div>
          )}
          {gitModal.loading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem 0' }}>
              <Loading withOverlay={false} description="Loading file…" small={false} />
            </div>
          )}
          {gitModal.error && (
            <InlineNotification
              kind="error"
              title="Failed to load file"
              subtitle={gitModal.error}
              lowContrast
            />
          )}
          {!gitModal.loading && !gitModal.error && gitModal.content && (
            <div className="markdown-content" style={{ maxHeight: '60vh', overflow: 'auto' }}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => {
                    const title = getNodeText(children).trim();
                    const showPlay = /^(\d+\.|create|query|update|delete)/i.test(title);
                    return (
                      <div className="section-heading-row">
                        <h3 style={{marginTop: '1.5rem', marginBottom: '0.5rem', fontWeight: 600}}>{children}</h3>
                        {showPlay && (
                          <button
                            className="section-play-btn tools-icon-btn"
                            title={`Execute: ${title}`}
                            aria-label={`Execute section: ${title}`}
                            onClick={() => openExecutionConsoleForSectionFromRaw(gitModal.content, title)}
                          >
                            <PlayFilledAlt size={16} />
                          </button>
                        )}
                      </div>
                    );
                  },
                  h2: ({ children }) => {
                    const title = getNodeText(children).trim();
                    const showPlay = /^(\d+\.|create|query|update|delete)/i.test(title);
                    return (
                      <div className="section-heading-row">
                        <h4 style={{marginTop: '1rem', marginBottom: '0.5rem', fontWeight: 600}}>{children}</h4>
                        {showPlay && (
                          <button
                            className="section-play-btn tools-icon-btn"
                            title={`Execute: ${title}`}
                            aria-label={`Execute section: ${title}`}
                            onClick={() => openExecutionConsoleForSectionFromRaw(gitModal.content, title)}
                          >
                            <PlayFilledAlt size={16} />
                          </button>
                        )}
                      </div>
                    );
                  },
                  h3: ({ children }) => {
                    const title = getNodeText(children).trim();
                    const showPlay = /^(\d+\.|create|query|update|delete)/i.test(title);
                    return (
                      <div className="section-heading-row">
                        <h5 style={{marginTop: '0.75rem', marginBottom: '0.25rem', fontWeight: 600}}>{children}</h5>
                        {showPlay && (
                          <button
                            className="section-play-btn tools-icon-btn"
                            title={`Execute: ${title}`}
                            aria-label={`Execute section: ${title}`}
                            onClick={() => openExecutionConsoleForSectionFromRaw(gitModal.content, title)}
                          >
                            <PlayFilledAlt size={16} />
                          </button>
                        )}
                      </div>
                    );
                  },
                  p({children, node, ...props}) {
                    const text = getNodeText(children).trim();
                    const looksLikeSection = /^\d+\.\s+\S+/.test(text);
                    const hasInlineCode = node && node.children && node.children.some(ch => ch.tagName === 'code');
                    if (looksLikeSection && !hasInlineCode) {
                      return (
                        <div className="section-heading-row" {...props}>
                          <p style={{margin: 0}}>{children}</p>
                          <button
                            className="section-play-btn tools-icon-btn"
                            title={`Execute: ${text}`}
                            aria-label={`Execute section: ${text}`}
                            onClick={() => openExecutionConsoleForSectionFromRaw(gitModal.content, text)}
                          >
                            <PlayFilledAlt size={16} />
                          </button>
                        </div>
                      );
                    }
                    return <p {...props}>{children}</p>;
                  },
                  code({ node, inline, className, children, ...props }) {
                    const language = className ? className.replace('language-', '') : '';
                    if (!inline) {
                      return (
                        <pre className="streaming-code-block" data-lang={language} {...props}>
                          <code>{String(children).replace(/\n$/, '')}</code>
                        </pre>
                      );
                    }
                    return (
                      <code className={`inline-code ${className || ''}`.trim()} {...props}>
                        {children}
                      </code>
                    );
                  },
                  pre({ children }) { return <>{children}</>; },
                  a: ({ href, children }) => (
                    <Link href={href || '#'} target="_blank" rel="noopener noreferrer">{children}</Link>
                  )
                }}
              >
                {gitModal.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </Modal>
      {showExec && (
        <ExecutionConsole
          open={showExec}
          initialUrl={execPrefill.url}
          initialMethod={execPrefill.method}
          initialHeaders={execPrefill.headers}
          initialParams={execPrefill.params}
          initialBody={execPrefill.body}
          onClose={() => setShowExec(false)}
        />
      )}
    </div>
  );
}

export default CarbonChatInterface;
