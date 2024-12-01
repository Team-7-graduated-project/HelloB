import { Routes, Route } from "react-router-dom";
import HostDashboard from "./HostDashboard";
import HostLogin from "./HostLogin";
import HostRegisterPage from "./HostRegister";
import HostPlaces from "./HostPlaces";
import YourHome from "./YourHome";
import ProtectedRoute from "../ProtectedRoute";

import PlacePage from "../pages/PlacePage";
import HostBookings from "./HostBooking";
import HostReviews from "./HostReviews";
import PlacesFormPage from "../pages/PlacesFormPage";
import VoucherFormPage from "../pages/VoucherFormPage";
import VoucherListPage from "./VoucherList";
import HostAnalytics from "./HostAnalytics";

function HostRoutes() {
  return (
    <Routes>
      {/* Protected Route for Host Dashboard */}

      <Route
        path="/host/dashboard"
        element={
          <ProtectedRoute requiredRole="host">
            <HostDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/host/vouchers"
        element={
          <ProtectedRoute requiredRole="host">
            <VoucherListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/host/vouchers/new"
        element={
          <ProtectedRoute requiredRole="host">
            <VoucherFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/host/vouchers/:id"
        element={
          <ProtectedRoute requiredRole="host">
            <VoucherFormPage />
          </ProtectedRoute>
        }
      />
      {/* Host Places Routes */}
      <Route
        path="/host/places"
        element={
          <ProtectedRoute requiredRole="host">
            <HostPlaces />
          </ProtectedRoute>
        }
      />
      <Route
        path="/host/analytics"
        element={
          <ProtectedRoute requiredRole="host">
            <HostAnalytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/host/places/new"
        element={
          <ProtectedRoute requiredRole="host">
            <PlacesFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/host/places/:id"
        element={
          <ProtectedRoute requiredRole="host">
            <PlacesFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/place/:id"
        element={
          <ProtectedRoute requiredRole="host">
            <PlacePage />
          </ProtectedRoute>
        }
      />
      {/* Host Authentication Routes */}
      <Route path="/host/login" element={<HostLogin />} />
      <Route path="/host/register" element={<HostRegisterPage />} />

      {/* Other Host Routes */}
      <Route
        path="/host/yourhome"
        element={
          <ProtectedRoute requiredRole="host">
            <YourHome />
          </ProtectedRoute>
        }
      />
      <Route
        path="/host/bookings"
        element={
          <ProtectedRoute requiredRole="host">
            <HostBookings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/host/reviews"
        element={
          <ProtectedRoute requiredRole="host">
            <HostReviews />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default HostRoutes;
