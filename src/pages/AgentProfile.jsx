import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  BookOpen,
  Award,
  Target,
  TrendingUp,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Progress } from "@/components/ui/progress";

const InfoRow = ({ icon: Icon, label, value, color = "text-slate-400" }) => (
  <div className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg">
    <Icon className={`w-5 h-5 ${color} mt-0.5`} />
    <div>
      <p className="text-slate-400 text-xs">{label}</p>
      <p className="text-white font-medium">{value || 'N/A'}</p>
    </div>
  </div>
);

export default function AgentProfile() {
  const [searchParams] = useSearchParams();
  const agentId = searchParams.get('id');

  const { data: agent, isLoading } = useQuery({
    queryKey: ['field-agent', agentId],
    queryFn: async () => {
      const agents = await base44.entities.FieldAgent.filter({ id: agentId });
      return agents[0];
    },
    enabled: !!agentId
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ['agent-attendance', agent?.user_email],
    queryFn: () => base44.entities.Attendance.filter({ agent_email: agent.user_email }),
    enabled: !!agent?.user_email
  });

  const { data: onboarding } = useQuery({
    queryKey: ['agent-onboarding', agent?.user_email],
    queryFn: async () => {
      if (!agent?.user_email) return null;
      const records = await base44.entities.Onboarding.filter({ agent_email: agent.user_email });
      return records[0] || null;
    },
    enabled: !!agent?.user_email
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white">Agent not found</div>
      </div>
    );
  }

  const totalDays = attendance.length;
  const totalHours = attendance.reduce((sum, a) => sum + (a.hours_worked || 0), 0);
  const totalShopsProfiled = attendance.reduce((sum, a) => sum + (a.shops_profiled || 0), 0);
  const totalInspections = attendance.reduce((sum, a) => sum + (a.inspections_completed || 0), 0);
  const avgHoursPerDay = totalDays > 0 ? (totalHours / totalDays).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Link to={createPageUrl('HRDashboard')}>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Agent Profile</h1>
              <p className="text-slate-400 text-sm">Performance & Development Record</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center mx-auto mb-4">
                    {agent.profile_photo_url ? (
                      <img src={agent.profile_photo_url} alt={agent.full_name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-white font-bold text-3xl">
                        {agent.full_name?.charAt(0) || 'A'}
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-white">{agent.full_name}</h2>
                  <p className="text-slate-400">{agent.employee_id}</p>
                  <Badge className={
                    agent.employment_status === 'active' ? 'bg-emerald-500/20 text-emerald-400 mt-3' :
                    agent.employment_status === 'on_leave' ? 'bg-amber-500/20 text-amber-400 mt-3' :
                    'bg-slate-500/20 text-slate-400 mt-3'
                  }>
                    {agent.employment_status?.replace('_', ' ')}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <InfoRow icon={Mail} label="Email" value={agent.user_email} color="text-cyan-400" />
                  <InfoRow icon={Phone} label="Phone" value={agent.phone_number} color="text-emerald-400" />
                  <InfoRow icon={MapPin} label="Municipality" value={agent.municipality} color="text-amber-400" />
                  <InfoRow icon={Calendar} label="Started" value={agent.employment_start_date ? format(new Date(agent.employment_start_date), 'MMM dd, yyyy') : 'N/A'} color="text-blue-400" />
                  <InfoRow icon={Award} label="Performance" value={agent.performance_rating ? `${agent.performance_rating}/5` : 'N/A'} color="text-red-400" />
                </div>
              </CardContent>
            </Card>

            {/* Education */}
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-cyan-400" />
                  Education
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-xs text-slate-400">Education Level</p>
                    <p className="text-white font-medium capitalize">{agent.education_level || 'N/A'}</p>
                  </div>

                  {agent.qualifications && agent.qualifications.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-400 mb-2">Qualifications</p>
                      {agent.qualifications.map((qual, i) => (
                        <div key={i} className="mb-3 p-3 bg-slate-800/30 rounded-lg">
                          <p className="text-white font-medium text-sm">{qual.qualification}</p>
                          <p className="text-slate-400 text-xs">{qual.institution}</p>
                          <p className="text-slate-500 text-xs">{qual.year_obtained}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {agent.training_completed && agent.training_completed.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-400 mb-2">Training Completed</p>
                      {agent.training_completed.map((training, i) => (
                        <div key={i} className="mb-2 p-3 bg-slate-800/30 rounded-lg">
                          <p className="text-white text-sm">{training.course_name}</p>
                          <p className="text-slate-400 text-xs">{training.provider}</p>
                          <p className="text-slate-500 text-xs">
                            {training.completion_date ? format(new Date(training.completion_date), 'MMM yyyy') : ''}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Career Aspirations */}
            {agent.career_aspirations && (
              <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Target className="w-5 h-5 text-amber-400" />
                    Career Aspirations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300 text-sm">{agent.career_aspirations}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Performance & Attendance */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-cyan-400" />
                    <p className="text-xs text-slate-400">Days Worked</p>
                  </div>
                  <p className="text-2xl font-bold text-white">{totalDays}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <p className="text-xs text-slate-400">Total Hours</p>
                  </div>
                  <p className="text-2xl font-bold text-white">{totalHours.toFixed(1)}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    <p className="text-xs text-slate-400">Shops Profiled</p>
                  </div>
                  <p className="text-2xl font-bold text-white">{totalShopsProfiled}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                    <p className="text-xs text-slate-400">Inspections</p>
                  </div>
                  <p className="text-2xl font-bold text-white">{totalInspections}</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Attendance */}
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Attendance History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {attendance.length === 0 ? (
                    <p className="text-slate-400 text-center py-8">No attendance records yet</p>
                  ) : (
                    attendance.slice(0, 10).map(record => (
                      <motion.div
                        key={record.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800/70 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-cyan-400" />
                            <span className="text-white font-medium">
                              {format(new Date(record.date), 'EEE, MMM dd, yyyy')}
                            </span>
                          </div>
                          <Badge className={
                            record.status === 'checked_out' ? 'bg-blue-500/20 text-blue-400' :
                            record.status === 'checked_in' ? 'bg-emerald-500/20 text-emerald-400' :
                            'bg-slate-500/20 text-slate-400'
                          }>
                            {record.status?.replace('_', ' ')}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <p className="text-slate-400 text-xs">Activity</p>
                            <p className="text-white capitalize">{record.activity_type?.replace('_', ' ')}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs">Location</p>
                            <p className="text-white">{record.municipality || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs">Hours</p>
                            <p className="text-white">{record.hours_worked?.toFixed(1) || 0}h</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs">Impact</p>
                            <p className="text-white">
                              {record.shops_profiled || 0} shops, {record.inspections_completed || 0} inspections
                            </p>
                          </div>
                        </div>

                        {record.notes && (
                          <div className="mt-3 pt-3 border-t border-slate-700/50">
                            <p className="text-slate-400 text-xs mb-1">Notes</p>
                            <p className="text-slate-300 text-sm">{record.notes}</p>
                          </div>
                        )}

                        {record.supervisor_notes && (
                          <div className="mt-2">
                            <p className="text-amber-400 text-xs mb-1">Supervisor Notes</p>
                            <p className="text-slate-300 text-sm">{record.supervisor_notes}</p>
                          </div>
                        )}
                      </motion.div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Onboarding Status */}
            {onboarding && (
              <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50 mb-6">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <span>Onboarding Status</span>
                    <Badge className={
                      onboarding.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                      onboarding.status === 'in_progress' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-slate-500/20 text-slate-400'
                    }>
                      {onboarding.status?.replace('_', ' ')}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-400 text-sm">Progress</span>
                      <span className="text-white font-semibold">{onboarding.progress_percentage}%</span>
                    </div>
                    <Progress value={onboarding.progress_percentage} className="h-2" />
                  </div>
                  {onboarding.status !== 'completed' && (
                    <Link to={createPageUrl(`OnboardingChecklist?id=${onboarding.id}`)}>
                      <Button className="w-full bg-cyan-600 hover:bg-cyan-700">
                        View Checklist
                      </Button>
                    </Link>
                  )}
                  {onboarding.completion_date && (
                    <p className="text-slate-400 text-sm mt-2 text-center">
                      Completed on {format(new Date(onboarding.completion_date), 'MMM dd, yyyy')}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Skills */}
            {agent.skills && agent.skills.length > 0 && (
              <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white">Skills & Competencies</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {agent.skills.map((skill, i) => (
                      <Badge key={i} className="bg-cyan-500/20 text-cyan-400">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {agent.notes && (
              <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white">Additional Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300">{agent.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}