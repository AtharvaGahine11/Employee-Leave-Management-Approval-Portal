import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { employeeApi } from '../../api';
import { UserProfile } from '../../types';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { OnboardEmployeeModal } from '../../components/employee/OnboardEmployeeModal';
import { Users, Mail, Phone, Calendar, UserPlus } from 'lucide-react';

export const TeamLeavesPage: React.FC = () => {
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showOnboardModal, setShowOnboardModal] = useState<boolean>(false);

  const fetchTeam = async () => {
    try {
      setIsLoading(true);
      const data = await employeeApi.getTeam();
      setTeamMembers(data);
    } catch (err) {
      console.error('Failed to load team members:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  return (
    <Layout
      title="Team Members & Balances"
      subtitle="View your direct reports and manage team onboarding"
    >
      <div className="space-y-6">
        {/* Manager Header Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div>
            <h2 className="text-base font-bold text-slate-900">Direct Reports ({teamMembers.length})</h2>
            <p className="text-xs text-slate-500">
              Manage your department roster and provision new team member accounts.
            </p>
          </div>
          <button
            onClick={() => setShowOnboardModal(true)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-all flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4 text-indigo-400" />
            <span>Onboard Team Member</span>
          </button>
        </div>

        <OnboardEmployeeModal
          isOpen={showOnboardModal}
          onClose={() => setShowOnboardModal(false)}
          onSuccess={fetchTeam}
        />

        {isLoading ? (
          <TableSkeleton rows={4} />
        ) : teamMembers.length === 0 ? (
          <EmptyState
            title="No Direct Reports Found"
            description="You currently don't have any employees assigned under your reporting hierarchy."
            icon="folder"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {teamMembers.map((emp) => (
              <div
                key={emp.id}
                className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-lg shadow-xs">
                    {emp.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{emp.name}</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {emp.username ? `@${emp.username} • ` : ''}{emp.designation} • ID: {emp.employeeId}
                    </p>
                    <span className="inline-block mt-1 text-3xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {emp.department?.name}
                    </span>
                  </div>
                </div>

                <div className="text-xs space-y-1.5 text-slate-600 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{emp.email}</span>
                  </div>
                  {emp.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{emp.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};
