// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/index.css";
import AppRouter from "./router/AppRouter";
import { AuthProvider } from "./context/AuthContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  </React.StrictMode>
);
