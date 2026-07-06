import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Global fetch interceptor to dynamically rewrite localhost API urls in production
const originalFetch = window.fetch;
window.fetch = function (input, init) {
    let url = typeof input === "string" ? input : input.url;
    if (url.startsWith("http://localhost:5000")) {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
        url = url.replace("http://localhost:5000", apiUrl);
    }
    if (typeof input === "string") {
        return originalFetch(url, init);
    } else {
        try {
            const newRequest = new Request(url, input);
            return originalFetch(newRequest, init);
        } catch (e) {
            // Fallback if request cloning fails
            return originalFetch(url, init);
        }
    }
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
