import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import {
  FaPlus,
  FaSpinner,
  FaBullhorn,
  FaChartLine,
  FaCalendarAlt,
} from "react-icons/fa";
import { format } from "date-fns";
import { Link } from "react-router-dom";

const AnnouncementCard = ({ announcement }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div>
        <h4 className="text-xl font-semibold text-gray-800">
          {announcement.title}
        </h4>
        <span className="text-sm text-gray-500 flex items-center mt-1">
          <FaCalendarAlt className="mr-2" />
          {format(new Date(announcement.createdAt), "MMM d, yyyy")}
        </span>
      </div>
      <span
        className={`px-3 py-1 rounded-full text-sm font-medium ${
          announcement.type === "urgent"
            ? "bg-red-100 text-red-800"
            : announcement.type === "important"
            ? "bg-yellow-100 text-yellow-800"
            : "bg-green-100 text-green-800"
        }`}
      >
        {announcement.type}
      </span>
    </div>

    <p className="text-gray-600 mb-4">{announcement.content}</p>

    <div className="border-t pt-4 mt-4">
      <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
        <FaChartLine className="mr-2" /> Performance Metrics
      </h5>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-gray-600">Total Bookings</p>
          <p className="text-lg font-semibold text-blue-600">
            {announcement.metrics?.totalBookings || 0}
          </p>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-sm text-gray-600">Total Revenue</p>
          <p className="text-lg font-semibold text-green-600">
            ${announcement.metrics?.totalRevenue?.toLocaleString() || 0}
          </p>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg">
          <p className="text-sm text-gray-600">Completed</p>
          <p className="text-lg font-semibold text-purple-600">
            {announcement.metrics?.completedBookings || 0}
          </p>
        </div>
        <div className="bg-red-50 p-3 rounded-lg">
          <p className="text-sm text-gray-600">Cancelled</p>
          <p className="text-lg font-semibold text-red-600">
            {announcement.metrics?.cancelledBookings || 0}
          </p>
        </div>
      </div>
    </div>
  </div>
);

AnnouncementCard.propTypes = {
  announcement: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    type: PropTypes.oneOf(["regular", "important", "urgent"]).isRequired,
    createdAt: PropTypes.string.isRequired,
    metrics: PropTypes.shape({
      totalBookings: PropTypes.number,
      totalRevenue: PropTypes.number,
      completedBookings: PropTypes.number,
      cancelledBookings: PropTypes.number,
    }),
  }).isRequired,
};

export default function HostAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await axios.get("/api/host/announcements");
      setAnnouncements(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      setError("Failed to fetch announcements");
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800">Your Announcements</h3>
        <Link
          to="/host/announcements/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <FaPlus className="mr-2" /> Create Announcement
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto" />
          <p className="text-gray-600 mt-2">Loading announcements...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-lg text-red-700">{error}</div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FaBullhorn className="text-4xl text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No announcements yet</p>
          <Link
            to="/host/announcements/new"
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium inline-block"
          >
            Create your first announcement
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {announcements.map((announcement) => (
            <AnnouncementCard
              key={announcement._id}
              announcement={announcement}
            />
          ))}
        </div>
      )}
    </div>
  );
}
