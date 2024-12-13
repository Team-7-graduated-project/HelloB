import { Routes, Route, Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  FaHome,
  FaCalendar,
  FaStar,
  FaTicketAlt,
  FaChartLine,
  FaBullhorn,
} from "react-icons/fa";
import HostBookings from "./HostBooking";
import HostReviews from "./HostReviews";
import HostPlaces from "./HostPlaces";
import VoucherList from "./VoucherList";
import VoucherFormPage from "../pages/VoucherFormPage";
import HostAnalytics from "./HostAnalytics";
import HostAnnouncements from "./HostAnnouncements";
import AnnouncementForm from "../pages/AnnouncementForm";
import "./Index.css";


function HostDashboard() {
  const location = useLocation();
  const [transitionClass, setTransitionClass] = useState(
    "opacity-0 translate-y-4"
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    totalBookings: 0,
    activePlaces: 0,
    averageRating: 0,
    activeVouchers: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    setTransitionClass("opacity-100 translate-y-0");
    setIsMobileMenuOpen(false);
  }, [location]);

  // Fetch dashboard statistics
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const [bookingsRes, placesRes, reviewsRes, vouchersRes] =
          await Promise.all([
            axios.get("/host/bookings"),
            axios.get("/host/places"),
            axios.get("/host/reviews"),
            axios.get("/host/vouchers"),
          ]);
        const totalBookings = bookingsRes.data.totalItems || 0;
        // Calculate average rating
        const ratings = reviewsRes.data.map((review) => review.rating);
        const averageRating =
          ratings.length > 0
            ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
            : 0;

        // Count active vouchers
        const activeVouchers = vouchersRes.data.filter((voucher) => {
          const expirationDate = new Date(voucher.expirationDate);
          return expirationDate > new Date();
        }).length;

        setDashboardStats({
          totalBookings,
          activePlaces: placesRes.data.length,
          averageRating,
          activeVouchers,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        setDashboardStats((prev) => ({
          ...prev,
          loading: false,
          error: "Failed to load dashboard statistics",
        }));
      }
    };

    fetchDashboardStats();
  }, []);

  const tabs = [
    {
      path: "/host/places",
      label: "Manage Places",
      icon: FaHome,
      description: "Add and edit your properties",
    },
    {
      path: "/host/bookings",
      label: "Bookings",
      icon: FaCalendar,
      description: "Manage your property bookings",
    },

    {
      path: "/host/vouchers",
      label: "Vouchers",
      icon: FaTicketAlt,
      description: "Create and manage discount vouchers",
    },
    {
      path: "/host/reviews",
      label: "Reviews",
      icon: FaStar,
      description: "View and respond to guest reviews",
    },
    {
      path: "/host/analytics",
      label: "Analytics",
      icon: FaChartLine,
      description: "View your revenue and booking analytics",
    },
    {
      path: "/host/announcements",
      label: "Announcements",
      icon: FaBullhorn,
      description: "Share your performance metrics",
    },
  ];

  const currentPath = location.pathname;
  const currentTab = tabs.find((tab) => tab.path === currentPath) || tabs[0];

  const stats = [
    {
      label: "Total Bookings",
      value: dashboardStats.totalBookings,
      icon: FaCalendar,
      color: "blue",
    },
    {
      label: "Active Places",
      value: dashboardStats.activePlaces,
      icon: FaHome,
      color: "green",
    },
    {
      label: "Average Rating",
      value: dashboardStats.averageRating,
      icon: FaStar,
      color: "yellow",
      suffix: "★",
    },
    {
      label: "Active Vouchers",
      value: dashboardStats.activeVouchers,
      icon: FaTicketAlt,
      color: "purple",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-800">
                Host Dashboard
              </h2>
              <p className="mt-2 text-gray-600">{currentTab.description}</p>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden rounded-lg p-2 hover:bg-gray-100"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={
                    isMobileMenuOpen
                      ? "M6 18L18 6M6 6l12 12"
                      : "M4 6h16M4 12h16M4 18h16"
                  }
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div
          className={`bg-white rounded-xl shadow-sm p-2 transition-all duration-300 ${
            isMobileMenuOpen ? "block" : "hidden md:block"
          }`}
        >
          <nav className="flex flex-col md:flex-row md:space-x-4">
            {tabs.map((tab) => (
              <Link
                key={tab.path}
                to={tab.path}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 
                  ${
                    currentPath === tab.path
                      ? "bg-primary text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-300"
                  }
                  ${isMobileMenuOpen ? "mb-2 md:mb-0" : ""}`}
              >
                <tab.icon
                  className={`text-xl ${
                    currentPath === tab.path ? "text-white" : "text-primary"
                  }`}
                />
                <span className="font-medium">{tab.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          {dashboardStats.loading ? (
            // Loading skeleton for stats
            [...Array(4)].map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm p-6 animate-pulse"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-6 bg-gray-200 rounded w-12"></div>
                  </div>
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                </div>
              </div>
            ))
          ) : dashboardStats.error ? (
            <div className="col-span-4">
              <div className="bg-red-50 p-4 rounded-lg text-red-700">
                {dashboardStats.error}
              </div>
            </div>
          ) : (
            stats.map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">
                      {stat.value}
                      {stat.suffix}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full bg-${stat.color}-100`}>
                    <stat.icon className={`text-xl text-${stat.color}-500`} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Content Section */}
        <div
          className={`mt-8 transition-all transform duration-500 ease-out ${transitionClass}`}
        >
          <div className="bg-white rounded-xl shadow-sm">
            <Routes>
              <Route path="/" element={<HostBookings />} />
              <Route path="bookings" element={<HostBookings />} />
              <Route path="reviews" element={<HostReviews />} />
              <Route path="places" element={<HostPlaces />} />
              <Route path="vouchers" element={<VoucherList />} />
              <Route path="vouchers/new" element={<VoucherFormPage />} />
              <Route path="vouchers/  :id" element={<VoucherFormPage />} />
              <Route path="analytics" element={<HostAnalytics />} />
              <Route path="announcements" element={<HostAnnouncements />} />
              <Route path="announcements/new" element={<AnnouncementForm />} />

              <Route
                path="*"
                element={
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-lg">Page not found</div>
                    <p className="text-gray-500 mt-2">
                      Please select a valid tab above.
                    </p>
                  </div>
                }
              />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HostDashboard;
