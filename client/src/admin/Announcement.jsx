import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { FaBullhorn, FaSpinner, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await axios.get('/api/admin/announcements');
      setAnnouncements(response.data);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
      setError('Failed to load announcements');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAnnouncementStatus = async (id, currentStatus) => {
    try {
      await axios.patch(`/api/admin/announcements/${id}/toggle`, {
        isActive: !currentStatus
      });
      fetchAnnouncements();
    } catch (error) {
      console.error('Failed to toggle announcement status:', error);
    }
  };

  const deleteAnnouncement = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) {
      return;
    }

    try {
      await axios.delete(`/api/admin/announcements/${id}`);
      fetchAnnouncements();
    } catch (error) {
      console.error('Failed to delete announcement:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <FaSpinner className="animate-spin text-primary text-3xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-8 mb-8 text-white">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Announcements</h1>
            <p className="text-white/80">Manage and monitor host announcements</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {announcements.map((announcement) => (
          <div key={announcement._id} className="bg-gray-200 rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                    {announcement.type}
                  </span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                    {announcement.period}ly
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  Posted by: {announcement.host?.name || 'Unknown Host'} • {format(new Date(announcement.createdAt), 'PPP')}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleAnnouncementStatus(announcement._id, announcement.isActive)}
                  className={`p-2 rounded-lg transition-colors ${
                    announcement.isActive 
                      ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                      : 'bg-red-100 text-red-600 hover:bg-red-200'
                  }`}
                  title={announcement.isActive ? 'Deactivate' : 'Activate'}
                >
                  {announcement.isActive ? <FaCheck /> : <FaTimes />}
                </button>
                <button
                  onClick={() => deleteAnnouncement(announcement._id)}
                  className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                  title="Delete"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
            
            <p className="mt-4 text-gray-700">{announcement.message}</p>
            
            <div className="mt-4 flex gap-4">
              <div className="bg-gray-50 px-6 py-3 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total</p>
                <p className="text-xl font-semibold text-gray-900">
                  {announcement.type === 'revenue' ? '$' : ''}
                  {announcement.metrics.total}
                </p>
              </div>
              <div className="bg-gray-50 px-6 py-3 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Change</p>
                <p className={`text-xl font-semibold ${
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
        ))}
      </div>
    </div>
  );
} 
