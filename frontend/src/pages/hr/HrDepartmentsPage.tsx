import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { departmentApi } from '../../api';
import { Department } from '../../types';
import { Building2, Users } from 'lucide-react';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';

export const HrDepartmentsPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const data = await departmentApi.getDepartments();
        setDepartments(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDepts();
  }, []);

  return (
    <Layout
      title="Department Management"
      subtitle="Overview of the 8 supported organizational departments"
    >
      <div className="space-y-6">
        {isLoading ? (
          <TableSkeleton rows={4} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {departments.map((d) => (
              <div
                key={d.id}
                className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3 hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-3xs font-bold uppercase text-indigo-600 tracking-wider">
                    Code: {d.code}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">{d.name}</h3>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> Employees
                  </span>
                  <span className="font-bold text-slate-900">Configured</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};
