import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Shield, Users, Store, FileText, Settings, BarChart3, Download, AlertTriangle, ChevronRight, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import AdminUserManagement from '@/components/admin/AdminUserManagement';
import AdminShopManagement from '@/components/admin/AdminShopManagement';
import AdminAuditLogs from '@/components/admin/AdminAuditLogs';
import AdminDataExport from '@/components/admin/AdminDataExport';
import AdminAnalytics from '@/components/admin/AdminAnalytics';
import AdminSettings from '@/components/admin/AdminSettings';

const SECTIONS = [
  { key: 'users',    label: 'User Management',  icon: Users,    role: ['admin'], description: 'Manage user accounts and permissions' },
  { key: 'shops',    label: 'Shop Data',         icon: Store,    role: ['admin', 'user'], description: 'Bulk operations and data management' },
  { key: 'export',   label: 'Data Export',       icon: Download, role: ['admin', 'user'], description: 'Export shops, inspections, attendance' },
  { key: 'audit',    label: 'Audit Logs',        icon: FileText, role: ['admin'], description: 'Full activity and change history' },
  { key: 'analytics',label: 'Analytics',         icon: BarChart3,role: ['admin', 'user'], description: 'System usage and data quality' },
  { key: 'settings', label: 'Settings',          icon: Settings, role: ['admin'], description: 'App configuration and POPIA compliance' },
];

export default function AdminPanel() {
  const [activeSection, setActiveSection] = useState('users');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#e8ecf1] flex items-center justify-center p-6">
        <div className="bg-[#e8ecf1] rounded-3xl shadow-[12px_12px_24px_#c5c9ce,-12px_-12px_24px_#ffffff] p-12 text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Access Restricted</h2>
          <p className="text-slate-500 mb-6">The Admin Panel is only accessible to administrators. Contact your system administrator to request access.</p>
          <Link to={createPageUrl('SuperDashboard')}>
            <button className="px-6 py-2 bg-gradient-to-r from-[#0ea5e9] to-[#3b82f6] text-white rounded-xl font-medium">
              Back to Dashboard
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const availableSections = SECTIONS.filter(s => s.role.includes(user?.role === 'admin' ? 'admin' : 'user'));

  const renderSection = () => {
    switch (activeSection) {
      case 'users':    return <AdminUserManagement currentUser={user} />;
      case 'shops':    return <AdminShopManagement currentUser={user} />;
      case 'export':   return <AdminDataExport currentUser={user} />;
      case 'audit':    return <AdminAuditLogs currentUser={user} />;
      case 'analytics':return <AdminAnalytics currentUser={user} />;
      case 'settings': return <AdminSettings currentUser={user} />;
      default:         return <AdminUserManagement currentUser={user} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#e8ecf1]">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0ea5e9] to-[#3b82f6] flex items-center justify-center shadow-[6px_6px_12px_#c5c9ce,-3px_-3px_8px_#ffffff]">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Admin Panel</h1>
          <p className="text-slate-500 text-sm">Data management, security & system controls</p>
        </div>
        <Badge className="ml-auto bg-gradient-to-r from-[#0ea5e9] to-[#3b82f6] text-white border-0 px-3">
          {user?.role === 'admin' ? 'Administrator' : 'Manager'}
        </Badge>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Nav */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-[#e8ecf1] rounded-3xl shadow-[8px_8px_16px_#c5c9ce,-8px_-8px_16px_#ffffff] p-4 space-y-1">
            {availableSections.map(s => {
              const Icon = s.icon;
              const isActive = activeSection === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => setActiveSection(s.key)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#0ea5e9] to-[#3b82f6] text-white shadow-[4px_4px_8px_#c5c9ce]'
                      : 'text-slate-600 hover:shadow-[inset_3px_3px_6px_#c5c9ce,inset_-3px_-3px_6px_#ffffff]'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{s.label}</p>
                    {!isActive && <p className="text-xs text-slate-400 truncate">{s.description}</p>}
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {renderSection()}
        </div>
      </div>
    </div>
  );
}