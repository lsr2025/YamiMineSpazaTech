import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Calendar,
  Clock,
  Plus,
  Users,
  MapPin,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, addDays, startOfWeek } from 'date-fns';

export default function ShiftManagement() {
  const queryClient = useQueryClient();
  const [selectedWeek, setSelectedWeek] = useState(startOfWeek(new Date()));
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    agent_email: '',
    shift_date: '',
    start_time: '08:00',
    end_time: '17:00',
    shift_type: 'full_day',
    municipality: '',
    ward: '',
    notes: ''
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['field-agents'],
    queryFn: () => base44.entities.FieldAgent.list('-created_date', 100)
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ['shifts', selectedWeek],
    queryFn: async () => {
      const weekEnd = addDays(selectedWeek, 7);
      return await base44.entities.Shift.list('-shift_date', 200);
    }
  });

  const createShift = useMutation({
    mutationFn: async (data) => {
      const agent = agents.find(a => a.user_email === data.agent_email);
      return await base44.entities.Shift.create({
        ...data,
        agent_name: agent?.full_name || '',
        status: 'scheduled'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      setDialogOpen(false);
      resetForm();
    }
  });

  const updateShiftStatus = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Shift.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    }
  });

  const resetForm = () => {
    setFormData({
      agent_email: '',
      shift_date: '',
      start_time: '08:00',
      end_time: '17:00',
      shift_type: 'full_day',
      municipality: '',
      ward: '',
      notes: ''
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createShift.mutate(formData);
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(selectedWeek, i));

  const getShiftsForDay = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return shifts.filter(s => s.shift_date === dateStr);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500/20 text-blue-400';
      case 'in_progress': return 'bg-emerald-500/20 text-emerald-400';
      case 'completed': return 'bg-green-500/20 text-green-400';
      case 'cancelled': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('HRDashboard')}>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Shift Management</h1>
              <p className="text-slate-400 text-sm">Schedule and manage field agent shifts</p>
            </div>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700 gap-2">
                <Plus className="w-4 h-4" />
                Create Shift
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-white">Create New Shift</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white">Field Agent *</Label>
                    <Select value={formData.agent_email} onValueChange={(v) => setFormData(prev => ({ ...prev, agent_email: v }))}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="Select agent" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {agents.map(agent => (
                          <SelectItem key={agent.id} value={agent.user_email}>
                            {agent.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Date *</Label>
                    <Input
                      type="date"
                      value={formData.shift_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, shift_date: e.target.value }))}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white">Start Time *</Label>
                    <Input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">End Time *</Label>
                    <Input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Shift Type</Label>
                    <Select value={formData.shift_type} onValueChange={(v) => setFormData(prev => ({ ...prev, shift_type: v }))}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="morning">Morning</SelectItem>
                        <SelectItem value="afternoon">Afternoon</SelectItem>
                        <SelectItem value="full_day">Full Day</SelectItem>
                        <SelectItem value="night">Night</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white">Municipality</Label>
                    <Select value={formData.municipality} onValueChange={(v) => setFormData(prev => ({ ...prev, municipality: v }))}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="KwaDukuza">KwaDukuza</SelectItem>
                        <SelectItem value="Mandeni">Mandeni</SelectItem>
                        <SelectItem value="Ndwedwe">Ndwedwe</SelectItem>
                        <SelectItem value="Maphumulo">Maphumulo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Ward</Label>
                    <Input
                      value={formData.ward}
                      onChange={(e) => setFormData(prev => ({ ...prev, ward: e.target.value }))}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="Shift instructions..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="border-slate-600">
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!formData.agent_email || !formData.shift_date || createShift.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {createShift.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Shift'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Week Navigator */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setSelectedWeek(addDays(selectedWeek, -7))}
                className="border-slate-600 text-white"
              >
                Previous Week
              </Button>
              <h3 className="text-white font-medium">
                {format(selectedWeek, 'MMM dd')} - {format(addDays(selectedWeek, 6), 'MMM dd, yyyy')}
              </h3>
              <Button
                variant="outline"
                onClick={() => setSelectedWeek(addDays(selectedWeek, 7))}
                className="border-slate-600 text-white"
              >
                Next Week
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Calendar Grid */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {weekDays.map(day => {
            const dayShifts = getShiftsForDay(day);
            const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

            return (
              <Card key={day.toString()} className={`bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50 ${isToday ? 'ring-2 ring-cyan-500' : ''}`}>
                <CardHeader className="p-3 border-b border-slate-700/50">
                  <CardTitle className="text-sm text-white">
                    {format(day, 'EEE')}
                    <div className="text-xs text-slate-400">{format(day, 'MMM dd')}</div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 space-y-2">
                  {dayShifts.length === 0 ? (
                    <p className="text-slate-500 text-xs text-center py-4">No shifts</p>
                  ) : (
                    dayShifts.map(shift => (
                      <motion.div
                        key={shift.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-2 bg-slate-800/50 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-white text-xs font-medium truncate">{shift.agent_name}</p>
                          <Badge className={`${getStatusColor(shift.status)} text-[10px] px-1`}>
                            {shift.status}
                          </Badge>
                        </div>
                        <p className="text-slate-400 text-[10px] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {shift.start_time} - {shift.end_time}
                        </p>
                        {shift.municipality && (
                          <p className="text-slate-500 text-[10px] flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {shift.municipality}
                          </p>
                        )}
                        {shift.status === 'scheduled' && (
                          <div className="flex gap-1 mt-2">
                            <Button
                              size="sm"
                              onClick={() => updateShiftStatus.mutate({ id: shift.id, status: 'completed' })}
                              className="bg-emerald-600 hover:bg-emerald-700 h-6 text-[10px] px-2 flex-1"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateShiftStatus.mutate({ id: shift.id, status: 'cancelled' })}
                              className="h-6 text-[10px] px-2 flex-1"
                            >
                              <XCircle className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}