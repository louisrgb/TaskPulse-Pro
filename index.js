
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import htm from 'htm';

const html = htm.bind(React.createElement);

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(html`<${React.StrictMode}><${App} /><//>`);
}
