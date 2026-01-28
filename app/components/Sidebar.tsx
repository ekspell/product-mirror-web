import Link from 'next/link';
import { Home, Bell, Settings, HelpCircle } from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="w-64 h-screen bg-gray-50 border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6">
        <h1 className="text-lg font-semibold text-gray-900">Product_Mirror</h1>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4">
        <div className="space-y-1">
          <Link 
            href="/" 
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-900 rounded-lg bg-white shadow-sm"
          >
            <Home size={18} />
            Home
          </Link>
          
          <div className="ml-4 space-y-1">
            <Link 
              href="/" 
              className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-white"
            >
              Changes
              <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">10</span>
            </Link>
            <Link href="/" className="block px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-white">
              Flows
            </Link>
            <Link href="/" className="block px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-white">
              Screens
            </Link>
            <Link href="/" className="block px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-white">
              Components
            </Link>
          </div>
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="px-4 pb-6 space-y-1">
        <Link 
          href="/" 
          className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-white"
        >
          <Bell size={18} />
          Notifications
          <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full ml-auto">5</span>
        </Link>
        <Link href="/" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-white">
          <Settings size={18} />
          Settings
        </Link>
        <Link href="/" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-white">
          <HelpCircle size={18} />
          Support
        </Link>

        {/* User Profile */}
        <div className="flex items-center gap-3 px-3 py-3 mt-4 border-t border-gray-200 pt-4">
          <div className="w-9 h-9 bg-gray-300 rounded-full"></div>
          <div>
            <p className="text-sm font-medium text-gray-900">Olivia Rhye</p>
            <p className="text-xs text-gray-500">olivia@produ...</p>
          </div>
        </div>
      </div>
    </aside>
  );
}