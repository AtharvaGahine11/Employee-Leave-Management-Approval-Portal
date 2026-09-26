import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';

// Pages
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { EmployeeDashboard } from '../pages/employee/EmployeeDashboard';
import { ApplyLeavePage } from '../pages/employee/ApplyLeavePage';
import { MyLeavesPage } from '../pages/employee/MyLeavesPage';
import { RequestDetailPage } from '../pages/employee/RequestDetailPage';
import { LeaveBalancePage } from '../pages/employee/LeaveBalancePage';
import { ProfilePage } from '../pages/employee/ProfilePage';

import { ManagerDashboard } from '../pages/manager/ManagerDashboard';
import { ManagerApprovalsPage } from '../pages/manager/ManagerApprovalsPage';
import { TeamLeavesPage } from '../pages/manager/TeamLeavesPage';

import { HrDashboard } from '../pages/hr/HrDashboard';
import { HrLeavesPage } from '../pages/hr/HrLeavesPage';
import { HrAuditPage } from '../pages/hr/HrAuditPage';
import { HrDepartmentsPage } from '../pages/hr/HrDepartmentsPage';

import { NotificationsPage } from '../pages/common/NotificationsPage';
import { NotFoundPage } from '../pages/common/NotFoundPage';

export const RootRedirect: React.FC = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'HR') return <Navigate to="/hr/dashboard" replace />;
  if (user.role === 'MANAGER') return <Navigate to="/manager/dashboard" replace />;
  return <Navigate to="/employee/dashboard" replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Root Role Redirect */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <RootRedirect />
          </ProtectedRoute>
        }
      />

      {/* Employee Routes */}
      <Route
        path="/employee/dashboard"
        element={
          <ProtectedRoute>
            <EmployeeDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/apply-leave"
        element={
          <ProtectedRoute>
            <ApplyLeavePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/leaves"
        element={
          <ProtectedRoute>
            <MyLeavesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/leaves/:id"
        element={
          <ProtectedRoute>
            <RequestDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/balance"
        element={
          <ProtectedRoute>
            <LeaveBalancePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Manager Routes */}
      <Route
        path="/manager/dashboard"
        element={
          <RoleRoute allowedRoles={['MANAGER', 'HR']}>
            <ManagerDashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/manager/approvals"
        element={
          <RoleRoute allowedRoles={['MANAGER', 'HR']}>
            <ManagerApprovalsPage />
          </RoleRoute>
        }
      />
      <Route
        path="/manager/team-leaves"
        element={
          <RoleRoute allowedRoles={['MANAGER', 'HR']}>
            <TeamLeavesPage />
          </RoleRoute>
        }
      />

      {/* HR Routes */}
      <Route
        path="/hr/dashboard"
        element={
          <RoleRoute allowedRoles={['HR']}>
            <HrDashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/hr/leaves"
        element={
          <RoleRoute allowedRoles={['HR']}>
            <HrLeavesPage />
          </RoleRoute>
        }
      />
      <Route
        path="/hr/leaves/:id"
        element={
          <RoleRoute allowedRoles={['HR']}>
            <RequestDetailPage />
          </RoleRoute>
        }
      />
      <Route
        path="/hr/reports"
        element={
          <RoleRoute allowedRoles={['HR']}>
            <HrDashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/hr/departments"
        element={
          <RoleRoute allowedRoles={['HR']}>
            <HrDepartmentsPage />
          </RoleRoute>
        }
      />
      <Route
        path="/hr/audit"
        element={
          <RoleRoute allowedRoles={['HR']}>
            <HrAuditPage />
          </RoleRoute>
        }
      />

      {/* Common Routes */}
      <Route
        path="/common/notifications"
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/common/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Catch-all 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
