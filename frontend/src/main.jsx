import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Global Fetch Interceptor to handle expired or invalid JWT tokens (401 Unauthorized)
const { fetch: originalFetch } = window;
window.fetch = async (...args) => {
  try {
    const response = await originalFetch(...args);
    if (response.status === 401) {
      const userInfo = localStorage.getItem('userInfo');
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
      // Only trigger logout if there is a session stored, and it's not a login attempt
      if (userInfo && !url.includes('/api/auth/login')) {
        console.warn('Unauthorized request detected. Clearing stale session and redirecting to login...');
        localStorage.removeItem('userInfo');
        window.location.href = '/?expired=true';
      }
    }
    return response;
  } catch (error) {
    throw error;
  }
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

