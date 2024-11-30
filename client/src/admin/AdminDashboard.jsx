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
import ManageAnnouncementsPage from "./Announcement";

const StatCard = ({ title, value, icon, trend }) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-primary/10 rounded-xl">
          {React.cloneElement(icon, { className: "text-2xl text-primary" })}
        </div>
        {trend && (
          <span
            className={`text-sm font-medium px-2.5 py-1 rounded-full ${
              trend > 0
                ? "bg-green-100 text-green-600"
                : "bg-red-100 text-red-600"
            }`}
          >
            {trend > 0 ? "+" : ""}
            {trend}%
          </span>
        )}
      </div>
      <h3 className="text-gray-600 font-medium mb-2">{title}</h3>
      <div className="text-3xl font-bold text-gray-800">{value}</div>
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
  const [openMenu, setOpenMenu] = useState({
    users: false,
    hosts: false,
    places: false,
    analytics: false,
    reports: false,
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
      const response = await axios.get("/notifications", {
        withCredentials: true,
      });
      setNotifications(response.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4">
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
    <div className={`flex min-h-screen`}>
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg p-6 border-r border-gray-200">
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

          {/* Add Announcements Menu */}
          <div>
            <button
              onClick={() => toggleMenu("announcements")}
              className="p-3 rounded-lg hover:bg-gray-200 mb-2 transition-colors duration-200 text-gray-700 w-full text-left flex justify-between items-center"
            >
              <span className="font-medium flex items-center">
                <FaChartBar className="mr-2" />
                Announcements
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
                  View All
                </NavLink>
              </div>
            )}
          </div>
        </nav>

        {/* Notifications */}
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-8 bg-gray-100">
        {/* Breadcrumb */}
        <nav className="breadcrumb text-gray-700 text-sm mb-4">
          <Link className="font-bold hover:text-gray-900" to="/admin">
            Dashboard
          </Link>{" "}
          /{" "}
          <span className="font-semibold text-gray-800">
            {location.pathname.split("/")[2] || "Overview"}
          </span>
        </nav>

        {/* Outlet */}
        {location.pathname === "/admin" && (
          <div className="bg-gradient-to-r from-blue-500 to-blue-800 py-12 px-6 rounded-lg shadow-lg text-white">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold">Dashboard Overview</h1>
                <p className="mt-2 text-lg opacity-90">
                  Real-time statistics and platform metrics
                </p>
              </div>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative bg-white max-w-60 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Notifications
                {notifications.filter((n) => n.status === "unread").length >
                  0 && (
                  <span className="absolute  -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                    {notifications.filter((n) => n.status === "unread").length}
                  </span>
                )}
              </button>
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
            path="announcements"
            element={
              <ProtectedRoute requiredRole="admin">
                <ManageAnnouncementsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>

      {/* Floating Action Button */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
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
