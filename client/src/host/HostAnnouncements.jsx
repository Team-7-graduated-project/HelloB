import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { FaBullhorn, FaSpinner } from 'react-icons/fa';

export default function HostAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await axios.get('/api/admin/announcements');
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
    <div className="space-y-4">
      {announcements.map((announcement) => (
        <div key={announcement._id} className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-lg">{announcement.host.name}</h3>
              <p className="text-sm text-gray-500">
                {format(new Date(announcement.createdAt), 'PPP')}
              </p>
            </div>
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
              {announcement.type} - {announcement.period}ly
            </span>
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
      ))}
    </div>
  );
} 
