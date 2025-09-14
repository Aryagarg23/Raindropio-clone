import React from "react";

interface AdminPanelLayoutProps {
  children: React.ReactNode;
}

export default function AdminPanelLayout({ children }: AdminPanelLayoutProps) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--background)",
      color: "var(--text-primary)",
      fontFamily: "Inter, Nunito Sans, sans-serif",
      padding: "32px 0",
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    }}>
      <div style={{ width: "100%", maxWidth: 1200, padding: "0 32px" }}>
        {children}
      </div>
    </div>
  );
}
