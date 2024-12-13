import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { FaBullhorn, FaSpinner, FaPlus } from 'react-icons/fa';
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <FaSpinner className="animate-spin text-primary text-3xl" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Your Announcements</h2>
        <Link
          to="/host/announcements/new"
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
        >
          <FaPlus size={16} />
          Create Announcement
        </Link>
      </div>

      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <FaBullhorn className="mx-auto text-4xl text-gray-300 mb-2" />
            <p className="text-gray-500">No announcements yet</p>
            <Link
              to="/host/announcements/new"
              className="text-primary hover:text-primary-dark mt-2 inline-block"
            >
              Create your first announcement
            </Link>
          </div>
        ) : (
          announcements.map((announcement) => (
            <div key={announcement._id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-start">
                <div>
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                    {announcement.type} - {announcement.period}ly
                  </span>
                  <p className="text-sm text-gray-500 mt-2">
                    {format(new Date(announcement.createdAt), 'PPP')}
                  </p>
                </div>
              </div>
              <p className="mt-4">{announcement.message}</p>
              <div className="mt-4 flex gap-4">
                <div className="bg-gray-50 px-4 py-2 rounded-lg">
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-lg font-semibold">
                    {announcement.type === 'revenue' ? '$' : ''}
                    {announcement.metrics.total}
                  </p>
                </div>
                <div className="bg-gray-50 px-4 py-2 rounded-lg">
                  <p className="text-sm text-gray-600">Change</p>
                  <p className={`text-lg font-semibold ${
                    announcement.metrics.percentageChange > 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {announcement.metrics.percentageChange > 0 ? '+' : ''}
                    {announcement.metrics.percentageChange.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 
