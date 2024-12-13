import { useState } from 'react';
import axios from 'axios';
import { FaBullhorn, FaSpinner } from 'react-icons/fa';

export default function AnnouncementForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    type: 'revenue',
    period: 'week',
    message: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await axios.post('/api/host/announcements', formData);
      onSuccess();
      setFormData({ type: 'revenue', period: 'week', message: '' });
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create announcement');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <FaBullhorn className="text-primary" />
        Create Announcement
      </h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full border rounded-lg p-2"
          >
            <option value="revenue">Revenue</option>
            <option value="bookings">Bookings</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Period
          </label>
          <select
            value={formData.period}
            onChange={(e) => setFormData({ ...formData, period: e.target.value })}
            className="w-full border rounded-lg p-2"
          >
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="w-full border rounded-lg p-2"
            rows="3"
            placeholder="Add a message to your announcement..."
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <FaSpinner className="animate-spin" />
              Creating...
            </>
          ) : (
            'Create Announcement'
          )}
        </button>
      </form>
    </div>
  );
} 
