import React from 'react';
import ReactDOM from 'react-dom/client';
// Ensure the path is correct and you're importing from the .tsx file directly
import Popup from './Popup.tsx';
import '../../index.css'; // Global styles if needed

// This creates the React application and mounts it to the div#root element
const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <Popup />
    </React.StrictMode>
  );
}