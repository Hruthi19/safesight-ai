import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import DetectionApp from "./components/detection/DetectionApp";
import { AuthProvider } from "./context/AuthContext";
import Analytics from "./pages/Analytics";
import Dashboard from "./pages/Dashboard";
import IncidentDetail from "./pages/IncidentDetail";
import LiveFeed from "./pages/LiveFeed";
import Login from "./pages/Login";
import Report from "./pages/Report";
import "./styles/global.css";

function DetectPage() {
  return <DetectionApp />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/incidents/:id"
            element={
              <ProtectedRoute>
                <IncidentDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/live"
            element={
              <ProtectedRoute>
                <LiveFeed />
              </ProtectedRoute>
            }
          />
          <Route
            path="/detect"
            element={
              <ProtectedRoute>
                <DetectPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/report"
            element={
              <ProtectedRoute>
                <Report />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
