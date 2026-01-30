'use client';

import Link from 'next/link';
import { Home, Bell, Settings, HelpCircle, ChevronLeft, ChevronRight, Activity, Layout, Grid } from 'lucide-react';
import { useState } from 'react';

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={`h-screen border-r border-gray-200 flex flex-col transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`} style={{ backgroundColor: '#F2F2F2' }}>
      {/* Logo & Toggle */}
      <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && <h1 className="text-lg font-semibold text-gray-900">Product_Mirror</h1>}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 hover:bg-gray-200 rounded-md transition-colors text-gray-600 hover:text-gray-900"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4">
        <div className="space-y-1">
          <Link
            href="/"
            className={`flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-900 rounded-lg bg-white shadow-sm ${isCollapsed ? 'justify-center' : ''}`}
            title={isCollapsed ? 'Home' : ''}
          >
            {isCollapsed && <Home size={18} />}
            {!isCollapsed && 'Home'}
          </Link>

          <div className={`${isCollapsed ? '' : 'ml-4'} space-y-1`}>
            <Link
              href="/"
              className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} gap-3 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-white`}
              title={isCollapsed ? 'Changes' : ''}
            >
              <div className="flex items-center gap-3">
                {isCollapsed && <Activity size={18} />}
                {!isCollapsed && 'Changes'}
              </div>
              {!isCollapsed && <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">10</span>}
            </Link>
            <Link
              href="/"
              className={`flex items-center gap-3 px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-white ${isCollapsed ? 'justify-center' : ''}`}
              title={isCollapsed ? 'Flows' : ''}
            >
              {isCollapsed && <Layout size={18} />}
              {!isCollapsed && 'Flows'}
            </Link>
            <Link
              href="/"
              className={`flex items-center gap-3 px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-white ${isCollapsed ? 'justify-center' : ''}`}
              title={isCollapsed ? 'Screens' : ''}
            >
              {isCollapsed && <Grid size={18} />}
              {!isCollapsed && 'Screens'}
            </Link>
            <Link
              href="/"
              className={`flex items-center gap-3 px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-white ${isCollapsed ? 'justify-center' : ''}`}
              title={isCollapsed ? 'Components' : ''}
            >
              {isCollapsed && <Grid size={18} />}
              {!isCollapsed && 'Components'}
            </Link>
          </div>
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="px-4 pb-6 space-y-1">
        <Link
          href="/"
          className={`flex items-center gap-3 px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-white ${isCollapsed ? 'justify-center' : ''}`}
          title={isCollapsed ? 'Notifications' : ''}
        >
          {isCollapsed && <Bell size={18} />}
          {!isCollapsed && 'Notifications'}
          {!isCollapsed && <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full ml-auto">5</span>}
        </Link>
        <Link
          href="/"
          className={`flex items-center gap-3 px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-white ${isCollapsed ? 'justify-center' : ''}`}
          title={isCollapsed ? 'Settings' : ''}
        >
          {isCollapsed && <Settings size={18} />}
          {!isCollapsed && 'Settings'}
        </Link>
        <Link
          href="/"
          className={`flex items-center gap-3 px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-white ${isCollapsed ? 'justify-center' : ''}`}
          title={isCollapsed ? 'Support' : ''}
        >
          {isCollapsed && <HelpCircle size={18} />}
          {!isCollapsed && 'Support'}
        </Link>

        {/* User Profile */}
        <div className={`flex items-center gap-3 px-3 py-3 mt-4 border-t border-gray-200 pt-4 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 bg-gray-300 rounded-full"></div>
          {!isCollapsed && (
            <div>
              <p className="text-sm font-medium text-gray-900">Olivia Rhye</p>
              <p className="text-xs text-gray-500">olivia@produ...</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}