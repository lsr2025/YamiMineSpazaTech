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
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from 'framer-motion';
import { 
  UserCircle, 
  ClipboardCheck, 
  Shield, 
  Building2,
  ArrowRight,
  LogIn
} from 'lucide-react';

const roles = [
  {
    title: 'Field Agents',
    icon: ClipboardCheck,
    color: 'from-red-600 to-red-700',
    description: 'Conduct shop assessments and inspections',
    users: [
      { email: 'fieldagent1@yamiminesolutions.co.za', name: 'Field Agent 1' },
      { email: 'fieldagent2@yamiminesolutions.co.za', name: 'Field Agent 2' }
    ]
  },
  {
    title: 'Coordinators',
    icon: Shield,
    color: 'from-cyan-600 to-cyan-700',
    description: 'Oversee compliance operations',
    users: [
      { email: 'coord@yamiminesolutions.co.za', name: 'Coordinator' }
    ]
  },
  {
    title: 'Officials',
    icon: Building2,
    color: 'from-emerald-600 to-emerald-700',
    description: 'Manage program and review data',
    users: [
      { email: 'fundi@minesolutions.co.za', name: 'Fundi' },
      { email: 'operations@minesolutions.co.za', name: 'Operations' },
      { email: 'finance@minesolutions.co.za', name: 'Finance' },
      { email: 'lona@minesolutions.co.za', name: 'Lona' }
    ]
  }
];

const RoleCard = ({ role, onSelectUser }) => {
  const Icon = role.icon;
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50 overflow-hidden hover:shadow-2xl transition-all">
        <CardContent className="p-6">
          <div 
            className="cursor-pointer"
            onClick={() => setExpanded(!expanded)}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${role.color}`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-1">{role.title}</h3>
                <p className="text-slate-400 text-sm">{role.description}</p>
              </div>
              <motion.div
                animate={{ rotate: expanded ? 90 : 0 }}
                className="text-slate-400"
              >
                <ArrowRight className="w-5 h-5" />
              </motion.div>
            </div>
          </div>

          <motion.div
            initial={false}
            animate={{ height: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 pt-2 border-t border-slate-700">
              {role.users.map((user, idx) => (
                <motion.button
                  key={user.email}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => onSelectUser(user.email)}
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <UserCircle className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                    <div className="text-left">
                      <p className="text-white text-sm font-medium">{user.name}</p>
                      <p className="text-slate-500 text-xs">{user.email}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function Home() {
  const navigate = useNavigate();

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false
  });

  // If already logged in, redirect to dashboard
  React.useEffect(() => {
    if (user && !isLoading) {
      navigate(createPageUrl('Dashboard'));
    }
  }, [user, isLoading, navigate]);

  const handleSelectUser = (email) => {
    base44.auth.redirectToLogin(createPageUrl('SuperDashboard'));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500 rounded-full filter blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-500 rounded-full filter blur-3xl" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
        {/* Logo & Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="mb-6">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-3">
              <span className="text-white">Yami</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-600">Mine</span>
            </h1>
            <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
              <span>Solutions</span>
              <span className="w-1 h-1 rounded-full bg-slate-600" />
              <span>Enterprise iLembe Development Agency</span>
            </div>
          </div>

          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-semibold text-white mb-3">
              Spaza Shop Compliance & Funding Readiness
            </h2>
            <p className="text-slate-400 text-lg">
              Select your role to access the platform
            </p>
          </div>
        </motion.div>

        {/* Role Cards */}
        <div className="w-full max-w-5xl grid md:grid-cols-3 gap-6 mb-12">
          {roles.map((role, idx) => (
            <motion.div
              key={role.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <RoleCard role={role} onSelectUser={handleSelectUser} />
            </motion.div>
          ))}
        </div>

        {/* General Login Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            onClick={() => base44.auth.redirectToLogin()}
            className="bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white px-8 py-6 text-lg gap-3 shadow-xl"
          >
            <LogIn className="w-5 h-5" />
            Sign In with Another Account
          </Button>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-16 text-center"
        >
          <p className="text-slate-500 text-sm">
            Powered by <span className="text-cyan-400 font-semibold">Kelestone Capital</span>
          </p>
          <p className="text-slate-600 text-xs mt-2">
            © 2026 YamiMine Solutions. All rights reserved.
          </p>
        </motion.div>
      </div>
    </div>
  );
}