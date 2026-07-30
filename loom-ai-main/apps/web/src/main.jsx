/**
 * @file main.jsx
 * @description Application entry point for Loom AI web client.
 * Initializes React 18 createRoot and mounts the root App component into DOM.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
