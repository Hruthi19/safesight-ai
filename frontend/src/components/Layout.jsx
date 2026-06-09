import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Layout.css";

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard" },
    { path: "/detect", label: "Detect" },
    { path: "/report", label: "Report" },
  ];

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-brand">
          <span className="brand-icon">🛡️</span>
          <div>
            <h1>SafeSight AI</h1>
            <p>Hazard Detection & Incident Management</p>
          </div>
        </div>

        <nav className="header-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={location.pathname === item.path ? "active" : ""}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="header-user">
          <div>
            <strong>{user?.username}</strong>
            <span className="role-badge">{user?.role}</span>
          </div>
          <button type="button" onClick={logout} className="btn-secondary">
            Logout
          </button>
        </div>
      </header>

      <main className="app-main">{children}</main>
    </div>
  );
}
