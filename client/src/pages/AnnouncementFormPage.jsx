import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { FaChartLine } from "react-icons/fa";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addHours,
} from "date-fns";

export default function AnnouncementFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Initialize dates with current week's Monday and Sunday
  const getInitialDates = () => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // 1 represents Monday
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

    return {
      startDate: weekStart.toISOString().split("T")[0],
      endDate: weekEnd.toISOString().split("T")[0],
    };
  };

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "regular",
    period: getInitialDates(),
    metrics: {
      totalBookings: 0,
      totalRevenue: 0,
      completedBookings: 0,
      cancelledBookings: 0,
    },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [metrics, setMetrics] = useState(null);
  const [periodType, setPeriodType] = useState("week"); // 'week' or 'month'

  // Update dates based on period type
  const updatePeriodDates = useCallback((type) => {
    const today = new Date();
    let start, end;

    if (type === "week") {
      start = startOfWeek(today, { weekStartsOn: 1 });
      end = endOfWeek(today, { weekStartsOn: 1 });
    } else {
      start = startOfMonth(today);
      end = endOfMonth(today);
    }

    setFormData((prev) => ({
      ...prev,
      period: {
        startDate: start.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0],
      },
    }));
  }, []);

  // Handle period type change
  const handlePeriodTypeChange = (e) => {
    const newPeriodType = e.target.value;
    setPeriodType(newPeriodType);
    updatePeriodDates(newPeriodType);
    fetchMetrics();
  };

  // Fetch metrics for the selected period
  const fetchMetrics = useCallback(async () => {
    try {
      const response = await axios.get("/api/host/metrics", {
        params: {
          startDate: formData.period.startDate,
          endDate: formData.period.endDate,
        },
      });

      setMetrics(response.data);
      setFormData((prev) => ({
        ...prev,
        metrics: response.data,
      }));
    } catch (error) {
      console.error("Error fetching metrics:", error);
      setError("Failed to fetch metrics");
    }
  }, [formData.period.startDate, formData.period.endDate]);

  useEffect(() => {
    if (!id) {
      fetchMetrics();
    }
  }, [id, formData.period.startDate, formData.period.endDate, fetchMetrics]);

  const fetchAnnouncement = useCallback(async () => {
    try {
      const response = await axios.get(`/api/host/announcements/${id}`);
      setFormData(response.data);
      // Set period type based on date range
      const startDate = new Date(response.data.period.startDate);
      const endDate = new Date(response.data.period.endDate);
      const diffDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
      setPeriodType(diffDays <= 7 ? "week" : "month");
    } catch {
      setError("Failed to fetch announcement");
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchAnnouncement();
    }
  }, [id, fetchAnnouncement]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const autoConfirmTime = addHours(new Date(formData.period.endDate), 12);
      const submitData = {
        ...formData,
        autoConfirmAt: autoConfirmTime.toISOString(),
      };

      if (id) {
        await axios.put(`/api/host/announcements/${id}`, submitData);
      } else {
        await axios.post("/api/host/announcements", submitData);
      }
      navigate("/host/announcements");
    } catch (err) {
      if (err.response?.status === 403) {
        setError(
          "Announcements can only be created on Sundays or the 1st of each month"
        );
      } else if (err.response?.status === 400) {
        setError(err.response.data.error);
      } else {
        setError(err.response?.data?.message || "Failed to save announcement");
      }
    } finally {
      setLoading(false);
    }
  };

  const canCreateAnnouncement = () => {
    const today = new Date();
    const isFirstOfMonth = today.getDate() === 1;
    const isSunday = today.getDay() === 0;
    return isFirstOfMonth || isSunday;
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">
        {id ? "Edit Announcement" : "Create New Announcement"}
      </h2>

      {!canCreateAnnouncement() && !id && (
        <div className="mb-4 p-4 bg-yellow-50 text-red-700 border border-red-300 font-medium rounded-lg">
          Note: Announcements can only be created on Sundays or the 1st of each
          month
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 border border-red-300 font-medium rounded-lg">
          {error}
        </div>
      )}

      {/* Metrics Display Section */}
      {!id && metrics && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <FaChartLine className="mr-2" />
            Performance Metrics for Selected Period
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Total Bookings</p>
              <p className="text-lg font-semibold text-blue-600">
                {metrics.totalBookings}
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-lg font-semibold text-green-600">
                ${metrics.totalRevenue?.toLocaleString()}
              </p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-lg font-semibold text-purple-600">
                {metrics.completedBookings}
              </p>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Cancelled</p>
              <p className="text-lg font-semibold text-red-600">
                {metrics.cancelledBookings}
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Period Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Period Type
          </label>
          <select
            value={periodType}
            onChange={handlePeriodTypeChange}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="week">Weekly Report</option>
            <option value="month">Monthly Report</option>
          </select>
        </div>

        {/* Period Display (Read-only) */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={formData.period.startDate}
              className="w-full p-2 border rounded-lg bg-gray-50"
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={formData.period.endDate}
              className="w-full p-2 border rounded-lg bg-gray-50"
              disabled
            />
          </div>
        </div>

        {/* Rest of the form fields */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content
          </label>
          <textarea
            value={formData.content}
            onChange={(e) =>
              setFormData({ ...formData, content: e.target.value })
            }
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 h-32"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="regular">Regular</option>
            <option value="important">Important</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate("/host/announcements")}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || (!id && !canCreateAnnouncement())}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? "Saving..." : "Save Announcement"}
          </button>
        </div>
      </form>
    </div>
  );
}
