
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Add better PDF handling for all shipping types
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

// Ensure consistent PDF MIME type support
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

// Improve handling of PDF blob objects
const originalCreateObjectURL = URL.createObjectURL;
URL.createObjectURL = function(object) {
  // Ensure proper content type is set for PDF blobs
  if (object instanceof Blob) {
    // If it's a PDF or if no content type is set, treat as PDF
    if (object.type === 'application/pdf' || 
        object.type === '' || 
        object.type === 'application/octet-stream' ||
        /pdf/i.test(object.type)) {
      const newBlob = new Blob([object], { type: 'application/pdf' });
      return originalCreateObjectURL(newBlob);
    }
  }
  return originalCreateObjectURL(object);
};

// Add PDF viewer capability check
const checkPdfViewerCapability = () => {
  // Fix: Removed MSStream check and used a more TypeScript-compatible approach
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  
  if (isIOS || isSafari) {
    console.log('Device may have limited PDF viewer capabilities, considering fallbacks');
    // In a real implementation, you might set a flag to use image alternatives
  }
};

checkPdfViewerCapability();

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
