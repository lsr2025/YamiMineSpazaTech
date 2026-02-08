import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutDashboard, 
  Store, 
  MapPin, 
  Menu, 
  X,
  LogOut,
  User,
  ChevronRight,
  ClipboardCheck,
  Plus,
  BarChart3
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
  { name: 'Shops', icon: Store, page: 'Shops' },
  { name: 'Map View', icon: MapPin, page: 'MapView' },
  { name: 'Analytics', icon: BarChart3, page: 'Analytics' }
];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false
  });

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  // Hide layout on certain pages
  const fullScreenPages = ['MapView'];
  if (fullScreenPages.includes(currentPageName)) {
    return children;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="text-gray-700"
            >
              <Menu className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">
                <span className="text-blue-900">Yami</span>Mine
              </h1>
              <p className="text-[10px] text-gray-600 -mt-0.5">Spaza Compliance</p>
            </div>
          </div>
          <Link to={createPageUrl('NewShop')}>
            <Button size="sm" className="bg-blue-900 hover:bg-blue-800 text-white gap-1.5">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Shop</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/40 z-50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full z-50 w-72
        bg-white border-r border-gray-200 shadow-lg
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                <span className="text-blue-900">Yami</span>Mine
              </h1>
              <p className="text-xs text-gray-600 mt-0.5">Spaza Compliance & Funding</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = currentPageName === item.page;
            const Icon = item.icon;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                onClick={() => setSidebarOpen(false)}
              >
                <div className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                  ${isActive 
                    ? 'bg-blue-900 text-white shadow-md' 
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                  <span className="font-medium">{item.name}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Quick Actions */}
        <div className="p-4 border-t border-gray-200 mt-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 px-4 font-semibold">Quick Actions</p>
          <Link to={createPageUrl('NewShop')} onClick={() => setSidebarOpen(false)}>
            <Button className="w-full bg-blue-900 hover:bg-blue-800 text-white gap-2 justify-start shadow-sm">
              <Plus className="w-4 h-4" />
              Profile New Shop
            </Button>
          </Link>
        </div>

        {/* User Profile */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center">
                <span className="text-white font-semibold">
                  {user.full_name?.[0] || user.email?.[0] || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 text-sm font-medium truncate">{user.full_name || 'Field Agent'}</p>
                <Badge className="bg-blue-100 text-blue-800 text-[10px]">
                  {user.role === 'admin' ? 'Administrator' : 'Field Agent'}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-200"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="animate-pulse flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 bg-gray-200 rounded" />
                <div className="h-2 w-16 bg-gray-200 rounded" />
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-72 pt-16 lg:pt-0 min-h-screen bg-gray-50">
        {children}
      </main>
    </div>
  );
}