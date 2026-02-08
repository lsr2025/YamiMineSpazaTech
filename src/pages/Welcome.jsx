import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserCog, Briefcase, Loader2 } from 'lucide-react';

const roles = [
  {
    id: 'field_agent',
    title: 'Field Agent',
    description: 'Profile shops and conduct inspections',
    icon: Users,
    color: 'from-blue-600 to-blue-700'
  },
  {
    id: 'coordinator',
    title: 'Coordinator',
    description: 'Manage agents and generate reports',
    icon: UserCog,
    color: 'from-indigo-600 to-indigo-700'
  },
  {
    id: 'ceo',
    title: 'Official',
    description: 'Executive oversight and analytics',
    icon: Briefcase,
    color: 'from-purple-600 to-purple-700'
  }
];

export default function Welcome() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);

  const setRoleMutation = useMutation({
    mutationFn: async (role) => {
      await base44.auth.updateMe({ user_role: role });
    },
    onSuccess: () => {
      navigate(createPageUrl('Dashboard'));
    }
  });

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    setRoleMutation.mutate(roleId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Logo and Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-6">
            <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-blue-900">
              <h1 className="text-5xl font-bold tracking-tight">
                <span className="text-blue-900">Yami</span>
                <span className="text-gray-900">Mine</span>
              </h1>
              <p className="text-sm text-gray-600 mt-2 font-medium">Solutions</p>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Welcome to the Platform
          </h2>
          <p className="text-gray-600 text-lg">
            Spaza Compliance & Funding Readiness System
          </p>
          <p className="text-gray-500 mt-2">
            Select your role to continue
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;
            const isLoading = setRoleMutation.isPending && isSelected;

            return (
              <Card
                key={role.id}
                className={`
                  relative overflow-hidden cursor-pointer transition-all duration-300
                  hover:scale-105 hover:shadow-2xl
                  ${isSelected ? 'ring-4 ring-blue-900 shadow-2xl' : 'shadow-lg'}
                `}
                onClick={() => !setRoleMutation.isPending && handleRoleSelect(role.id)}
              >
                <div className={`h-full bg-gradient-to-br ${role.color} p-6 text-white`}>
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                      <Icon className="w-12 h-12" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-2">{role.title}</h3>
                      <p className="text-white/90 text-sm">{role.description}</p>
                    </div>
                    <Button
                      className="w-full bg-white text-gray-900 hover:bg-gray-100 font-semibold"
                      disabled={setRoleMutation.isPending}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        'Select Role'
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500 text-sm">
          <p>© 2026 YamiMine Solutions</p>
          <p className="mt-1">Enterprise iLembe Development Agency</p>
        </div>
      </div>
    </div>
  );
}