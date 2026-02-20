/**
 * Copyright © 2026 Kwahlelwa Group (Pty) Ltd.
 * All Rights Reserved.
 *
 * This source code is confidential and proprietary.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 *
 * Patent Pending - ZA Provisional Application
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  Award,
  TrendingUp
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg">
    <Icon className="w-5 h-5 text-cyan-400 mt-0.5" />
    <div className="flex-1 min-w-0">
      <p className="text-slate-400 text-xs">{label}</p>
      <p className="text-white text-sm break-words">{value || 'Not set'}</p>
    </div>
  </div>
);

export default function MyProfile() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: agentProfile } = useQuery({
    queryKey: ['my-agent-profile', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const profiles = await base44.entities.FieldAgent.filter({ user_email: user.email });
      return profiles[0] || null;
    },
    enabled: !!user?.email
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ['my-attendance', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Attendance.filter({ agent_email: user.email }, '-date', 30);
    },
    enabled: !!user?.email
  });

  const totalDays = attendance.length;
  const totalHours = attendance.reduce((sum, a) => sum + (a.hours_worked || 0), 0);
  const shopsProfiled = attendance.reduce((sum, a) => sum + (a.shops_profiled || 0), 0);
  const inspectionsCompleted = attendance.reduce((sum, a) => sum + (a.inspections_completed || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            {agentProfile?.profile_photo_url ? (
              <img src={agentProfile.profile_photo_url} alt="Profile" className="w-full h-full rounded-full object-cover" />
            ) : (
              <User className="w-12 h-12 text-white" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">
            {agentProfile?.full_name || user?.full_name || 'Field Agent'}
          </h1>
          {agentProfile?.employee_id && (
            <p className="text-slate-400 text-sm">ID: {agentProfile.employee_id}</p>
          )}
          <Badge className={`mt-2 ${
            agentProfile?.employment_status === 'active' 
              ? 'bg-emerald-500/20 text-emerald-400' 
              : 'bg-slate-500/20 text-slate-400'
          }`}>
            {agentProfile?.employment_status || 'Active'}
          </Badge>
        </motion.div>

        {/* Contact Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
            <CardContent className="p-4 space-y-3">
              <h2 className="text-white font-semibold mb-3">Contact Information</h2>
              <InfoRow icon={Mail} label="Email" value={user?.email} />
              <InfoRow icon={Phone} label="Phone" value={agentProfile?.phone_number} />
              <InfoRow icon={MapPin} label="Municipality" value={agentProfile?.municipality} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Employment Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
            <CardContent className="p-4 space-y-3">
              <h2 className="text-white font-semibold mb-3">Employment Details</h2>
              {agentProfile?.employment_start_date && (
                <InfoRow 
                  icon={Calendar} 
                  label="Start Date" 
                  value={format(new Date(agentProfile.employment_start_date), 'MMM dd, yyyy')} 
                />
              )}
              <InfoRow icon={Briefcase} label="Role" value={user?.role} />
              {agentProfile?.education_level && (
                <InfoRow icon={Award} label="Education" value={agentProfile.education_level} />
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Performance Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
            <CardContent className="p-4">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                Performance (Last 30 Days)
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-800/50 rounded-lg text-center">
                  <p className="text-3xl font-bold text-white mb-1">{totalDays}</p>
                  <p className="text-slate-400 text-xs">Days Worked</p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-lg text-center">
                  <p className="text-3xl font-bold text-white mb-1">{totalHours.toFixed(0)}</p>
                  <p className="text-slate-400 text-xs">Total Hours</p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-lg text-center">
                  <p className="text-3xl font-bold text-white mb-1">{shopsProfiled}</p>
                  <p className="text-slate-400 text-xs">Shops Profiled</p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-lg text-center">
                  <p className="text-3xl font-bold text-white mb-1">{inspectionsCompleted}</p>
                  <p className="text-slate-400 text-xs">Inspections</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Skills */}
        {agentProfile?.skills && agentProfile.skills.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-6"
          >
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
              <CardContent className="p-4">
                <h2 className="text-white font-semibold mb-3">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {agentProfile.skills.map((skill, index) => (
                    <Badge key={index} className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Career Aspirations */}
        {agentProfile?.career_aspirations && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-6"
          >
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
              <CardContent className="p-4">
                <h2 className="text-white font-semibold mb-3">Career Goals</h2>
                <p className="text-slate-300 text-sm">{agentProfile.career_aspirations}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}