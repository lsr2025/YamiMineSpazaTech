import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useSearchParams, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Circle,
  Upload,
  ArrowLeft,
  Loader2,
  FileText,
  Shield,
  Briefcase,
  Users,
  Settings,
  Award
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const tasks = [
  { key: 'personal_details', label: 'Complete Personal Details', icon: Users, description: 'Fill out contact information and emergency contacts' },
  { key: 'documents_submitted', label: 'Submit Required Documents', icon: FileText, description: 'Upload ID, certificates, and banking details' },
  { key: 'safety_training', label: 'Safety Training', icon: Shield, description: 'Complete health & safety training module' },
  { key: 'compliance_training', label: 'Compliance Training', icon: Award, description: 'Complete compliance and food safety training' },
  { key: 'system_access', label: 'System Access Setup', icon: Settings, description: 'Receive login credentials and system access' },
  { key: 'equipment_issued', label: 'Equipment Collection', icon: Briefcase, description: 'Collect field equipment and materials' },
  { key: 'field_shadowing', label: 'Field Shadowing', icon: Users, description: 'Shadow a senior field agent' },
  { key: 'first_assignment', label: 'Complete First Assignment', icon: CheckCircle2, description: 'Successfully complete your first field task' },
  { key: 'hr_review', label: 'HR Review Meeting', icon: Users, description: 'Final review with HR team' }
];

export default function OnboardingChecklist() {
  const [searchParams] = useSearchParams();
  const onboardingId = searchParams.get('id');
  const queryClient = useQueryClient();
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const { data: onboarding, isLoading } = useQuery({
    queryKey: ['onboarding', onboardingId],
    queryFn: () => base44.entities.Onboarding.get(onboardingId),
    enabled: !!onboardingId
  });

  const updateTask = useMutation({
    mutationFn: async ({ taskKey, value, dateField }) => {
      const updates = {
        [taskKey]: value,
        [dateField]: value ? new Date().toISOString() : null
      };

      // Calculate progress
      const completedTasks = tasks.filter(t => {
        if (t.key === taskKey) return value;
        return onboarding[t.key + '_completed'];
      }).length;
      
      updates.progress_percentage = Math.round((completedTasks / tasks.length) * 100);
      
      if (updates.progress_percentage > 0 && onboarding.status === 'not_started') {
        updates.status = 'in_progress';
      }
      
      if (updates.progress_percentage === 100) {
        updates.status = 'completed';
        updates.completion_date = new Date().toISOString();
      }

      await base44.entities.Onboarding.update(onboardingId, updates);

      // Send notification
      if (value) {
        await base44.functions.invoke('notifyOnboardingProgress', {
          onboarding_id: onboardingId,
          task_completed: tasks.find(t => t.key === taskKey)?.label,
          agent_name: onboarding.agent_name
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    }
  });

  const uploadDocument = useMutation({
    mutationFn: async (file) => {
      setUploadingDoc(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const existingDocs = onboarding.document_urls || [];
      const newDoc = {
        name: file.name,
        url: file_url,
        uploaded_date: new Date().toISOString()
      };

      await base44.entities.Onboarding.update(onboardingId, {
        document_urls: [...existingDocs, newDoc]
      });

      setUploadingDoc(false);
      return newDoc;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    }
  });

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadDocument.mutate(file);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!onboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 flex items-center justify-center">
        <p className="text-slate-400">Onboarding record not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link to={createPageUrl('HRDashboard')}>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">Onboarding Checklist</h1>
            <p className="text-slate-400">{onboarding.agent_name}</p>
          </div>
          <Badge className={
            onboarding.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
            onboarding.status === 'in_progress' ? 'bg-amber-500/20 text-amber-400' :
            'bg-slate-500/20 text-slate-400'
          }>
            {onboarding.status?.replace('_', ' ')}
          </Badge>
        </div>

        {/* Progress Overview */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white text-lg font-semibold">{onboarding.progress_percentage}% Complete</p>
                <p className="text-slate-400 text-sm">
                  Start Date: {format(new Date(onboarding.start_date), 'MMM dd, yyyy')}
                </p>
              </div>
              {onboarding.status === 'completed' && (
                <div className="text-right">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-1" />
                  <p className="text-emerald-400 text-sm">Completed!</p>
                </div>
              )}
            </div>
            <Progress value={onboarding.progress_percentage} className="h-3" />
          </CardContent>
        </Card>

        {/* Tasks */}
        <div className="space-y-4">
          {tasks.map((task, index) => {
            const Icon = task.icon;
            const isCompleted = onboarding[task.key + '_completed'];
            const completionDate = onboarding[task.key + '_date'];

            return (
              <motion.div
                key={task.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50 ${
                  isCompleted ? 'ring-2 ring-emerald-500/50' : ''
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <button
                        onClick={() => updateTask.mutate({
                          taskKey: task.key + '_completed',
                          value: !isCompleted,
                          dateField: task.key + '_date'
                        })}
                        disabled={updateTask.isPending}
                        className="mt-1"
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                        ) : (
                          <Circle className="w-6 h-6 text-slate-500 hover:text-slate-400 transition-colors" />
                        )}
                      </button>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Icon className={`w-5 h-5 ${isCompleted ? 'text-emerald-400' : 'text-slate-400'}`} />
                          <h3 className={`font-semibold ${isCompleted ? 'text-emerald-400' : 'text-white'}`}>
                            {task.label}
                          </h3>
                        </div>
                        <p className="text-slate-400 text-sm mb-3">{task.description}</p>

                        {isCompleted && completionDate && (
                          <p className="text-slate-500 text-xs">
                            Completed on {format(new Date(completionDate), 'MMM dd, yyyy')}
                          </p>
                        )}

                        {/* Document Upload for Documents task */}
                        {task.key === 'documents_submitted' && !isCompleted && (
                          <div className="mt-3">
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                onChange={handleFileUpload}
                                className="hidden"
                                disabled={uploadingDoc}
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="border-slate-600 text-white gap-2"
                                disabled={uploadingDoc}
                              >
                                {uploadingDoc ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Upload className="w-4 h-4" />
                                )}
                                Upload Document
                              </Button>
                            </label>
                          </div>
                        )}

                        {/* Show uploaded documents */}
                        {task.key === 'documents_submitted' && onboarding.document_urls?.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {onboarding.document_urls.map((doc, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm">
                                <FileText className="w-4 h-4 text-cyan-400" />
                                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
                                  {doc.name}
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Notes */}
        {onboarding.notes && (
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50 mt-6">
            <CardHeader>
              <CardTitle className="text-white text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300">{onboarding.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}