
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

// Improved PDF MIME type and object URL handling
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

// Improve PDF blob handling
const originalCreateObjectURL = URL.createObjectURL;
URL.createObjectURL = function(object) {
  // Ensure proper content type is set for PDF blobs
  if (object instanceof Blob && 
     (object.type === 'application/pdf' || 
      object.type === '' || 
      object.type === 'application/octet-stream')) {
    const newBlob = new Blob([object], { type: 'application/pdf' });
    return originalCreateObjectURL(newBlob);
  }
  return originalCreateObjectURL(object);
};

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
