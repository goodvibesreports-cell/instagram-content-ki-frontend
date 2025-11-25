// src/components/Layout.jsx
import React from "react";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";

export default function Layout({
  theme,
  onToggleTheme,
  onLogout,
  userEmail,
  children,
}) {
  return (
    <div className={`app app--${theme}`}>
      <Sidebar />
      <div className="app-main">
        <Topbar
          theme={theme}
          onToggleTheme={onToggleTheme}
          onLogout={onLogout}
          userEmail={userEmail}
        />
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
