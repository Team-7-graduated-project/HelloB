import { useState } from 'react';
import axios from 'axios';
import { 
  FaBullhorn, 
  FaSpinner, 
  FaArrowLeft, 
  FaChartLine, 
  FaCalendarAlt,
  FaUsers,
  FaMoneyBillWave,
  FaRegCalendarAlt,
  FaExclamationCircle
} from 'react-icons/fa';
import { useNavigate, Link } from 'react-router-dom';

export default function AnnouncementForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    type: 'revenue',
    period: 'week',
    message: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const announcementTypes = [
    { value: 'revenue', label: 'Revenue', icon: <FaMoneyBillWave className="text-green-500" /> },
    { value: 'bookings', label: 'Bookings', icon: <FaCalendarAlt className="text-blue-500" /> }
  ];

  const periodTypes = [
    { value: 'week', label: 'Weekly', icon: <FaRegCalendarAlt className="text-orange-500" /> },
    { value: 'month', label: 'Monthly', icon: <FaRegCalendarAlt className="text-indigo-500" /> }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await axios.post('/api/host/announcements', formData);
      navigate('/host/announcements');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create announcement');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        to="/host/announcements"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-8 group"
      >
        <FaArrowLeft className="transition-transform group-hover:-translate-x-1" />
        <span>Back to Announcements</span>
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        {/* Form Header */}
        <div className="bg-gradient-to-r from-primary to-primary-dark p-6 rounded-t-2xl">
          <h3 className="text-2xl font-bold text-white flex items-center gap-3">
            <FaBullhorn className="text-white/90" />
            Create New Announcement
          </h3>
          <p className="text-white/80 mt-2">
            Share updates about your business metrics and performance
          </p>
        </div>

        {/* Form Content */}
        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700">
              <FaExclamationCircle className="flex-shrink-0 text-red-500" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Announcement Type
              </label>
              <div className="grid grid-cols-2 gap-4">
                {announcementTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: type.value })}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2
                      ${formData.type === type.value 
                        ? 'border-primary bg-primary/5 text-primary' 
                        : 'border-gray-200 hover:border-primary/50'}`}
                  >
                    {type.icon}
                    <span className="font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Period Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Period
              </label>
              <div className="grid grid-cols-2 gap-4">
                {periodTypes.map((period) => (
                  <button
                    key={period.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, period: period.value })}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-center gap-3
                      ${formData.period === period.value 
                        ? 'border-primary bg-primary/5 text-primary' 
                        : 'border-gray-200 hover:border-primary/50'}`}
                  >
                    {period.icon}
                    <span className="font-medium">{period.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Message Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Announcement Message
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full h-32 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                placeholder="Write your announcement message here..."
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="w-full bg-primary text-white py-4 rounded-xl hover:bg-primary-dark 
                       transition-all duration-200 flex items-center justify-center gap-3
                       disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Creating Announcement...
                  
                </>
              ) : (
                <>
                  <FaBullhorn />
                  Create Announcement
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 
