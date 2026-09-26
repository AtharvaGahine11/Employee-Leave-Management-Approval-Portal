import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  activeFilter?: string;
  onFilterChange?: (filter: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  title,
  subtitle,
  activeFilter = 'This Month',
  onFilterChange,
}) => {
  return (
    <div className="min-h-screen w-full bg-[#f8fafc] flex flex-col lg:flex-row text-slate-900 selection:bg-slate-900 selection:text-white pb-24 lg:pb-0 overflow-x-hidden">
      {/* Desktop Slim Icon Dock */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] min-h-screen">
        {/* Top Header with Brand, User Profile & Time Filters */}
        <Header
          title={title}
          subtitle={subtitle}
          activeFilter={activeFilter}
          onFilterChange={onFilterChange}
        />

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1480px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

