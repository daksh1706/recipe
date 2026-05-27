import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Global Fetch Interceptor to handle expired or invalid JWT tokens (401 Unauthorized)
const { fetch: originalFetch } = window;
window.fetch = async (...args) => {
  const [resource, config = {}] = args;
  let updatedConfig = { ...config };
  
  const userInfoStr = localStorage.getItem('userInfo');
  if (userInfoStr) {
    try {
      const userInfo = JSON.parse(userInfoStr);
      const token = userInfo?.token;
      const url = typeof resource === 'string' ? resource : resource?.url || '';
      
      // Auto-inject JWT token into any outgoing /api request
      if (token && (url.startsWith('/api/') || url.includes('/api/'))) {
        updatedConfig.headers = {
          ...config.headers,
          'Authorization': `Bearer ${token}`
        };
      }
    } catch (e) {
      console.error('Failed to parse userInfo in fetch interceptor:', e);
    }
  }

  try {
    const response = await originalFetch(resource, updatedConfig);
    if (response.status === 401) {
      const userInfo = localStorage.getItem('userInfo');
      const url = typeof resource === 'string' ? resource : resource?.url || '';
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

