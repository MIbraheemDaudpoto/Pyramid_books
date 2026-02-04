import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import BootstrapProvider from "@/components/BootstrapProvider";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BootstrapProvider />
    <App />
  </React.StrictMode>,
);
