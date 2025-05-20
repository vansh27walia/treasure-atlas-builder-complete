
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Get the root element
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error('Root element not found');

// Set proper styles for the root element to fill the viewport
rootElement.style.width = '100%';
rootElement.style.height = '100%';
rootElement.style.margin = '0';
rootElement.style.padding = '0';
rootElement.style.overflow = 'hidden'; // Prevent scrolling on the body

// Render the app
createRoot(rootElement).render(<App />);
