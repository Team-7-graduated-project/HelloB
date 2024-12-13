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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Host Announcements</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage and monitor all host announcements
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <FaBullhorn className="mx-auto text-4xl text-gray-300 mb-2" />
            <p className="text-gray-500">No announcements found</p>
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
                    Posted by: {announcement.host?.name || 'Unknown Host'} on{' '}
                    {format(new Date(announcement.createdAt), 'PPP')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleAnnouncementStatus(announcement._id, announcement.isActive)}
                    className={`p-2 rounded-full ${
                      announcement.isActive 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-red-100 text-red-600'
                    }`}
                    title={announcement.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {announcement.isActive ? <FaCheck /> : <FaTimes />}
                  </button>
                  <button
                    onClick={() => deleteAnnouncement(announcement._id)}
                    className="p-2 rounded-full bg-red-100 text-red-600"
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
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
