import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Save, Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function NewAgent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    full_name: '',
    employee_id: '',
    phone_number: '',
    id_number: '',
    date_of_birth: '',
    gender: 'male',
    home_address: '',
    municipality: 'KwaDukuza',
    education_level: 'matric',
    employment_start_date: new Date().toISOString().split('T')[0],
    employment_status: 'active',
    notes: ''
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const createAgent = useMutation({
    mutationFn: async (data) => {
      // Create user account first
      const userEmail = `${data.employee_id}@yamimine.local`.toLowerCase();
      
      // Invite user to the system
      await base44.users.inviteUser(userEmail, 'user');

      // Create agent profile
      return await base44.entities.FieldAgent.create({
        ...data,
        user_email: userEmail,
        supervisor_email: user?.email,
        supervisor_name: user?.full_name || user?.email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-agents'] });
      toast.success('Agent added successfully!');
      navigate(createPageUrl('HRDashboard'));
    },
    onError: (error) => {
      toast.error(`Failed to add agent: ${error.message}`);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.full_name || !formData.employee_id) {
      toast.error('Please fill in all required fields');
      return;
    }
    createAgent.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('HRDashboard')}>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Add New Field Agent</h1>
              <p className="text-slate-400 text-sm">Register a new field agent to the system</p>
            </div>
          </div>
          <Link to={createPageUrl('BulkImportAgents')}>
            <Button className="bg-cyan-600 hover:bg-cyan-700">
              Bulk Import
            </Button>
          </Link>
        </div>

        {/* Form */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
          <CardHeader className="border-b border-slate-700/50">
            <CardTitle className="text-white">Agent Information</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Details */}
              <div className="space-y-4">
                <h3 className="text-white font-semibold text-lg">Personal Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white">Full Name *</Label>
                    <Input
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Employee ID *</Label>
                    <Input
                      value={formData.employee_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, employee_id: e.target.value }))}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="EMP001"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Phone Number</Label>
                    <Input
                      value={formData.phone_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="+27..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">ID Number</Label>
                    <Input
                      value={formData.id_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, id_number: e.target.value }))}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="ID number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Date of Birth</Label>
                    <Input
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Gender</Label>
                    <Select value={formData.gender} onValueChange={(v) => setFormData(prev => ({ ...prev, gender: v }))}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-white">Home Address</Label>
                    <Input
                      value={formData.home_address}
                      onChange={(e) => setFormData(prev => ({ ...prev, home_address: e.target.value }))}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="Full address"
                    />
                  </div>
                </div>
              </div>

              {/* Employment Details */}
              <div className="space-y-4">
                <h3 className="text-white font-semibold text-lg">Employment Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white">Municipality</Label>
                    <Select value={formData.municipality} onValueChange={(v) => setFormData(prev => ({ ...prev, municipality: v }))}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue />
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
                    <Label className="text-white">Education Level</Label>
                    <Select value={formData.education_level} onValueChange={(v) => setFormData(prev => ({ ...prev, education_level: v }))}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="matric">Matric</SelectItem>
                        <SelectItem value="certificate">Certificate</SelectItem>
                        <SelectItem value="diploma">Diploma</SelectItem>
                        <SelectItem value="degree">Degree</SelectItem>
                        <SelectItem value="postgraduate">Postgraduate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Employment Start Date</Label>
                    <Input
                      type="date"
                      value={formData.employment_start_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, employment_start_date: e.target.value }))}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Employment Status</Label>
                    <Select value={formData.employment_status} onValueChange={(v) => setFormData(prev => ({ ...prev, employment_status: v }))}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="on_leave">On Leave</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label className="text-white">Additional Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-white h-24"
                  placeholder="Any additional information..."
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                <Link to={createPageUrl('HRDashboard')}>
                  <Button type="button" variant="outline" className="border-slate-600">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={createAgent.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {createAgent.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding Agent...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Add Agent
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}