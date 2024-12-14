import { useState, useEffect } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { FaDollarSign, FaCalendarCheck, FaChartLine } from "react-icons/fa";
import { FaArrowUp } from "react-icons/fa";

function HostAnalytics() {
  const [timeFrame, setTimeFrame] = useState("month");
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `/host/analytics?timeFrame=${timeFrame}`
        );
        setAnalytics(response.data);
        setError(null);
      } catch (err) {
        setError("Failed to load analytics data");
        console.error("Error fetching analytics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeFrame]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse h-64 bg-gray-100 rounded-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Enhanced Header Section */}
      <div className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-8 mb-8 text-white">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Revenue Analytics</h1>
            <p className="text-white/80">
              Track your business performance and metrics
            </p>
          </div>
          <div className="flex gap-2">
            {['week', 'month', 'year'].map((period) => (
              <button
                key={period}
                onClick={() => setTimeFrame(period)}
                className={`px-4 py-2 rounded-xl transition-all duration-200 ${
                  timeFrame === period
                    ? 'bg-white text-primary'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-500 text-sm font-medium">Total Revenue</h3>
            <FaDollarSign className="text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            ${analytics.reduce((sum, item) => sum + item.revenue, 0).toLocaleString()}
          </p>
          <div className="mt-2 text-sm text-green-600">
            <FaArrowUp className="inline mr-1" />
            <span>12% from last {timeFrame}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-500 text-sm font-medium">Total Bookings</h3>
            <FaCalendarCheck className="text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {analytics.reduce((sum, item) => sum + item.bookings, 0)}
          </p>
          <div className="mt-2 text-sm text-blue-600">
            <FaArrowUp className="inline mr-1" />
            <span>8% from last {timeFrame}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-500 text-sm font-medium">Average Revenue</h3>
            <FaChartLine className="text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            ${(
              analytics.reduce((sum, item) => sum + item.revenue, 0) /
              analytics.reduce((sum, item) => sum + item.bookings, 0)
            ).toFixed(2)}
          </p>
          <div className="mt-2 text-sm text-purple-600">
            <FaArrowUp className="inline mr-1" />
            <span>5% from last {timeFrame}</span>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold mb-6">Revenue Overview</h2>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analytics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                tick={{ fill: '#6b7280' }}
              />
              <YAxis 
                stroke="#6b7280"
                tick={{ fill: '#6b7280' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#8884d8"
                strokeWidth={2}
                dot={{ fill: '#8884d8' }}
                name="Revenue"
              />
              <Line
                type="monotone"
                dataKey="bookings"
                stroke="#82ca9d"
                strokeWidth={2}
                dot={{ fill: '#82ca9d' }}
                name="Bookings"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default HostAnalytics;
