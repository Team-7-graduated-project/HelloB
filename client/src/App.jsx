import "./App.css";
import "./index.css";
import { Route, Routes } from "react-router-dom";
import IndexPage from "./pages/IndexPage";
import LoginPage from "./pages/LoginPage";
import Layout from "./Layout";
import RegisterPage from "./pages/RegisterPage";
import axios from "axios";
import { UserContextProvider } from "./UserContext";
import VoucherPage from "./pages/VoucherPage";

import PlacesFormPage from "./pages/PlacesFormPage";
import ProfilePage from "./pages/ProfilePage";
import PlacePage from "./pages/PlacePage";
import BookingsPage from "./pages/BookingsPage";
import BookingPage from "./pages/BookingPage";
import ReviewPage from "./pages/ReviewPage";
import ReviewsPage from "./pages/ReviewsPage";
import SearchResultsPage from "./pages/SearchResultsPage";

import YourHome from "./host/YourHome";
import HostDashboard from "./host/HostDashboard";
import HostLogin from "./host/HostLogin";
import HostRegisterPage from "./host/HostRegister";
import AdminDashboard from "./admin/AdminDashboard";
import ProtectedRoute from "./ProtectedRoute";
import { GoogleOAuthProvider } from "@react-oauth/google";
import ErrorBoundary from "./components/ErrorBoundary";
import VerifyEmail from "./pages/VerifyEmail";
import ResetPassword from "./pages/ResetPassword";
import { Toaster } from "react-hot-toast";
import AboutUsPage from "./pages/AboutUsPage";
import ServicesPage from "./pages/ServicesPage";
import BlogPage from "./pages/BlogPage";
import ContactPage from "./pages/ContactPage";
import { FavoritesProvider } from "./context/FavoritesContext";
import FavoritesPage from "./pages/FavoritesPage";
import MessagesPage from "./pages/MessagesPage";

axios.defaults.withCredentials = true;
axios.defaults.baseURL = "http://localhost:3000";

function App() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <GoogleOAuthProvider clientId={clientId}>
        <UserContextProvider>
          <FavoritesProvider>
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<IndexPage />} />
                  <Route path="vouchers" element={<VoucherPage />} />
                  <Route path="login" element={<LoginPage />} />
                  <Route path="register" element={<RegisterPage />} />
                  <Route path="account" element={<ProfilePage />} />
                  <Route path="search" element={<SearchResultsPage />} />
                  <Route path="host/places/new" element={<PlacesFormPage />} />
                  <Route path="host/places/:id" element={<PlacesFormPage />} />
                  <Route path="place/:id" element={<PlacePage />} />
                  <Route path="account/bookings" element={<BookingsPage />} />
                  <Route
                    path="account/bookings/:id"
                    element={<BookingPage />}
                  />

                  <Route path="place/:id/review" element={<ReviewPage />} />
                  <Route path="place/:id/reviews" element={<ReviewsPage />} />
                  <Route path="host/yourhome" element={<YourHome />} />
                  <Route path="host/login" element={<HostLogin />} />
                  <Route path="host/register" element={<HostRegisterPage />} />
                  <Route
                    path="host/*"
                    element={
                      <ProtectedRoute requiredRole="host">
                        <HostDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="admin/*"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/verify-email/:token"
                    element={<VerifyEmail />}
                  />
                  <Route
                    path="/reset-password/:token"
                    element={<ResetPassword />}
                  />
                  <Route path="/about" element={<AboutUsPage />} />
                  <Route path="/services" element={<ServicesPage />} />
                  <Route path="/blog" element={<BlogPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/account/history" element={<BookingsPage />} />
                  <Route path="/favorites" element={<FavoritesPage />} />
                  <Route path="/messages" element={<MessagesPage />} />
                  <Route path="/account/messages" element={<MessagesPage />} />
                </Route>
              </Routes>
            </ErrorBoundary>
          </FavoritesProvider>
        </UserContextProvider>
      </GoogleOAuthProvider>
    </>
  );
}

export default App;
