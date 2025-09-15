import React from "react";

interface AdminPanelLayoutProps {
  children: React.ReactNode;
}

export default function AdminPanelLayout({ children }: AdminPanelLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-grey-accent-50 to-white text-foreground font-sans">
      <div className="flex flex-col items-center">
        <div className="w-full max-w-7xl px-8 py-8">
          {children}
        </div>
      </div>
    </div>
  );
}
