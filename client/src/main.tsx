import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import BootstrapProvider from "@/components/BootstrapProvider";

// Global error handler for white-screen debugging
window.addEventListener('error', (event) => {
  console.error('[Global Error]', event.error);
  // Show a simple alert if it's a render crash
  if (event.message && !event.message.includes('ResizeObserver')) {
    const errorDiv = document.createElement('div');
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '0';
    errorDiv.style.left = '0';
    errorDiv.style.width = '100%';
    errorDiv.style.background = 'red';
    errorDiv.style.color = 'white';
    errorDiv.style.padding = '1rem';
    errorDiv.style.zIndex = '9999';
    errorDiv.innerText = `Runtime Error: ${event.message}\n${event.error?.stack || ''}`;
    document.body.prepend(errorDiv);
  }
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BootstrapProvider />
    <App />
  </React.StrictMode>,
);
