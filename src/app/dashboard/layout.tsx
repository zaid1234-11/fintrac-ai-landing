"use client";

import { useState } from "react";
import  Sidebar  from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";

import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

const Dashboard = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <PanelGroup direction="horizontal" className="min-h-screen bg-background text-foreground">
      {/* Desktop Sidebar */}
      <Panel defaultSize={20} minSize={15} maxSize={25} collapsible className="hidden lg:block">
        <Sidebar isMobile={false} />
      </Panel>
      <PanelResizeHandle className="hidden lg:flex w-[1px] bg-slate-700 hover:bg-primary transition-colors" />

      {/* Main Content */}
      <Panel>
        <div className="flex flex-col h-full">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <main className="p-3 sm:p-4 md:p-6 lg:p-8 flex-1 overflow-y-auto">{children}</main>
        </div>
      </Panel>

      {/* Mobile Sidebar (Overlay) */}
      <Sidebar isMobile={true} isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} />
    </PanelGroup>
  );
};

export default Dashboard;
