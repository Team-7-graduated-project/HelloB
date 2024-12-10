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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Revenue Analytics</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setTimeFrame("week")}
            className={`px-4 py-2 rounded-lg ${
              timeFrame === "week"
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setTimeFrame("month")}
            className={`px-4 py-2 rounded-lg ${
              timeFrame === "month"
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setTimeFrame("year")}
            className={`px-4 py-2 rounded-lg ${
              timeFrame === "year"
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            Year
          </button>
        </div>
      </div>

      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={analytics}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#8884d8"
              name="Revenue"
            />
            <Line
              type="monotone"
              dataKey="bookings"
              stroke="#82ca9d"
              name="Bookings"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-gray-500 text-sm">Total Revenue</h3>
          <p className="text-2xl font-bold">
            ${analytics.reduce((sum, item) => sum + item.revenue, 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-gray-500 text-sm">Total Bookings</h3>
          <p className="text-2xl font-bold">
            {analytics.reduce((sum, item) => sum + item.bookings, 0)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-gray-500 text-sm">Average Revenue per Booking</h3>
          <p className="text-2xl font-bold">
            $
            {(
              analytics.reduce((sum, item) => sum + item.revenue, 0) /
              analytics.reduce((sum, item) => sum + item.bookings, 0)
            ).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default HostAnalytics;