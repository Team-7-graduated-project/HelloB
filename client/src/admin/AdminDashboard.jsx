import React from "react";
import { useState, useEffect } from "react";
import axios from "axios";
import { format } from "date-fns";
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import {
  FaUser,
  FaHotel,
  FaMapMarkerAlt,
  FaChartLine,
  FaTimesCircle,
  FaBell,
  FaFlag,
  FaChartBar,
  FaBullhorn,
} from "react-icons/fa";
import { IoIosArrowForward, IoIosArrowDown } from "react-icons/io";
import "./AdminDashboard.css";
import ProtectedRoute from "../ProtectedRoute";
import ManagePlacesPage from "./Places";
import ManageHostsPage from "./Host";
import ManageUsersPage from "./User";
import Analytics from "./Analytics";
import PropTypes from "prop-types";
import ManageReportsPage from "./Report";
import ManageBlogPage from "./Blog";
import Announcement from "./Announcement";
import axiosInstance from "../axiosConfig";


const StatCard = ({ title, value, icon, trend }) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-primary/10 rounded-xl">
          {React.cloneElement(icon, { className: "text-2xl text-primary" })}
        </div>
        {trend && (
          <span className={`text-sm font-medium px-3 py-1 rounded-full ${
            trend > 0 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
          }`}>
            {trend > 0 ? "+" : ""}{trend}%
          </span>
        )}
      </div>
      <h3 className="text-gray-600 text-sm font-medium mb-2">{title}</h3>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
    </div>
  );
};

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.element.isRequired,
  trend: PropTypes.number,
};

function AdminDashboard() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState({
    users: false,
    hosts: false,
    places: false,
    analytics: false,
    reports: false,
    blog: false,
    announcements: false,
  });

  const [notifications, setNotifications] = useState([]);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(true);

  const location = useLocation();

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalHosts: 0,
    totalPlaces: 0,
    totalBookings: 0,
    totalPayments: 0,
    recentActivity: [],
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoading(true);

      const response = await axios.get("/api/admin/stats", {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      });

      setStats({
        totalUsers: response.data.totalUsers || 0,
        totalHosts: response.data.totalHosts || 0,
        totalPlaces: response.data.totalPlaces || 0,
        totalBookings: response.data.totalBookings || 0,
        totalPayments: response.data.totalPayments || 0,
        recentActivity: response.data.recentActivity || [],
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];

    if (!token) {
      return;
    }

    fetchStats();
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsNotificationsLoading(true);
      const response = await axiosInstance.get("/notifications", {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setNotifications(response.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      // Don't show error to user unless necessary
    } finally {
      setIsNotificationsLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(
        `/notifications/${id}/read`,
        {},
        {
          withCredentials: true,
        }
      );
      fetchNotifications(); // Refresh notifications
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const toggleMenu = (menu) => {
    setOpenMenu((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));
  };

  const renderStats = () => {
    if (isLoading) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading statistics...</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={<FaUser />}
        />
        <StatCard
          title="Total Hosts"
          value={stats.totalHosts}
          icon={<FaUser />}
        />
        <StatCard
          title="Total Places"
          value={stats.totalPlaces}
          icon={<FaHotel />}
        />
        <StatCard
          title="Total Bookings"
          value={stats.totalBookings}
          icon={<FaMapMarkerAlt />}
        />
        <StatCard
          title="Total Revenue"
          value={`$${stats.totalPayments.toLocaleString()}`}
          icon={<FaChartLine />}
        />
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Mobile Header */}
      <div className="md:hidden bg-white p-4 flex  justify-between items-center shadow-md">
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-gray-600 hover:text-gray-900"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-lg  font-semibold">Admin Dashboard</span>
        <button 
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative max-w-9  text-gray-600 hover:text-gray-900"
        >
          <FaBell className="w-6 h-6 " />
          {notifications.filter(n => n.status === "unread").length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
              {notifications.filter(n => n.status === "unread").length}
            </span>
          )}
        </button>
      </div>

      {/* Sidebar - Hidden on mobile */}
      <aside className="hidden md:block md:w-64 bg-white shadow-lg p-4 md:p-6 border-r border-gray-200">
        <Link to="/admin" className="text-2xl font-semibold mb-6 text-gray-800">
          Admin Dashboard
        </Link>

        <nav className="flex flex-col space-y-6">
          <div>
            <button
              onClick={() => toggleMenu("analytics")}
              className="p-3 rounded-lg hover:bg-gray-200 mb-2 transition-colors duration-200 text-gray-700 w-full text-left flex justify-between items-center"
            >
              <span className="font-medium flex items-center">
                <FaChartLine className="mr-2" /> Analytics & Reports
              </span>
              {openMenu.analytics ? (
                <IoIosArrowDown className="text-gray-600" />
              ) : (
                <IoIosArrowForward className="text-gray-600" />
              )}
            </button>
            {openMenu.analytics && (
              <div className="ml-6 flex flex-col space-y-2">
                <NavLink
                  to="analytics/overview"
                  className={({ isActive }) =>
                    `p-3 rounded-lg hover:bg-gray-200 transition-colors duration-200 ${
                      isActive ? "bg-gray-300" : ""
                    }`
                  }
                >
                  Overview
                </NavLink>
              </div>
            )}
          </div>
          {/* Manage Users */}
          <div>
            <button
              onClick={() => toggleMenu("users")}
              className="p-3 rounded-lg mb-2  hover:bg-gray-200 transition-colors duration-200 text-gray-700 w-full text-left flex justify-between items-center"
            >
              <span className="font-medium flex items-center">
                <FaUser className="mr-2" /> Manage Users
              </span>
              {openMenu.users ? (
                <IoIosArrowDown className="text-gray-600" />
              ) : (
                <IoIosArrowForward className="text-gray-600" />
              )}
            </button>
            {openMenu.users && (
              <div className="ml-6 flex flex-col space-y-2">
                <NavLink
                  to="users"
                  className={({ isActive }) =>
                    `p-3 rounded-lg hover:bg-gray-200 transition-colors duration-200 ${
                      isActive ? "bg-gray-300" : ""
                    }`
                  }
                >
                  List Users
                </NavLink>
              </div>
            )}
          </div>

          {/* Manage Hosts */}
          <div>
            <button
              onClick={() => toggleMenu("hosts")}
              className="p-3 mb-2 rounded-lg hover:bg-gray-200 transition-colors duration-200 text-gray-700 w-full text-left flex justify-between items-center"
            >
              <span className="font-medium flex items-center">
                <FaHotel className="mr-2" /> Manage Hosts
              </span>
              {openMenu.hosts ? (
                <IoIosArrowDown className="text-gray-600" />
              ) : (
                <IoIosArrowForward className="text-gray-600" />
              )}
            </button>
            {openMenu.hosts && (
              <div className="ml-6 flex flex-col space-y-2">
                <NavLink
                  to="hosts"
                  className={({ isActive }) =>
                    `p-3 rounded-lg hover:bg-gray-200 transition-colors duration-200 ${
                      isActive ? "bg-gray-300" : ""
                    }`
                  }
                >
                  List Hosts
                </NavLink>
              </div>
            )}
          </div>

          {/* Manage Places */}
          <div>
            <button
              onClick={() => toggleMenu("places")}
              className="p-3 rounded-lg hover:bg-gray-200 mb-2 transition-colors duration-200 text-gray-700 w-full text-left flex justify-between items-center"
            >
              <span className="font-medium flex items-center">
                <FaMapMarkerAlt className="mr-2" /> Manage Places
              </span>
              {openMenu.places ? (
                <IoIosArrowDown className="text-gray-600" />
              ) : (
                <IoIosArrowForward className="text-gray-600" />
              )}
            </button>
            {openMenu.places && (
              <div className="ml-6 flex flex-col space-y-2">
                <NavLink
                  to="places"
                  className={({ isActive }) =>
                    `p-3 rounded-lg hover:bg-gray-200 transition-colors duration-200 ${
                      isActive ? "bg-gray-300" : ""
                    }`
                  }
                >
                  List Places
                </NavLink>
              </div>
            )}
          </div>

          {/* Manage Reports */}
          <div>
            <button
              onClick={() => toggleMenu("reports")}
              className="p-3 rounded-lg hover:bg-gray-200 mb-2 transition-colors duration-200 text-gray-700 w-full text-left flex justify-between items-center"
            >
              <span className="font-medium flex items-center">
                <FaFlag className="mr-2" /> Manage Reports
              </span>
              {openMenu.reports ? (
                <IoIosArrowDown className="text-gray-600" />
              ) : (
                <IoIosArrowForward className="text-gray-600" />
              )}
            </button>
            {openMenu.reports && (
              <div className="ml-6 flex flex-col space-y-2">
                <NavLink
                  to="reports"
                  className={({ isActive }) =>
                    `p-3 rounded-lg hover:bg-gray-200 transition-colors duration-200 ${
                      isActive ? "bg-gray-300" : ""
                    }`
                  }
                >
                  List Reports
                </NavLink>
              </div>
            )}
          </div>

          {/* Manage Blog Posts */}
          <div>
            <button
              onClick={() => toggleMenu("blog")}
              className="p-3 rounded-lg hover:bg-gray-200 mb-2 transition-colors duration-200 text-gray-700 w-full text-left flex justify-between items-center"
            >
              <span className="font-medium flex items-center">
                <FaChartBar className="mr-2" /> Manage Blog
              </span>
              {openMenu.blog ? (
                <IoIosArrowDown className="text-gray-600" />
              ) : (
                <IoIosArrowForward className="text-gray-600" />
              )}
            </button>
            {openMenu.blog && (
              <div className="ml-6 flex flex-col space-y-2">
                <NavLink
                  to="blog"
                  className={({ isActive }) =>
                    `p-3 rounded-lg hover:bg-gray-200 transition-colors duration-200 ${
                      isActive ? "bg-gray-300" : ""
                    }`
                  }
                >
                  Manage Posts
                </NavLink>
              </div>
            )}
          </div>

          {/* Manage Announcements */}
          <div>
            <button
              onClick={() => toggleMenu("announcements")}
              className="p-3 rounded-lg hover:bg-gray-200 mb-2 transition-colors duration-200 text-gray-700 w-full text-left flex justify-between items-center"
            >
              <span className="font-medium flex items-center">
                <FaBullhorn className="mr-2" /> Manage Announcements
              </span>
              {openMenu.announcements ? (
                <IoIosArrowDown className="text-gray-600" />
              ) : (
                <IoIosArrowForward className="text-gray-600" />
              )}
            </button>
            {openMenu.announcements && (
              <div className="ml-6 flex flex-col space-y-2">
                <NavLink
                  to="announcements"
                  className={({ isActive }) =>
                    `p-3 rounded-lg hover:bg-gray-200 transition-colors duration-200 ${
                      isActive ? "bg-gray-300" : ""
                    }`
                  }
                >
                  View Announcements
                </NavLink>
              </div>
            )}
          </div>

       </nav>
        {/* Notifications */}
      </aside>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden">
          <div className="bg-white w-64 h-full overflow-y-auto p-4">
            <div className="flex justify-between items-center mb-6">
              <Link to="/admin" className="text-xl font-semibold text-gray-800">
                Admin Dashboard
              </Link>
              <button className="max-w-9" onClick={() => setMobileMenuOpen(false)}>
                <FaTimesCircle className="w-6 h-6  text-gray-600" />
              </button>
            </div>
            <nav className="flex flex-col space-y-6">
              <div>
                <button
                  onClick={() => toggleMenu("analytics")}
                  className="p-3 rounded-lg hover:bg-gray-200 mb-2 transition-colors duration-200 text-gray-700 w-full text-left flex justify-between items-center"
                >
                  <span className="font-medium flex items-center">
                    <FaChartLine className="mr-2" /> Analytics & Reports
                  </span>
                  {openMenu.analytics ? (
                    <IoIosArrowDown className="text-gray-600" />
                  ) : (
                    <IoIosArrowForward className="text-gray-600" />
                  )}
                </button>
                {openMenu.analytics && (
                  <div className="ml-6 flex flex-col space-y-2">
                    <NavLink
                      to="analytics/overview"
                      className={({ isActive }) =>
                        `p-3 rounded-lg hover:bg-gray-200 transition-colors duration-200 ${
                          isActive ? "bg-gray-300" : ""
                        }`
                      }
                    >
                      Overview
                    </NavLink>
                  </div>
                )}
              </div>
              {/* Manage Users */}
              <div>
                <button
                  onClick={() => toggleMenu("users")}
                  className="p-3 rounded-lg mb-2  hover:bg-gray-200 transition-colors duration-200 text-gray-700 w-full text-left flex justify-between items-center"
                >
                  <span className="font-medium flex items-center">
                    <FaUser className="mr-2" /> Manage Users
                  </span>
                  {openMenu.users ? (
                    <IoIosArrowDown className="text-gray-600" />
                  ) : (
                    <IoIosArrowForward className="text-gray-600" />
                  )}
                </button>
                {openMenu.users && (
                  <div className="ml-6 flex flex-col space-y-2">
                    <NavLink
                      to="users"
                      className={({ isActive }) =>
                        `p-3 rounded-lg hover:bg-gray-200 transition-colors duration-200 ${
                          isActive ? "bg-gray-300" : ""
                        }`
                      }
                    >
                      List Users
                    </NavLink>
                  </div>
                )}
              </div>

              {/* Manage Hosts */}
              <div>
                <button
                  onClick={() => toggleMenu("hosts")}
                  className="p-3 mb-2 rounded-lg hover:bg-gray-200 transition-colors duration-200 text-gray-700 w-full text-left flex justify-between items-center"
                >
                  <span className="font-medium flex items-center">
                    <FaHotel className="mr-2" /> Manage Hosts
                  </span>
                  {openMenu.hosts ? (
                    <IoIosArrowDown className="text-gray-600" />
                  ) : (
                    <IoIosArrowForward className="text-gray-600" />
                  )}
                </button>
                {openMenu.hosts && (
                  <div className="ml-6 flex flex-col space-y-2">
                    <NavLink
                      to="hosts"
                      className={({ isActive }) =>
                        `p-3 rounded-lg hover:bg-gray-200 transition-colors duration-200 ${
                          isActive ? "bg-gray-300" : ""
                        }`
                      }
                    >
                      List Hosts
                    </NavLink>
                  </div>
                )}
              </div>

              {/* Manage Places */}
              <div>
                <button
                  onClick={() => toggleMenu("places")}
                  className="p-3 rounded-lg hover:bg-gray-200 mb-2 transition-colors duration-200 text-gray-700 w-full text-left flex justify-between items-center"
                >
                  <span className="font-medium flex items-center">
                    <FaMapMarkerAlt className="mr-2" /> Manage Places
                  </span>
                  {openMenu.places ? (
                    <IoIosArrowDown className="text-gray-600" />
                  ) : (
                    <IoIosArrowForward className="text-gray-600" />
                  )}
                </button>
                {openMenu.places && (
                  <div className="ml-6 flex flex-col space-y-2">
                    <NavLink
                      to="places"
                      className={({ isActive }) =>
                        `p-3 rounded-lg hover:bg-gray-200 transition-colors duration-200 ${
                          isActive ? "bg-gray-300" : ""
                        }`
                      }
                    >
                      List Places
                    </NavLink>
                  </div>
                )}
              </div>

              {/* Manage Reports */}
              <div>
                <button
                  onClick={() => toggleMenu("reports")}
                  className="p-3 rounded-lg hover:bg-gray-200 mb-2 transition-colors duration-200 text-gray-700 w-full text-left flex justify-between items-center"
                >
                  <span className="font-medium flex items-center">
                    <FaFlag className="mr-2" /> Manage Reports
                  </span>
                  {openMenu.reports ? (
                    <IoIosArrowDown className="text-gray-600" />
                  ) : (
                    <IoIosArrowForward className="text-gray-600" />
                  )}
                </button>
                {openMenu.reports && (
                  <div className="ml-6 flex flex-col space-y-2">
                    <NavLink
                      to="reports"
                      className={({ isActive }) =>
                        `p-3 rounded-lg hover:bg-gray-200 transition-colors duration-200 ${
                          isActive ? "bg-gray-300" : ""
                        }`
                      }
                    >
                      List Reports
                    </NavLink>
                  </div>
                )}
              </div>

              {/* Manage Blog Posts */}
              <div>
                <button
                  onClick={() => toggleMenu("blog")}
                  className="p-3 rounded-lg hover:bg-gray-200 mb-2 transition-colors duration-200 text-gray-700 w-full text-left flex justify-between items-center"
                >
                  <span className="font-medium flex items-center">
                    <FaChartBar className="mr-2" /> Manage Blog
                  </span>
                  {openMenu.blog ? (
                    <IoIosArrowDown className="text-gray-600" />
                  ) : (
                    <IoIosArrowForward className="text-gray-600" />
                  )}
                </button>
                {openMenu.blog && (
                  <div className="ml-6 flex flex-col space-y-2">
                    <NavLink
                      to="blog"
                      className={({ isActive }) =>
                        `p-3 rounded-lg hover:bg-gray-200 transition-colors duration-200 ${
                          isActive ? "bg-gray-300" : ""
                        }`
                      }
                    >
                      Manage Posts
                    </NavLink>
                  </div>
                )}
              </div>

              {/* Manage Announcements */}
              <div>
                <button
                  onClick={() => toggleMenu("announcements")}
                  className="p-3 rounded-lg hover:bg-gray-200 mb-2 transition-colors duration-200 text-gray-700 w-full text-left flex justify-between items-center"
                >
                  <span className="font-medium flex items-center">
                    <FaBullhorn className="mr-2" /> Manage Announcements
                  </span>
                  {openMenu.announcements ? (
                    <IoIosArrowDown className="text-gray-600" />
                  ) : (
                    <IoIosArrowForward className="text-gray-600" />
                  )}
                </button>
                {openMenu.announcements && (
                  <div className="ml-6 flex flex-col space-y-2">
                    <NavLink
                      to="announcements"
                      className={({ isActive }) =>
                        `p-3 rounded-lg hover:bg-gray-200 transition-colors duration-200 ${
                          isActive ? "bg-gray-300" : ""
                        }`
                      }
                    >
                      View Announcements
                    </NavLink>
                  </div>
                )}
              </div>

           </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-grow p-4 md:p-8 bg-gray-100">
        {/* Breadcrumb */}
        <nav className="breadcrumb text-gray-700 text-xs md:text-sm mb-4">
          <Link className="font-bold hover:text-gray-900" to="/admin">
            Dashboard
          </Link>{" "}
          /{" "}
          <span className="font-semibold text-gray-800">
            {location.pathname.split("/")[2] || "Overview"}
          </span>
        </nav>

        {/* Dashboard Overview */}
        {location.pathname === "/admin" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-8 text-white">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Dashboard Overview</h1>
                  <p className="text-white/80">Real-time statistics and platform metrics</p>
                </div>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative max-w-40 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-xl hover:bg-white/20 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FaBell />
                    Notifications
                    {notifications.filter(n => n.status === "unread").length > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                        {notifications.filter(n => n.status === "unread").length}
                      </span>
                    )}
                  </div>
                </button>
              </div>
            </div>
            {renderStats()}
          </div>
        )}
        <Routes>
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
            path="analytics/*"
            element={
              <ProtectedRoute requiredRole="admin">
                <Routes>
                  <Route path="overview" element={<Analytics />} />
                </Routes>
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
            path="blog"
            element={
              <ProtectedRoute requiredRole="admin">
                <ManageBlogPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="announcements"
            element={
              <ProtectedRoute requiredRole="admin">
                <Announcement />
              </ProtectedRoute>
            }
          />
        </Routes>

        {/* Admin Footer */}
        <footer className="mt-auto pt-8 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-gray-600">
              <p className="flex items-center gap-2">
                &copy; {new Date().getFullYear()} HelloB Admin Dashboard
              </p>
              <div className="flex items-center gap-4">
                <span>Version 1.0.0</span>
                <span>•</span>
                <Link 
                  to="/admin/support" 
                  className="hover:text-primary transition-colors"
                >
                  Support
                </Link>
                <span>•</span>
                <Link 
                  to="/admin/docs" 
                  className="hover:text-primary transition-colors"
                >
                  Documentation
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </main>

      {/* Notifications Modal */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto m-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl flex items-center font-bold">
                <FaBell />
                Notifications
              </h2>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimesCircle className="text-3xl ml-96" />
              </button>
            </div>
            {isNotificationsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading notifications...</p>
              </div>
            ) : notifications.length > 0 ? (
              <ul className="space-y-4">
                {notifications.map((notification) => (
                  <li
                    key={notification._id}
                    className={`p-4 rounded-lg ${
                      notification.status === "unread"
                        ? "bg-blue-50"
                        : "bg-gray-50"
                    }`}
                  >
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-medium">{notification.title}</h3>
                        <p className="text-gray-600">{notification.message}</p>
                        <span className="text-xs text-gray-500">
                          {format(
                            new Date(notification.createdAt),
                            "MMM d, yyyy HH:mm"
                          )}
                        </span>
                      </div>
                      {notification.status === "unread" && (
                        <button
                          onClick={() => markAsRead(notification._id)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-gray-500">No notifications</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
