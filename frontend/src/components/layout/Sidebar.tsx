import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutGrid,
  CalendarPlus,
  FileText,
  PieChart,
  CheckSquare,
  Users,
  Building2,
  ShieldAlert,
  Bell,
  User,
  LogOut,
  FolderOpen,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { logout, hasRole } = useAuth();

  const getDockItemClass = ({ isActive }: { isActive: boolean }) =>
    `relative w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 group ${
      isActive
        ? 'bg-slate-950 text-white shadow-md'
        : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100/80'
    }`;

  const getMobileItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center gap-1 p-2 rounded-2xl transition-all ${
      isActive ? 'text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-700'
    }`;

  return (
    <>
      {/* ==========================================
          DESKTOP: Slim Vertical Circular Dock (w-20)
          ========================================== */}
      <aside className="hidden lg:flex w-20 flex-col items-center border-r border-slate-200/70 bg-white flex-shrink-0 sticky top-0 h-screen z-30 overflow-y-auto no-scrollbar">
        {/* Top App Icon (h-16 to perfectly align horizontally with top navbar grid) */}
        <div className="h-16 w-full flex items-center justify-center border-b border-slate-100 flex-shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center text-white font-black text-base shadow-xs border border-white/10 ring-1 ring-slate-900/5 tracking-tighter">
            E
          </div>
        </div>

        {/* Navigation Dock */}
        <nav className="flex flex-col items-center gap-2.5 py-6 w-full">
          {/* Employee Base Links */}
          {hasRole('EMPLOYEE') && (
            <>
              <NavLink to="/employee/dashboard" className={getDockItemClass} title="Dashboard">
                <LayoutGrid className="w-5 h-5" />
              </NavLink>
              <NavLink to="/employee/apply-leave" className={getDockItemClass} title="Apply Leave">
                <CalendarPlus className="w-5 h-5" />
              </NavLink>
              <NavLink to="/employee/leaves" className={getDockItemClass} title="My Leaves">
                <FileText className="w-5 h-5" />
              </NavLink>
              <NavLink to="/employee/balance" className={getDockItemClass} title="Leave Balances">
                <PieChart className="w-5 h-5" />
              </NavLink>
            </>
          )}

          {/* Manager / HR Desk Link */}
          {hasRole('MANAGER') && !hasRole('HR') && (
            <NavLink to="/manager/dashboard" className={getDockItemClass} title="Manager Desk">
              <LayoutGrid className="w-5 h-5" />
            </NavLink>
          )}

          {hasRole('HR') && (
            <NavLink to="/hr/dashboard" className={getDockItemClass} title="HR Command Center">
              <LayoutGrid className="w-5 h-5" />
            </NavLink>
          )}

          {/* Management Approvals & Team */}
          {hasRole(['MANAGER', 'HR']) && (
            <>
              <NavLink to="/manager/approvals" className={getDockItemClass} title="Pending Approvals">
                <CheckSquare className="w-5 h-5" />
              </NavLink>
              <NavLink to="/manager/team-leaves" className={getDockItemClass} title="Team Leaves">
                <Users className="w-5 h-5" />
              </NavLink>
            </>
          )}

          {/* HR Extended Tools */}
          {hasRole('HR') && (
            <>
              <NavLink to="/hr/leaves" className={getDockItemClass} title="All Organization Leaves">
                <FolderOpen className="w-5 h-5" />
              </NavLink>
              <NavLink to="/hr/departments" className={getDockItemClass} title="Departments">
                <Building2 className="w-5 h-5" />
              </NavLink>
              <NavLink to="/hr/audit" className={getDockItemClass} title="Audit Trail">
                <ShieldAlert className="w-5 h-5" />
              </NavLink>
            </>
          )}

          {/* Common Links */}
          <NavLink to="/common/notifications" className={getDockItemClass} title="Notifications">
            <Bell className="w-5 h-5" />
          </NavLink>
          <NavLink to="/common/profile" className={getDockItemClass} title="My Profile">
            <User className="w-5 h-5" />
          </NavLink>
        </nav>

        {/* Bottom Sign Out Icon */}
        <div className="mt-auto pt-6 flex-shrink-0">
          <button
            onClick={logout}
            className="w-11 h-11 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all duration-200"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* ==========================================
          MOBILE: Floating Bottom Navigation Dock (< 1024px)
          ========================================== */}
      <div className="lg:hidden fixed bottom-3 left-3 right-3 z-50 bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-2xl rounded-3xl px-3 py-2 flex items-center justify-around pb-safe">
        {hasRole('EMPLOYEE') && (
          <>
            <NavLink to="/employee/dashboard" className={getMobileItemClass}>
              <LayoutGrid className="w-5 h-5" />
              <span className="text-4xs font-semibold">Home</span>
            </NavLink>
            <NavLink to="/employee/apply-leave" className={getMobileItemClass}>
              <CalendarPlus className="w-5 h-5" />
              <span className="text-4xs font-semibold">Apply</span>
            </NavLink>
            <NavLink to="/employee/leaves" className={getMobileItemClass}>
              <FileText className="w-5 h-5" />
              <span className="text-4xs font-semibold">Leaves</span>
            </NavLink>
          </>
        )}

        {hasRole('MANAGER') && !hasRole('HR') && (
          <>
            <NavLink to="/manager/dashboard" className={getMobileItemClass}>
              <LayoutGrid className="w-5 h-5" />
              <span className="text-4xs font-semibold">Desk</span>
            </NavLink>
            <NavLink to="/manager/approvals" className={getMobileItemClass}>
              <CheckSquare className="w-5 h-5" />
              <span className="text-4xs font-semibold">Approvals</span>
            </NavLink>
          </>
        )}

        {hasRole('HR') && (
          <>
            <NavLink to="/hr/dashboard" className={getMobileItemClass}>
              <LayoutGrid className="w-5 h-5" />
              <span className="text-4xs font-semibold">Desk</span>
            </NavLink>
            <NavLink to="/hr/leaves" className={getMobileItemClass}>
              <FolderOpen className="w-5 h-5" />
              <span className="text-4xs font-semibold">Leaves</span>
            </NavLink>
          </>
        )}

        <NavLink to="/common/notifications" className={getMobileItemClass}>
          <Bell className="w-5 h-5" />
          <span className="text-4xs font-semibold">Alerts</span>
        </NavLink>

        <button
          onClick={logout}
          className="flex flex-col items-center justify-center gap-1 p-2 rounded-2xl text-slate-400 hover:text-rose-600 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-4xs font-semibold">Exit</span>
        </button>
      </div>
    </>
  );
};
