import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { FaSpinner, FaFilter, FaSort, FaSearch, FaCalendarAlt, FaUser, FaMapMarkerAlt } from "react-icons/fa";

export default function HostBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  const limit = 5;

  const statusOptions = [
    { value: 'all', label: 'All Bookings', color: 'gray' },
    { value: 'confirmed', label: 'Confirmed', color: 'green' },
    { value: 'pending', label: 'Pending', color: 'yellow' },
    { value: 'cancelled', label: 'Cancelled', color: 'red' },
    { value: 'completed', label: 'Completed', color: 'blue' }
  ];

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/host/bookings?page=${page}&limit=${limit}&status=${selectedStatus}&sort=${sortOrder}`,
        {
          withCredentials: true
        }
      );
      const { bookings: newBookings, totalPages: total } = response.data;

      if (page === 1) {
        setBookings(newBookings);
      } else {
        setBookings(prev => [...prev, ...newBookings]);
      }
      setTotalPages(total);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setError("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [page, limit, selectedStatus, sortOrder]);

  useEffect(() => {
    setPage(1);
    setBookings([]);
    fetchBookings();
  }, [selectedStatus, sortOrder]);

  useEffect(() => {
    fetchBookings();
  }, [page, fetchBookings]);

  const loadMore = () => {
    if (page < totalPages) {
      setPage((prev) => prev + 1);
    }
  };

  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    setPage(1); // Reset to first page when filter changes
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    setPage(1); // Reset to first page when sort changes
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-8 mb-8 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Booking Management</h1>
            <p className="text-white/80">
              Track and manage all your property bookings
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSortOrder}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
            >
              <FaSort />
              {sortOrder === 'asc' ? 'Oldest First' : 'Newest First'}
            </button>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="mb-6 flex flex-wrap gap-3">
        {statusOptions.map((status) => (
          <button
            key={status.value}
            onClick={() => handleStatusChange(status.value)}
            className={`px-4 py-2 rounded-xl max-w-40 flex items-center gap-2 transition-all
              ${selectedStatus === status.value
                ? `bg-${status.color}-100 text-${status.color}-800 border-2 border-${status.color}-200`
                : 'bg-gray-50 text-gray-600 border-2 border-transparent hover:border-gray-200'
              }`}
          >
            <FaFilter className={`text-${status.color}-500`} />
            {status.label}
          </button>
        ))}
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <FaMapMarkerAlt className="text-gray-400" />
                    Place
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <FaUser className="text-gray-400" />
                    Guest
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <FaCalendarAlt className="text-gray-400" />
                    Check-in
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <FaCalendarAlt className="text-gray-400" />
                    Check-out
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {bookings.map((booking) => (
                <tr 
                  key={booking._id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {booking.place?.title || "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {booking.user?.name || "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {format(new Date(booking.check_in), "MMM dd, yyyy")}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {format(new Date(booking.check_out), "MMM dd, yyyy")}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
                        ${
                          booking.status === "confirmed"
                            ? "bg-green-100 text-green-800"
                            : booking.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : booking.status === "cancelled"
                            ? "bg-red-100 text-red-800"
                            : booking.status === "completed"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                    >
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ${booking.price.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Link
                      to={`/host/bookings/${booking._id}`}
                      className="text-primary hover:text-primary-dark font-medium text-sm"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <FaSpinner className="animate-spin text-primary text-2xl" />
          </div>
        )}

        {/* Load More Button */}
        {page < totalPages && !loading && (
          <div className="p-4 flex justify-center">
            <button
              onClick={loadMore}
              className="px-6 py-3 bg-primary/5 text-primary rounded-xl hover:bg-primary/10 
                       transition-all duration-200 flex items-center gap-2"
            >
              Load More Bookings
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && bookings.length === 0 && (
          <div className="text-center py-12">
            <FaCalendarAlt className="mx-auto text-gray-300 text-5xl mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Bookings Found</h3>
            <p className="text-gray-500">
              {selectedStatus === 'all' 
                ? "You don't have any bookings yet"
                : `No ${selectedStatus} bookings found`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
