import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { FaSpinner, FaUser, FaCalendar, FaClock, FaMoneyBill, FaArrowLeft } from 'react-icons/fa';

export default function BookingDetail() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBookingDetails();
  }, [id]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/host/bookings/${id}`);
      setBooking(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching booking details:', err);
      setError('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <FaSpinner className="animate-spin text-primary text-3xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="p-6 text-center">
        <p>Booking not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link 
        to="/host/bookings" 
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <FaArrowLeft className="mr-2" />
        Back to Bookings
      </Link>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Booking Details
          </h1>

          {/* Place Information */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">{booking.place?.title}</h2>
            <img 
              src={booking.place?.photos?.[0]} 
              alt={booking.place?.title}
              className="w-full h-48 object-cover rounded-lg"
            />
          </div>

          {/* Guest Information */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <FaUser className="mr-2 text-gray-600" />
              Guest Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">Name</p>
                <p className="font-medium">{booking.user?.name}</p>
              </div>
              <div>
                <p className="text-gray-600">Email</p>
                <p className="font-medium">{booking.user?.email}</p>
              </div>
              <div>
                <p className="text-gray-600">Phone</p>
                <p className="font-medium">{booking.user?.phone || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-gray-600">Number of Guests</p>
                <p className="font-medium">{booking.numberOfGuests}</p>
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <FaCalendar className="mr-2 text-gray-600" />
                Check-in/Check-out
              </h3>
              <div className="space-y-2">
                <div>
                  <p className="text-gray-600">Check-in</p>
                  <p className="font-medium">
                    {format(new Date(booking.check_in), 'PPP')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Check-out</p>
                  <p className="font-medium">
                    {format(new Date(booking.check_out), 'PPP')}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <FaMoneyBill className="mr-2 text-gray-600" />
                Payment Details
              </h3>
              <div className="space-y-2">
                <div>
                  <p className="text-gray-600">Total Price</p>
                  <p className="font-medium">${booking.price}</p>
                </div>
                <div>
                  <p className="text-gray-600">Status</p>
                  <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Timeline */}
          <div className="mt-6 bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <FaClock className="mr-2 text-gray-600" />
              Booking Timeline
            </h3>
            <div className="space-y-2">
              <div>
                <p className="text-gray-600">Booked on</p>
                <p className="font-medium">
                  {format(new Date(booking.createdAt), 'PPP p')}
                </p>
              </div>
              {booking.updatedAt && booking.updatedAt !== booking.createdAt && (
                <div>
                  <p className="text-gray-600">Last Updated</p>
                  <p className="font-medium">
                    {format(new Date(booking.updatedAt), 'PPP p')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
