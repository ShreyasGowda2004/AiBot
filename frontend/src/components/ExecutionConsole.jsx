import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Button,
  TextInput,
  TextArea,
  Select,
  SelectItem,
  InlineNotification,
  Toggle,
  CodeSnippet,
  Tag
} from '@carbon/react';
import { Close, Play, Add, Subtract } from '@carbon/icons-react';
import './ExecutionConsole.css';

/*
 ExecutionConsole - lightweight Postman-like runner (not a full API testing tool).
 Allows user to compose and execute HTTP requests (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS)
 with query params, headers, and raw JSON body. Uses fetch() directly from the browser.
 Dark theme styling aligned with existing black header (#161616).
*/

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

function ExecutionConsole({ open, onClose, initialUrl = '', initialMethod = 'GET', initialHeaders = null, initialParams = null, initialBody = '' }) {
  const [method, setMethod] = useState(initialMethod);
  const [url, setUrl] = useState(initialUrl);
  const norm = (items) => (items || []).map(it => ({ id: it.id || Date.now()+Math.random(), key: it.key||'', value: it.value||'', enabled: it.enabled!==false }));
  const [params, setParams] = useState(initialParams && initialParams.length ? norm(initialParams) : [{ id: 1, key: '', value: '', enabled: true }]);
  const [headers, setHeaders] = useState(initialHeaders && initialHeaders.length ? norm(initialHeaders) : [{ id: 1, key: '', value: '', enabled: true }]);
  const [body, setBody] = useState(initialBody || '');
  // bodyMode: currently only 'raw-json' per requirement, extensible for future (e.g., 'raw-text','form-data')
  const [bodyMode, setBodyMode] = useState('raw-json');
  const [showBody, setShowBody] = useState(true);
  const [responseMeta, setResponseMeta] = useState(null); // { status, timeMs, size, ok }
  const [responseHeaders, setResponseHeaders] = useState([]); // [{key,value}]
  const [responseBody, setResponseBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [pretty, setPretty] = useState(true);
  const [autoFormatJson, setAutoFormatJson] = useState(true);

  useEffect(() => {
    if (open) {
      // Refresh from initial props each time it opens
      setMethod(initialMethod);
      setUrl(initialUrl);
  setParams(initialParams && initialParams.length ? norm(initialParams) : [{ id: 1, key: '', value: '', enabled: true }]);
  setHeaders(initialHeaders && initialHeaders.length ? norm(initialHeaders) : [{ id: 1, key: '', value: '', enabled: true }]);
      setBody(initialBody || '');
    } else {
      // reset ephemeral response state when closing
      setResponseMeta(null);
      setResponseHeaders([]);
      setResponseBody('');
      setError(null);
      setIsSending(false);
    }
  }, [open, initialUrl, initialMethod, initialHeaders, initialParams, initialBody]);

  if (!open) return null;

  const updateRow = (type, id, field, value) => {
    const setter = type === 'param' ? setParams : setHeaders;
    const list = type === 'param' ? params : headers;
    setter(list.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const addRow = (type) => {
    const setter = type === 'param' ? setParams : setHeaders;
    const list = type === 'param' ? params : headers;
    setter([...list, { id: Date.now() + Math.random(), key: '', value: '', enabled: true }]);
  };

  const removeRow = (type, id) => {
    const setter = type === 'param' ? setParams : setHeaders;
    const list = type === 'param' ? params : headers;
    if (list.length === 1) {
      // just clear
      setter([{ id: 1, key: '', value: '', enabled: true }]);
    } else {
      setter(list.filter(r => r.id !== id));
    }
  };

  const buildFinalUrl = () => {
    const activeParams = params.filter(p => p.enabled && p.key.trim());
    if (!activeParams.length) return url.trim();
    const q = new URLSearchParams();
    activeParams.forEach(p => q.append(p.key.trim(), p.value));
    const base = url.trim().replace(/[?&]$/, '');
    return base + (base.includes('?') ? '&' : '?') + q.toString();
  };

  const sendRequest = async () => {
    setError(null);
    setIsSending(true);
    setResponseMeta(null);
    setResponseBody('');
    setResponseHeaders([]);

    const requestUrl = buildFinalUrl();
    if (!requestUrl) {
      setError('URL required');
      setIsSending(false);
      return;
    }

    // Validate URL format
    try {
      new URL(requestUrl);
    } catch (urlError) {
      setError(`Invalid URL format: ${requestUrl}`);
      setIsSending(false);
      return;
    }

    const activeHeaders = headers.filter(h => h.enabled && h.key.trim());
    const requestHeaders = {};
    activeHeaders.forEach(h => { requestHeaders[h.key.trim()] = h.value; });

    let requestBody = '';
    if (canSendBody && body) {
      if (bodyMode === 'raw-json') {
        try {
          // Pre-validate JSON before sending to proxy
          const parsed = JSON.parse(body);
          if (!Object.keys(requestHeaders).some(k => k.toLowerCase() === 'content-type')) {
            requestHeaders['Content-Type'] = 'application/json';
          }
          requestBody = JSON.stringify(parsed);
        } catch (e) {
          requestBody = body; // Send as-is if not valid JSON
        }
      } else {
        requestBody = body;
      }
    }

    const start = performance.now();
    try {
      console.log('ExecutionConsole: Sending request to proxy:', {
        method: method,
        url: requestUrl,
        headers: requestHeaders,
        bodyLength: requestBody ? requestBody.length : 0
      });

      const proxyResponse = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: method,
          url: requestUrl,
          headers: requestHeaders,
          body: requestBody,
        }),
      });

      const timeMs = performance.now() - start;
      
      console.log('ExecutionConsole: Proxy response status:', proxyResponse.status);
      
      let proxyData;
      try {
        const responseText = await proxyResponse.text();
        console.log('ExecutionConsole: Raw response:', responseText.substring(0, 200));
        proxyData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('ExecutionConsole: JSON parse error:', parseError);
        throw new Error(`Invalid response from proxy: ${parseError.message}`);
      }

      // Check if this is a proxy error (our proxy failed) vs target server error
      if (!proxyResponse.ok && !proxyData.status) {
        // This is a proxy error - our proxy failed
        const errorMsg = proxyData.error || proxyData.details || `Proxy error ${proxyResponse.status}`;
        throw new Error(errorMsg);
      }

      // For target server responses (including error responses), show the response
      // This is normal behavior - like Postman shows 400, 500 responses
      let formattedBody = proxyData.body || '[empty response]';
      if (autoFormatJson && proxyData.body) {
        try {
          const parsed = JSON.parse(proxyData.body);
          formattedBody = JSON.stringify(parsed, null, 2);
        } catch (e) { 
          // Not JSON, keep as is
          formattedBody = proxyData.body;
        }
      }
      
      const responseHeadersList = [];
      if (proxyData.headers && typeof proxyData.headers === 'object') {
        Object.entries(proxyData.headers).forEach(([k,v]) => {
          responseHeadersList.push({key: k, value: String(v)});
        });
      }

      setResponseMeta({
        status: `${proxyData.status || 'Unknown'} ${proxyData.statusText || ''}`.trim(),
        timeMs: Math.round(timeMs),
        size: proxyData.body ? proxyData.body.length : 0,
        ok: proxyData.status >= 200 && proxyData.status < 300,
      });
      setResponseHeaders(responseHeadersList);
      setResponseBody(formattedBody);

    } catch (e) {
      console.error('ExecutionConsole request failed:', e);
      setError(e.message || 'Request failed');
    } finally {
      setIsSending(false);
    }
  };

  const canSendBody = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  const overlay = (
    <div className="execution-console-overlay" role="dialog" aria-label="Execution Console">
      <div className="execution-console">
        <div className="exec-header">
          <div className="exec-title">
            <Play size={20} style={{ marginRight: '0.5rem' }} /> API Execution Console
            {responseMeta && (
              <span className="meta-badges">
                <Tag size="sm" type={responseMeta.ok ? 'green' : 'red'}>{responseMeta.status}</Tag>
                <Tag size="sm" type="cool-gray">{responseMeta.timeMs} ms</Tag>
                <Tag size="sm" type="teal">{responseMeta.size} chars</Tag>
              </span>
            )}
          </div>
          <button className="exec-close-btn" onClick={onClose} aria-label="Close execution console"><Close size={20} /></button>
        </div>

        <div className="exec-section request-builder">
          <div className="request-top-row">
            <Select id="http-method" className="method-select" labelText="Method" inline hideLabel value={method} onChange={e => setMethod(e.target.value)}>
              {HTTP_METHODS.map(m => <SelectItem key={m} value={m} text={m} />)}
            </Select>
            <TextInput id="request-url" labelText="URL" hideLabel placeholder="https://api.example.com/resource" value={url} onChange={e => setUrl(e.target.value)} className="url-input cds-dark-input" />
            <Button kind="primary" size="md" onClick={sendRequest} disabled={isSending}> {isSending ? 'Sending...' : 'Send'} </Button>
          </div>
          {(/hostname/i.test(url)) && (
            <div className="hostname-warning">
              <InlineNotification
                kind="warning"
                lowContrast
                hideCloseButton
                title="Replace placeholder hostname"
                subtitle="Change 'hostname' in the URL to your actual server host before sending the request."
              />
            </div>
          )}
          {(/<your-apikey-value>/i.test(url) || 
            headers.some(h => h.enabled && (/<your-apikey-value>/i.test(h.key) || /<your-apikey-value>/i.test(h.value))) ||
            /<your-apikey-value>/i.test(body)) && (
            <div className="apikey-warning">
              <InlineNotification
                kind="warning"
                lowContrast
                hideCloseButton
                title="Replace API key placeholder"
                subtitle="Replace '<your-apikey-value>' with your actual API key before sending the request."
              />
            </div>
          )}

          <div className="row-groups">
            <SectionTable
              title="Query Params"
              rows={params}
              onAdd={() => addRow('param')}
              onRemove={(id) => removeRow('param', id)}
              onChange={(id, field, value) => updateRow('param', id, field, value)}
            />
            <SectionTable
              title="Headers"
              rows={headers}
              onAdd={() => addRow('header')}
              onRemove={(id) => removeRow('header', id)}
              onChange={(id, field, value) => updateRow('header', id, field, value)}
            />
          </div>

          <div className="body-editor">
            <div className="body-header">
              <span>Body</span>
              <div className="body-controls">
                <select
                  aria-label="Body mode"
                  className="body-mode-select"
                  value={bodyMode}
                  onChange={e => setBodyMode(e.target.value)}
                >
                  <option value="raw-json">raw-json</option>
                </select>
                {bodyMode === 'raw-json' && (
                  <label className="inline-toggle">
                    <input type="checkbox" checked={autoFormatJson} onChange={() => setAutoFormatJson(v => !v)} /> auto-format JSON
                  </label>
                )}
                <button
                  type="button"
                  className="body-toggle-btn"
                  onClick={() => setShowBody(s => !s)}
                  aria-label={showBody ? 'Hide body editor' : 'Show body editor'}
                >
                  {showBody ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            {showBody && (
              <>
                <TextArea
                  id="request-body"
                  labelText="Request Body"
                  hideLabel
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder={bodyMode === 'raw-json' ? '{"name":"value"}' : 'Request body'}
                  rows={10}
                  className="raw-body-textarea"
                />
                <div className="body-hint">Body is only sent with POST, PUT, PATCH, DELETE. Current method: {method}{!canSendBody ? ' (will be ignored)' : ''}</div>
              </>
            )}
          </div>
        </div>

        <div className="exec-section response-viewer">
          <h4>Response</h4>
          {error && (
            <InlineNotification kind="error" title="Error" subtitle={error} lowContrast onCloseButtonClick={() => setError(null)} />
          )}
          {!error && !responseMeta && (
            <div className="placeholder">Send a request to see the response.</div>
          )}
          {responseMeta && !error && (
            <div className="response-panels">
              <div className="response-headers">
                <h5>Headers</h5>
                {responseHeaders.length === 0 && <div className="placeholder small">No headers</div>}
                {responseHeaders.length > 0 && (
                  <ul className="headers-list">
                    {responseHeaders.map(h => (
                      <li key={h.key}><strong>{h.key}:</strong> {h.value}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="response-body">
                <h5>Body</h5>
                <div className="code-wrapper">
                  <CodeSnippet type="multi" feedback="Copied" hideCopyButton={false} style={{ maxHeight: '260px', overflow: 'auto' }}>
                    {responseBody}
                  </CodeSnippet>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="execution-console-backdrop" onClick={onClose} />
    </div>
  );

  // Render above any other modals
  return createPortal(overlay, document.body);
}

function SectionTable({ title, rows, onAdd, onRemove, onChange }) {
  return (
    <div className="table-section">
      <div className="section-header">
        <h5>{title}</h5>
        <Button kind="ghost" size="sm" onClick={onAdd} renderIcon={Add}>Add</Button>
      </div>
      <div className="kv-rows">
        {rows.map(r => (
          <div key={r.id} className="kv-row">
            <input
              className="kv-enable"
              type="checkbox"
              checked={r.enabled}
              onChange={e => onChange(r.id, 'enabled', e.target.checked)}
              aria-label="Enable row"
            />
            <TextInput
              id={title + '-key-' + r.id}
              labelText="Key"
              hideLabel
              placeholder="key"
              value={r.key}
              onChange={e => onChange(r.id, 'key', e.target.value)}
              className="kv-input key cds-dark-input"
            />
            <TextInput
              id={title + '-value-' + r.id}
              labelText="Value"
              hideLabel
              placeholder="value"
              value={r.value}
              onChange={e => onChange(r.id, 'value', e.target.value)}
              className="kv-input value cds-dark-input"
            />
            <button className="row-remove-btn" onClick={() => onRemove(r.id)} aria-label="Remove row">
              <Subtract size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ExecutionConsole;
