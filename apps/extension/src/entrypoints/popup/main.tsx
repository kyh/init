import React from "react";
import ReactDOM from "react-dom/client";

import "@/assets/globals.css";
import App from "./app";

const root = document.querySelector("#root");
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
