// src/components/Layout.jsx
import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";

export default function Layout({ children, theme, onLogout, userEmail, credits = 0, onNavigate, currentPage }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div className="dashboard-layout">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        onNavigate={onNavigate}
        currentPage={currentPage}
      />
      
      <main className="main-content">
        <Topbar 
          theme={theme}
          onLogout={onLogout}
          userEmail={userEmail}
          credits={credits}
          onMenuClick={() => setSidebarOpen(true)}
          currentPage={currentPage}
        />
        
        <div className="page-content animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
