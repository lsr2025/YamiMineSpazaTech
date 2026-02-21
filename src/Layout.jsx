/**
 * Copyright © 2026 Kwahlelwa Group (Pty) Ltd.
 * All Rights Reserved.
 *
 * This source code is confidential and proprietary.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 *
 * Patent Pending - ZA Provisional Application
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SyncManager from '@/components/offline/SyncManager.jsx';
import {
  LayoutDashboard,
  Store,
  MapPin,
  Menu,
  LogOut,
  Plus,
  BarChart3,
  Users,
  ClipboardCheck,
  Shield } from
'lucide-react';

const mobileNavItems = [
{ name: 'Home', icon: LayoutDashboard, page: 'SuperDashboard' },
{ name: 'Shops', icon: Store, page: 'Shops' },
{ name: 'Check In', icon: ClipboardCheck, page: 'MobileCheckIn', highlight: true },
{ name: 'Map', icon: MapPin, page: 'MapView' },
{ name: 'HR', icon: Users, page: 'HRDashboard' }];


const navItems = [
{ name: 'Dashboard', icon: LayoutDashboard, page: 'SuperDashboard' },
{ name: 'Shops', icon: Store, page: 'Shops' },
{ name: 'Map View', icon: MapPin, page: 'MapView' },
{ name: 'Analytics', icon: BarChart3, page: 'Analytics' },
{ name: 'HR', icon: Users, page: 'HRDashboard' },
{ name: 'Admin Panel', icon: Shield, page: 'AdminPanel', adminOnly: true },
{ name: 'Guardrails', icon: Shield, page: 'Guardrails', adminOnly: true }];


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

  const fullScreenPages = ['MapView'];
  if (fullScreenPages.includes(currentPageName)) {
    return children;
  }

  return (
    <div className="min-h-screen bg-[#e8ecf1]">
      <SyncManager />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#e8ecf1] shadow-[8px_8px_16px_#c5c9ce,-8px_-8px_16px_#ffffff]">
        <div className="px-4 py-3 md:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-700 hover:bg-transparent flex-shrink-0">

              <Menu className="w-6 h-6" />
            </Button>
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697cbf49c56a50b05e7118cf/c37070ab4_yamiMinelogo.jpg"
              alt="Yami Mine Solutions"
              className="h-10 md:h-12 object-contain" />

          </div>
          <div className="flex items-center gap-2 md:gap-3">
            {user &&
            <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-full bg-[#e8ecf1] shadow-[inset_4px_4px_8px_#c5c9ce,inset_-4px_-4px_8px_#ffffff]">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0ea5e9] to-[#3b82f6] flex items-center justify-center shadow-[4px_4px_8px_#c5c9ce,-2px_-2px_6px_#ffffff]">
                  <span className="text-white text-sm font-semibold">
                    {user.full_name?.[0] || user.email?.[0] || 'U'}
                  </span>
                </div>
                <span className="text-slate-700 font-medium text-sm truncate max-w-32">{user.full_name || user.email}</span>
              </div>
            }
            <Link to={createPageUrl('NewShop')}>
              <Button className="rounded-full px-3 md:px-6 py-2 bg-gradient-to-r from-[#0ea5e9] to-[#3b82f6] text-white shadow-[6px_6px_12px_#c5c9ce,-3px_-3px_8px_#ffffff] border-0 gap-2 text-sm">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Profile Shop</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen &&
      <div
        className="lg:hidden fixed inset-0 bg-black/40 z-40"
        onClick={() => setSidebarOpen(false)} />

      }

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 bottom-0 z-50 w-72
        bg-[#e8ecf1]
        shadow-[12px_0_24px_#c5c9ce]
        transform transition-transform duration-300 ease-in-out
        lg:top-20 lg:left-6 lg:bottom-6 lg:w-64 lg:rounded-3xl
        lg:shadow-[12px_12px_24px_#c5c9ce,-12px_-12px_24px_#ffffff]
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 h-full flex flex-col pt-16 lg:pt-6">
          {/* Close button for mobile */}
          <div className="lg:hidden flex items-center justify-between mb-6">
            <span className="text-slate-700 font-bold text-lg">Menu</span>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="text-slate-500 hover:bg-transparent">
              <span className="text-xl">✕</span>
            </Button>
          </div>
          {/* Navigation */}
          <nav className="flex-1 space-y-2 overflow-y-auto">
            {navItems.filter((item) => !item.adminOnly || user?.role === 'admin').map((item) => {
              const isActive = currentPageName === item.page;
              const Icon = item.icon;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setSidebarOpen(false)}>

                      <div className={`
                        flex items-center gap-3 px-4 py-3 rounded-2xl transition-all
                        ${isActive ?
                  'bg-gradient-to-r from-[#0ea5e9] to-[#3b82f6] text-white shadow-[6px_6px_12px_#c5c9ce,-3px_-3px_8px_#ffffff]' :
                  'text-slate-600 hover:shadow-[inset_4px_4px_8px_#c5c9ce,inset_-4px_-4px_8px_#ffffff]'}
                      `}>
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{item.name}</span>
                        {item.adminOnly && <span className="ml-auto text-[10px] opacity-60 bg-current/10 px-1.5 py-0.5 rounded-full">Admin</span>}
                      </div>
                    </Link>);

            })}
          </nav>

          {/* User Profile */}
          {user &&
          <div className="mt-4 p-4 rounded-2xl bg-[#e8ecf1] shadow-[inset_6px_6px_12px_#c5c9ce,inset_-6px_-6px_12px_#ffffff]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0ea5e9] to-[#3b82f6] flex items-center justify-center shadow-[4px_4px_8px_#c5c9ce,-2px_-2px_6px_#ffffff]">
                  <span className="text-white font-semibold text-sm">
                    {user.full_name?.[0] || user.email?.[0] || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-700 text-sm font-medium truncate">{user.full_name || 'User'}</p>
                  <p className="text-slate-500 text-xs">{user.role === 'admin' ? 'Admin' : 'Agent'}</p>
                </div>
                <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-slate-500 hover:text-slate-700 hover:bg-transparent">

                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          }
        </div>
      </aside>

      {/* Main Content */}
          <main className="lg:ml-80 pt-16 p-4 md:p-6 pb-24 lg:pb-6 min-h-screen">
            {children}
            <footer className="text-slate-400 mt-12 pt-8 text-xs text-center border-t border-slate-200 space-y-1">
              <p className="pr-8 pb-40 pl-8">© 2026 Kwahlelwa Group (Pty) Ltd. All Rights Reserved.</p>
              <p>Patent Pending. Unauthorized reproduction or use prohibited.</p>
              <p>AfriEconomy Tech™ is a trademark of Kwahlelwa Group.</p>
            </footer>
          </main>

          {/* Mobile Bottom Navigation */}
          <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#e8ecf1] border-t border-slate-200 shadow-[0_-4px_16px_#c5c9ce]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="flex items-center justify-around py-2 px-2">
              {mobileNavItems.map((item) => {
            const isActive = currentPageName === item.page;
            const Icon = item.icon;
            return (
              <Link key={item.page} to={createPageUrl(item.page)} className="flex-1">
                    <div className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all mx-0.5
                      ${item.highlight ?
                'bg-gradient-to-r from-[#0ea5e9] to-[#3b82f6] text-white shadow-[4px_4px_8px_#c5c9ce,-2px_-2px_6px_#ffffff]' :
                isActive ?
                'text-[#0ea5e9]' :
                'text-slate-400 hover:text-slate-600'}`
                }>
                      <Icon className="w-5 h-5" />
                      <span className="text-[10px] font-medium leading-tight">{item.name}</span>
                    </div>
                  </Link>);

          })}
            </div>
          </nav>
        </div>);

}