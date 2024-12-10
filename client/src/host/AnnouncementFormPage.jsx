import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaSpinner } from "react-icons/fa";

export default function AnnouncementFormPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [revenueData, setRevenueData] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    includeRevenue: false,
    period: "week", // or "month"
  });
  const [formErrors, setFormErrors] = useState({});

  // Fetch revenue data
  useEffect(() => {
    const fetchRevenueData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `/api/host/metrics?period=${formData.period}`
        );

        // Debug log to see what we're receiving
        console.log("Metrics response:", response.data);

        if (response.data) {
          // Safely parse dates with better error handling
          const parsePeriodDate = (dateStr) => {
            try {
              // If dateStr is undefined or null, use current date
              if (!dateStr) {
                console.warn("Missing date string, using current date");
                return new Date().toISOString();
              }

              // Handle different date formats
              let date;
              if (typeof dateStr === "number") {
                // Handle timestamp
                date = new Date(dateStr);
              } else if (typeof dateStr === "string") {
                // Try parsing the string directly
                date = new Date(dateStr);
              } else {
                throw new Error(`Unexpected date format: ${typeof dateStr}`);
              }

              if (isNaN(date.getTime())) {
                throw new Error(`Invalid date value: ${dateStr}`);
              }

              return date.toISOString();
            } catch (err) {
              console.error("Date parsing error:", err, "for value:", dateStr);
              // Return current date as fallback
              return new Date().toISOString();
            }
          };

          // Format dates properly when receiving the data
          const formattedData = {
            ...response.data,
            periodStart: parsePeriodDate(response.data.periodStart),
            periodEnd: parsePeriodDate(response.data.periodEnd),
            totalRevenue: Number(response.data.totalRevenue || 0).toFixed(2),
            totalBookings: Number(response.data.totalBookings || 0),
            completedBookings: Number(response.data.completedBookings || 0),
            cancelledBookings: Number(response.data.cancelledBookings || 0),
          };

          // Debug log the formatted data
          console.log("Formatted data:", formattedData);

          setRevenueData(formattedData);
        }
      } catch (error) {
        console.error("Error fetching revenue:", error);
        setError(
          "Failed to fetch revenue data: " +
            (error.response?.data?.message || error.message)
        );
      } finally {
        setLoading(false);
      }
    };

    if (formData.includeRevenue) {
      fetchRevenueData();
    }
  }, [formData.period, formData.includeRevenue]);

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) {
      errors.title = "Title is required";
    }
    if (!formData.content.trim()) {
      errors.content = "Content is required";
    } else if (formData.content.length < 10) {
      errors.content = "Content must be at least 10 characters long";
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    setFormErrors(errors);

    if (Object.keys(errors).length === 0) {
      setLoading(true);
      try {
        const requestData = {
          title: formData.title,
          content: formData.content,
          includeRevenue: formData.includeRevenue,
        };

        // Add revenue data if included
        if (formData.includeRevenue && revenueData) {
          // Debug log the revenue data we're about to send
          console.log("Revenue data before sending:", revenueData);

          requestData.period = formData.period;
          requestData.revenueData = {
            period: formData.period,
            totalBookings: Number(revenueData.totalBookings) || 0,
            totalRevenue: Number(revenueData.totalRevenue) || 0,
            completedBookings: Number(revenueData.completedBookings) || 0,
            cancelledBookings: Number(revenueData.cancelledBookings) || 0,
            periodStart: revenueData.periodStart,
            periodEnd: revenueData.periodEnd,
          };

          // Validate the data before sending
          if (
            !requestData.revenueData.periodStart ||
            !requestData.revenueData.periodEnd
          ) {
            console.error("Invalid dates:", {
              start: requestData.revenueData.periodStart,
              end: requestData.revenueData.periodEnd,
            });
            throw new Error("Invalid date format in revenue data");
          }

          // Debug log the final request data
          console.log("Final request data:", requestData);
        }

        const response = await axios.post(
          "/api/host/announcements",
          requestData
        );

        if (response.data.success) {
          navigate("/host/announcements");
        } else {
          throw new Error(
            response.data.error || "Failed to create announcement"
          );
        }
      } catch (error) {
        console.error("Error creating announcement:", error);
        setError(
          error.response?.data?.details ||
            error.response?.data?.error ||
            error.message ||
            "Failed to create announcement"
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }

    // Reset revenue data when period changes
    if (name === "period") {
      setRevenueData(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-2"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
            clipRule="evenodd"
          />
        </svg>
        Back
      </button>

      <h1 className="text-2xl font-bold mb-6">Create New Announcement</h1>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-gray-700 font-semibold mb-2">
            Title
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className={`w-full p-2 border rounded-lg transition-all duration-200
              ${formErrors.title ? "border-red-500" : "border-gray-300"}`}
            placeholder="Enter announcement title"
          />
          {formErrors.title && (
            <p className="mt-1 text-sm text-red-500">{formErrors.title}</p>
          )}
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-2">
            Content
            <span className="text-red-500 ml-1">*</span>
          </label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            rows={6}
            className={`w-full p-2 border rounded-lg transition-all duration-200
              ${formErrors.content ? "border-red-500" : "border-gray-300"}`}
            placeholder="Enter announcement content"
          />
          {formErrors.content && (
            <p className="mt-1 text-sm text-red-500">{formErrors.content}</p>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              name="includeRevenue"
              checked={formData.includeRevenue}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 rounded border-gray-300"
            />
            <label className="ml-2 block text-gray-700">
              Include Revenue Report
            </label>
          </div>

          {formData.includeRevenue && (
            <div className="ml-6">
              <select
                name="period"
                value={formData.period}
                onChange={handleInputChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
              </select>

              {revenueData && (
                <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm space-y-1">
                  <p className="font-medium">Preview:</p>
                  <p>
                    Period:{" "}
                    {(() => {
                      try {
                        return `${new Date(
                          revenueData.periodStart
                        ).toLocaleDateString()} - ${new Date(
                          revenueData.periodEnd
                        ).toLocaleDateString()}`;
                      } catch {
                        return "Invalid date range";
                      }
                    })()}
                  </p>
                  <p>Total Bookings: {revenueData.totalBookings || 0}</p>
                  <p>
                    Completed Bookings: {revenueData.completedBookings || 0}
                  </p>
                  <p className="font-medium text-green-600">
                    Total Revenue: ${revenueData.totalRevenue || "0.00"}
                  </p>
                  {(revenueData.cancelledBookings || 0) > 0 && (
                    <p className="text-red-500">
                      Cancelled Bookings: {revenueData.cancelledBookings}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 px-6 rounded-lg
            transition-all duration-200
            ${loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}
            text-white font-semibold`}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <FaSpinner className="animate-spin mr-2" />
              Creating...
            </div>
          ) : (
            "Create Announcement"
          )}
        </button>
      </form>
    </div>
  );
}
