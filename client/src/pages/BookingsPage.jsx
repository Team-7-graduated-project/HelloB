import { useEffect, useState, useCallback, useMemo } from "react";
import AccountNav from "../AccountNav";
import axios from "axios";
import PlaceImg from "../PlaceImg";
import { Link, useLocation } from "react-router-dom";
import BookingDates from "../BookingDates";
import {
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaCheckCircle,
} from "react-icons/fa";

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const isHistoryPage = location.pathname.includes("/history");

  const checkBookingStatus = useCallback((booking) => {
    if (!booking?.check_out || !booking?.status) {
      return booking?.status || "pending";
    }

    const now = new Date();
    const checkOutDate = new Date(booking.check_out);
    now.setHours(0, 0, 0, 0);
    checkOutDate.setHours(0, 0, 0, 0);

    if (
      now.getTime() > checkOutDate.getTime() &&
      booking.status === "confirmed" &&
      booking.paymentStatus === "paid"
    ) {
      return "completed";
    }
    return booking.status;
  }, []);

  const autoCompleteBooking = useCallback(async (booking) => {
    // Validate booking before attempting auto-completion
    if (
      !booking?._id ||
      booking.isCheckoutProcessed ||
      booking.status !== "completed" ||
      booking.paymentStatus !== "paid"
    ) {
      return booking;
    }

    try {
      const response = await axios.post(`/bookings/${booking._id}/checkout`, {
        status: "completed",
        checkoutDate: new Date().toISOString(),
      });

      if (response.status === 200) {
        return { ...booking, isCheckoutProcessed: true };
      }
      return booking;
    } catch {
      // Silently handle the error and return original booking
      return booking;
    }
  }, []);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data } = await axios.get("/bookings");

      if (!data || !Array.isArray(data)) {
        throw new Error("Invalid response format");
      }

      // Process bookings and check status
      const processedBookings = data
        .filter((booking) => booking && booking.place)
        .map((booking) => ({
          ...booking,
          status: checkBookingStatus(booking),
        }));

      // Handle auto-completion for eligible bookings
      const updatedBookings = await Promise.all(
        processedBookings.map(async (booking) => {
          if (booking.status === "completed" && !booking.isCheckoutProcessed) {
            return await autoCompleteBooking(booking);
          }
          return booking;
        })
      );

      setBookings(updatedBookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setError("Unable to load bookings. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [checkBookingStatus, autoCompleteBooking]);

  // Initial fetch
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Periodic check - reduced frequency
  useEffect(() => {
    const interval = setInterval(() => {
      fetchBookings();
    }, 300000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [fetchBookings]);

  // Updated filter function
  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const isCompleted = booking.status === "completed";
      return isHistoryPage ? isCompleted : !isCompleted;
    });
  }, [bookings, isHistoryPage]);

  // Updated status badge function to include checkout confirmation
  const getStatusBadge = (status) => {
    const statusConfig = {
      confirmed: {
        color: "bg-green-100 text-green-800 border-green-200",
        icon: "✓",
        text: "Confirmed",
      },
      pending: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: "⌛",
        text: "Pending",
      },
      cancelled: {
        color: "bg-red-100 text-red-800 border-red-200",
        icon: "✕",
        text: "Cancelled",
      },
      completed: {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: "★",
        text: "Completed",
      },
    };

    const config = statusConfig[status] || {
      color: "bg-gray-100 text-gray-800 border-gray-200",
      icon: "•",
      text: status,
    };

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.color} shadow-sm`}
      >
        <span className="mr-1">{config.icon}</span>
        {config.text}
        {status === "completed" && (
          <FaCheckCircle className="ml-1 text-blue-600" />
        )}
      </span>
    );
  };

  // Add completion time display for history
  const getCompletionTime = (booking) => {
    if (booking.updatedAt && booking.status === "completed") {
      return new Date(booking.updatedAt).toLocaleDateString();
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <AccountNav />

      {/* Header Section */}
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {isHistoryPage ? "Booking History" : "Current Bookings"}
        </h1>
        <p className="text-gray-600">
          {isHistoryPage
            ? "View your past stays and completed bookings"
            : "Manage and track your upcoming travel plans"}
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-8 px-4 bg-red-50 rounded-lg">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
              fetchBookings();
            }}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Bookings List */}
      <div className="max-w-6xl mx-auto space-y-6">
        {filteredBookings.length > 0 ? (
          filteredBookings.map((booking) => (
            <Link
              to={`/account/bookings/${booking._id}`}
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              key={booking._id}
              className="block bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300"
            >
              <div className="flex flex-col sm:flex-row">
                {/* Image Section - Updated to match IndexPage style */}
                <div className="sm:w-72 h-48 sm:h-auto relative">
                  <div className="relative aspect-[4/3] h-full">
                    <PlaceImg
                      place={booking.place}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

                    {/* Status Badge - Repositioned */}
                    <div className="absolute top-3 right-3">
                      {getStatusBadge(booking.status, booking)}
                    </div>

                    {/* Price Tag */}
                    <div className="absolute bottom-3 left-3 text-white">
                      <div className="flex items-center gap-2 text-sm mb-2 bg-black/40 px-2 py-1 rounded-full">
                        <FaMapMarkerAlt className="text-primary" />
                        <span className="truncate max-w-[200px]">
                          {booking.place.address}
                        </span>
                      </div>
                      <p className="font-bold text-xl shadow-text">
                        ${booking.place.price}
                        <span className="text-sm font-normal"> / night</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-semibold text-gray-800">
                      {booking.place.title}
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center text-gray-600">
                      <FaCalendarAlt className="mr-2 text-primary" />
                      <BookingDates booking={booking} className="text-sm" />
                    </div>

                    {isHistoryPage && booking.status === "completed" && (
                      <div className="flex items-center text-gray-600">
                        <FaClock className="mr-2 text-primary" />
                        <span>Completed on: {getCompletionTime(booking)}</span>
                      </div>
                    )}
                  </div>

                  {/* Add completion details for history page */}
                  {isHistoryPage && booking.status === "completed" && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center text-blue-700">
                        <FaCheckCircle className="mr-2" />
                        <span>Checkout confirmed and completed</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <div className="text-gray-500 mb-4">
              {isHistoryPage
                ? "No completed bookings found"
                : "No current bookings found"}
            </div>
            <Link
              to="/search"
              className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              {isHistoryPage ? "Book New Stay" : "Start Exploring"}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
