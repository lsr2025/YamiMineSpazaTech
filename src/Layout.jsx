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
  BarChart3 } from
'lucide-react';

const navItems = [
{ name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
{ name: 'Shops', icon: Store, page: 'Shops' },
{ name: 'Map View', icon: MapPin, page: 'MapView' },
{ name: 'Analytics', icon: BarChart3, page: 'Analytics' }];


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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="bg-slate-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="text-white">

              <Menu className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">
                <span className="text-blue-900 text-xl">Yami</span>Mine
              </h1>
              <p className="text-[10px] text-slate-400 -mt-0.5">Spaza Compliance</p>
            </div>
          </div>
          <Link to={createPageUrl('NewShop')}>
            <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white gap-1.5">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Shop</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen &&
      <div
        className="lg:hidden fixed inset-0 bg-black/60 z-50"
        onClick={() => setSidebarOpen(false)} />

      }

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full z-50 w-72
        bg-gradient-to-b from-slate-900 to-slate-950 border-r border-slate-800
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                <span className="text-red-500">Yami</span>Mine
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">Spaza Compliance & Funding</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400">

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
                onClick={() => setSidebarOpen(false)}>

                <div className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                  ${isActive ?
                'bg-gradient-to-r from-red-600/20 to-transparent text-white border-l-4 border-red-500' :
                'text-slate-400 hover:bg-slate-800/50 hover:text-white'}
                `
                }>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-red-400' : ''}`} />
                  <span className="font-medium">{item.name}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                </div>
              </Link>);

          })}
        </nav>

        {/* Quick Actions */}
        <div className="p-4 border-t border-slate-800 mt-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 px-4">Quick Actions</p>
          <Link to={createPageUrl('NewShop')} onClick={() => setSidebarOpen(false)}>
            <Button className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white gap-2 justify-start">
              <Plus className="w-4 h-4" />
              Profile New Shop
            </Button>
          </Link>
        </div>

        {/* User Profile */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800 bg-slate-950/50">
          {user ?
          <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
                <span className="text-white font-semibold">
                  {user.full_name?.[0] || user.email?.[0] || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{user.full_name || 'Field Agent'}</p>
                <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px]">
                  {user.role === 'admin' ? 'Administrator' : 'Field Agent'}
                </Badge>
              </div>
              <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-slate-400 hover:text-white hover:bg-slate-800">

                <LogOut className="w-4 h-4" />
              </Button>
            </div> :

          <div className="animate-pulse flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-700" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 bg-slate-700 rounded" />
                <div className="h-2 w-16 bg-slate-700 rounded" />
              </div>
            </div>
          }
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-72 pt-16 lg:pt-0 min-h-screen">
        {children}
      </main>

      {/* Kelestone Branding Watermark */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>);

}