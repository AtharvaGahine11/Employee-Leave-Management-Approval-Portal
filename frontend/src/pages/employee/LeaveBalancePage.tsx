import React from 'react';
import { Layout } from '../../components/layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { LeaveBalanceCard } from '../../components/leave/LeaveBalanceCard';

export const LeaveBalancePage: React.FC = () => {
  const { balances } = useAuth();

  return (
    <Layout
      title="Leave Balances & Entitlements"
      subtitle="Comprehensive view of your annual leave quotas, used days, pending approvals, and carry-forward rules"
    >
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {balances.map((b) => (
            <LeaveBalanceCard key={b.id} balance={b} />
          ))}
        </div>

        {/* Detailed Entitlement Rules Table */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-4">Organizational Leave Rules Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Leave Type</th>
                  <th className="px-4 py-3">Annual Entitlement</th>
                  <th className="px-4 py-3">Consecutive Days Limit</th>
                  <th className="px-4 py-3">Carry Forward</th>
                  <th className="px-4 py-3">Encashable</th>
                  <th className="px-4 py-3">Advance Notice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                <tr>
                  <td className="px-4 py-3.5 font-bold text-slate-900">CL — Casual Leave</td>
                  <td className="px-4 py-3.5">12 Days / Year</td>
                  <td className="px-4 py-3.5 text-amber-700 font-bold">Max 3 Days</td>
                  <td className="px-4 py-3.5">No</td>
                  <td className="px-4 py-3.5">No</td>
                  <td className="px-4 py-3.5">Immediate</td>
                </tr>
                <tr>
                  <td className="px-4 py-3.5 font-bold text-slate-900">SL — Sick Leave</td>
                  <td className="px-4 py-3.5">12 Days / Year</td>
                  <td className="px-4 py-3.5">No limit (Cert if ≥3 days)</td>
                  <td className="px-4 py-3.5">No</td>
                  <td className="px-4 py-3.5">No</td>
                  <td className="px-4 py-3.5">Immediate</td>
                </tr>
                <tr>
                  <td className="px-4 py-3.5 font-bold text-slate-900">EL — Earned Leave</td>
                  <td className="px-4 py-3.5">15 Days / Year (1.25/mo)</td>
                  <td className="px-4 py-3.5">No limit</td>
                  <td className="px-4 py-3.5 text-purple-700 font-bold">Yes (Max 30 Days)</td>
                  <td className="px-4 py-3.5 text-emerald-700 font-bold">Yes (On Separation)</td>
                  <td className="px-4 py-3.5 font-bold">Min 3 Days Advance</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};
