
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Add PDF.js worker for better PDF handling
// This ensures PDF files are displayed correctly in both domestic and international shipping

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error('Root element not found');
rootElement.style.width = '100%';
rootElement.style.height = '100%';
rootElement.style.margin = '0';
rootElement.style.padding = '0';

// Add meta tag for PDF compatibility
const meta = document.createElement('meta');
meta.name = 'format-detection';
meta.content = 'telephone=no, date=no, email=no, address=no';
document.head.appendChild(meta);

// Fix for PDF content type issues in some browsers
if (!window.navigator.mimeTypes['application/pdf']) {
  console.log('Adding PDF MIME type support');
  // This is a polyfill for browsers that might not recognize PDFs correctly
  Object.defineProperty(window.navigator, 'mimeTypes', {
    value: {
      ...window.navigator.mimeTypes,
      'application/pdf': {
        description: 'Portable Document Format',
        suffixes: 'pdf',
        type: 'application/pdf'
      }
    },
    configurable: true
  });
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
