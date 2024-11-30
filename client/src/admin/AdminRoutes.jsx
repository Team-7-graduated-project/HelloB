// src/admin/AdminRoutes.js
import { Routes, Route } from "react-router-dom";
import AdminDashboard from "./AdminDashboard";
import ManageUsersPage from "./User";
import ManageHostsPage from "./Host";
import ManagePlacesPage from "./Places";
import ProtectedRoute from "../ProtectedRoute";
import Analytics from "./Analytics";
import ManageReportsPage from "./Report";
import ManageAnnouncementsPage from "./Announcement";

function AdminRoutes() {
  return (
    <Routes>
      <ProtectedRoute>
        <Route
          path="/"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        >
          <Route
            path="dashboard"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports"
            element={
              <ProtectedRoute requiredRole="admin">
                <ManageReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="analytics"
            element={
              <ProtectedRoute requiredRole="admin">
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="users"
            element={
              <ProtectedRoute requiredRole="admin">
                <ManageUsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="hosts"
            element={
              <ProtectedRoute requiredRole="admin">
                <ManageHostsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="places"
            element={
              <ProtectedRoute requiredRole="admin">
                <ManagePlacesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="announcements"
            element={
              <ProtectedRoute requiredRole="admin">
                <ManageAnnouncementsPage />
              </ProtectedRoute>
            }
          />
        </Route>
      </ProtectedRoute>
    </Routes>
  );
}

export default AdminRoutes;
