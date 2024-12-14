import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { FaBullhorn, FaSpinner, FaPlus, FaChartLine, FaUsers, FaCalendarAlt, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { Link } from 'react-router-dom';

export default function HostAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await axios.get('/api/host/announcements');
      setAnnouncements(response.data);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAnnouncementIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'revenue':
        return <FaChartLine className="text-green-500" />;
      case 'bookings':
        return <FaCalendarAlt className="text-blue-500" />;
      case 'visitors':
        return <FaUsers className="text-purple-500" />;
      default:
        return <FaBullhorn className="text-primary" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <FaSpinner className="animate-spin text-primary text-4xl mx-auto mb-4" />
          <p className="text-gray-600">Loading announcements...</p>
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
            <h2 className="text-3xl font-bold mb-2">Announcements Dashboard</h2>
            <p className="text-white/80">
              Keep track of your business metrics and important updates
            </p>
          </div>
          <Link
            to="/host/announcements/new"
            className="bg-white text-primary px-6 py-3 rounded-xl hover:bg-gray-50 transition-all duration-200 flex items-center gap-2 shadow-lg hover:scale-105"
          >
            <FaPlus size={16} />
            Create Announcement
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        {announcements.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
            <FaBullhorn className="mx-auto text-6xl text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Announcements Yet</h3>
            <p className="text-gray-500 mb-6">Start creating announcements to keep track of your business metrics</p>
            <Link
              to="/host/announcements/new"
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary-dark transition-all duration-200"
            >
              <FaPlus size={16} />
              Create your first announcement
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {announcements.map((announcement) => (
              <div 
                key={announcement._id} 
                className="bg-gray-200 rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-200"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gray-50 rounded-xl">
                      {getAnnouncementIcon(announcement.type)}
                    </div>
                    <div>
                      <span className="px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
                        {announcement.type} - {announcement.period}ly
                      </span>
                      <p className="text-sm text-gray-500 mt-2">
                        {format(new Date(announcement.createdAt), 'PPP')}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-gray-700 mb-6">{announcement.message}</p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 px-4 py-3 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">Total</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {announcement.type === 'revenue' ? '$' : ''}
                      {announcement.metrics.total.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">Change</p>
                    <div className="flex items-center gap-1">
                      {announcement.metrics.percentageChange > 0 ? (
                        <FaArrowUp className="text-green-500" />
                      ) : (
                        <FaArrowDown className="text-red-500" />
                      )}
                      <p className={`text-xl font-semibold ${
                        announcement.metrics.percentageChange > 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {Math.abs(announcement.metrics.percentageChange).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 
