import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  FaChartLine,
  FaUsers,
  FaHotel,
  FaMoneyBillWave,
  FaSpinner,
} from "react-icons/fa";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";

function Analytics() {
  const [timeFrame, setTimeFrame] = useState("month");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState({
    overview: {
      totalBookings: 0,
      totalRevenue: 0,
      averageBookingValue: 0,
      bookingCompletionRate: 0,
    },
    bookingsByPeriod: [],
    revenueByPeriod: [],
    topPlaces: [],
    topHosts: [],
  });

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `/api/admin/analytics?timeFrame=${timeFrame}`
      );
      setAnalytics(response.data);
    } catch (err) {
      setError("Failed to fetch analytics data");
      console.error("Analytics fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [timeFrame]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-8 mb-8 text-white">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
            <p className="text-white/80">Monitor key metrics and performance indicators</p>
          </div>
          <div className="flex gap-2">
            {['week', 'month', 'year'].map((period) => (
              <button
                key={period}
                onClick={() => setTimeFrame(period)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  timeFrame === period
                    ? "bg-white text-primary"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          {
            title: "Total Bookings",
            value: analytics.overview.totalBookings.toLocaleString(),
            icon: <FaUsers className="text-blue-500" />,
            color: "blue",
            subtitle: "Period total"
          },
          {
            title: "Total Revenue",
            value: `$${analytics.overview.totalRevenue.toLocaleString()}`,
            icon: <FaMoneyBillWave className="text-green-500" />,
            color: "green",
            subtitle: "Period earnings"
          },
          {
            title: "Avg. Booking Value",
            value: `$${Math.round(analytics.overview.averageBookingValue).toLocaleString()}`,
            icon: <FaHotel className="text-purple-500" />,
            color: "purple",
            subtitle: "Per booking"
          },
          {
            title: "Completion Rate",
            value: `${Math.round(analytics.overview.bookingCompletionRate)}%`,
            icon: <FaChartLine className="text-blue-500" />,
            color: "blue",
            subtitle: "Successfully completed"
          },
        ].map((stat) => (
          <div key={stat.title} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500">{stat.title}</h3>
              {stat.icon}
            </div>
            <p className={`text-2xl font-bold text-${stat.color}-600`}>
              {stat.value}
            </p>
            <p className="text-sm text-gray-500 mt-1">{stat.subtitle}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Bookings Trend */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Bookings Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.bookingsByPeriod}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="bookings"
                  stroke="#3B82F6"
                  name="Bookings"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Trend */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.revenueByPeriod}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#10B981" name="Revenue ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Places */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Top Performing Places</h3>
          <div className="space-y-4">
            {analytics.topPlaces.map((place) => (
              <div
                key={place._id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded"
              >
                <div>
                  <p className="font-medium">{place.title}</p>
                  <p className="text-sm text-gray-500">
                    {place.bookings} bookings
                  </p>
                </div>
                <p className="text-green-600 font-semibold">
                  ${place.revenue.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Top Hosts */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Top Performing Hosts</h3>
          <div className="space-y-4">
            {analytics.topHosts.map((host) => (
              <div
                key={host._id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded"
              >
                <div>
                  <p className="font-medium">{host.name}</p>
                  <p className="text-sm text-gray-500">
                    {host.totalPlaces} places
                  </p>
                </div>
                <p className="text-green-600 font-semibold">
                  ${host.revenue.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
