import { useEffect, useState, useContext, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import AddressLink from "../AddressLink";
import PlaceGallery from "../PlaceGallery";
import BookingDates from "../BookingDates";
import ReviewPage from "./ReviewPage";
import BookingCancellation from "../BookingCancellation";
import PaymentOptionsModal from "../PaymentOptionsModal";
import { UserContext } from "../UserContext";
import {
  FaMoneyBillWave,
  FaCalendarCheck,
  FaCreditCard,
  FaRegTimesCircle,
  FaFlag,
  FaCheckCircle,
  FaClock,
  FaStar,
  FaSpinner,
  FaInfoCircle,
} from "react-icons/fa";
import ReportForm from "../components/ReportForm";

export default function BookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const [booking, setBooking] = useState(null);
  const [rating, setRating] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(
    booking?.paymentStatus || null
  );
  const [paymentMethod, setPaymentMethod] = useState(
    booking?.paymentMethod || null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  const loadBooking = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await axios.get(`/bookings/${id}`, {
        withCredentials: true,
      });
      setBooking(response.data);
      setPaymentStatus(response.data.paymentStatus);
      setPaymentMethod(response.data.paymentMethod);
    } catch (error) {
      console.error("Error loading booking:", error);
      setError(error.response?.data?.error || "Failed to load booking");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  const isReadyForCheckout = (booking) => {
    if (!booking) {
      return false;
    }

    const now = new Date();
    const checkOutDate = new Date(booking.check_out);

    // Reset time parts to compare only dates
    now.setHours(0, 0, 0, 0);
    checkOutDate.setHours(0, 0, 0, 0);

    // If past checkout date and payment is confirmed, auto-complete the booking
    if (
      now.getTime() > checkOutDate.getTime() &&
      booking.status === "confirmed" &&
      booking.paymentStatus === "paid"
    ) {
      handleAutoComplete();
      return false;
    }

    return (
      booking.status === "confirmed" &&
      booking.paymentStatus === "paid" &&
      now.getTime() === checkOutDate.getTime()
    );
  };

  const handleAutoComplete = async () => {
    try {
      await axios.post(`/bookings/${id}/checkout`);
      await loadBooking();
      navigate("/account/history");
    } catch (error) {
      console.error("Auto-completion error:", error);
    }
  };

  const canCancelBooking = (booking) => {
    if (!booking?.check_in) return false;

    const now = new Date();
    const checkInDate = new Date(booking.check_in);
    now.setHours(0, 0, 0, 0);
    checkInDate.setHours(0, 0, 0, 0);

    // Can only cancel if current date is before check-in date
    return now.getTime() < checkInDate.getTime();
  };

  const calculateEarlyCheckoutFee = (booking) => {
    if (!booking?.check_out || !booking?.price) return 0;

    const now = new Date();
    const checkOutDate = new Date(booking.check_out);
    const remainingDays = Math.ceil(
      (checkOutDate - now) / (1000 * 60 * 60 * 24)
    );

    // Calculate fee as 20% of remaining days (reduced from 50%)
    const feePerDay = booking.price * 0.2; // Changed to 20%
    return Math.max(0, remainingDays * feePerDay);
  };

  const handleCheckout = async () => {
    try {
      setCheckoutLoading(true);
      const now = new Date();
      const checkOutDate = new Date(booking.check_out);

      if (now < checkOutDate) {
        // Early checkout
        const earlyCheckoutFee = calculateEarlyCheckoutFee(booking);
        const confirmEarlyCheckout = window.confirm(
          `Early checkout will incur a fee of $${earlyCheckoutFee}. Do you want to proceed?`
        );

        if (!confirmEarlyCheckout) {
          setCheckoutLoading(false);
          return;
        }

        // Include fee in checkout request
        await axios.post(`/bookings/${id}/checkout`, {
          earlyCheckout: true,
          earlyCheckoutFee,
        });
      } else {
        // Normal checkout
        await axios.post(`/bookings/${id}/checkout`);
      }

      await loadBooking();
      alert(
        "Checkout confirmed successfully! You can view this booking in your booking history."
      );
      navigate("/account/history");
    } catch (error) {
      console.error("Checkout error:", error);
      alert(error.response?.data?.error || "Failed to confirm checkout");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const renderCancellationSection = () => {
    if (!booking) return null;

    if (booking.status === "completed") {
      return <div className="text-gray-500">Booking has been completed</div>;
    }

    if (!canCancelBooking(booking)) {
      return (
        <div className="text-orange-600">
          Cancellation is not available during active bookings. Early checkout
          is available with additional fees.
        </div>
      );
    }

    return (
      <BookingCancellation
        bookingId={id}
        onCancel={async (bookingId, { cancellationFee }) => {
          try {
            await axios.delete(`/bookings/${bookingId}`, {
              data: { cancellationFee },
            });
            navigate("/account/bookings");
          } catch (error) {
            console.error("Error cancelling booking:", error);
            throw error;
          }
        }}
        booking={booking}
      />
    );
  };

  const canReport = useCallback(() => {
    if (!user) return false;
    return user.role === "user"; // Only allow regular users to report
  }, [user]);

  const checkUserReview = useCallback(async () => {
    if (!booking?.place?._id || !user?._id) return;
    
    try {
      const response = await axios.get(`/api/reviews/check`, {
        params: {
          placeId: booking.place._id,
          userId: user._id
        }
      });
      setHasReviewed(response.data.hasReviewed);
    } catch (error) {
      console.error("Error checking review status:", error);
    }
  }, [booking?.place?._id, user?._id]);

  useEffect(() => {
    if (booking) {
      checkUserReview();
    }
  }, [booking, checkUserReview]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 py-8">{error}</div>;
  }

  if (!booking) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl">Booking not found</h2>
      </div>
    );
  }

  const placeToPass =
    typeof booking.place === "object" && booking.place !== null
      ? booking.place
      : { title: "N/A", photos: [] };

  const handleOpenModal = () => {
    if (!user) {
      navigate("/login", { state: { from: `/account/bookings/${id}` } });
      return;
    }
    setIsModalOpen(true);
  };
  const handleCloseModal = async (paymentInfo) => {
    setIsModalOpen(false);
    if (paymentInfo) {
      setPaymentStatus(paymentInfo.status);
      setPaymentMethod(paymentInfo.method);

      // Reload booking data to get updated payment status
      await loadBooking();
    }
  };

  const StatusBadge = ({ status }) => {
    const styles = {
      completed: "bg-green-100 text-green-800 border border-green-200",
      confirmed: "bg-blue-100 text-blue-800 border border-blue-200",
      pending: "bg-yellow-100 text-yellow-800 border border-yellow-200",
      cancelled: "bg-red-100 text-red-800 border border-red-200"
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] || styles.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const PaymentStatusBadge = ({ status, method }) => {
    if (status === "paid") {
      return (
        <div className="flex items-center gap-2 text-green-600">
          <FaCheckCircle />
          <span>Paid via {method === "payLater" ? "Pay at Property" : "Online Payment"}</span>
        </div>
      );
    }

    if (status === "pending" && method === "payLater") {
      return (
        <div className="flex items-center gap-2 text-orange-600">
          <FaClock />
          <span>Payment pending - Pay at Property</span>
        </div>
      );
    }

    return (
      <button
        onClick={handleOpenModal}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all duration-200"
      >
        <FaCreditCard />
        Choose Payment Method
      </button>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Booking Header with Status */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{placeToPass.title}</h1>
            <AddressLink className="text-gray-600 mt-1">
              {booking.place.address || "Address not available"}
            </AddressLink>
          </div>
          <StatusBadge status={booking.status} />
        </div>
      </div>

      {/* Checkout Status Card */}
      {booking && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FaCheckCircle className="text-primary" size={24} />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Checkout Status</h2>
          </div>

          {booking.status === "completed" ? (
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <div className="flex items-center text-green-700">
                <FaCheckCircle className="mr-2" />
                <span className="font-medium">Checkout completed successfully</span>
              </div>
            </div>
          ) : isReadyForCheckout(booking) ? (
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
              <div className="flex items-center mb-4">
                <FaCalendarCheck className="text-blue-600 mr-2" size={24} />
                <h3 className="text-lg font-medium text-blue-900">Ready for Checkout</h3>
              </div>
              <button
                onClick={handleCheckout}
                disabled={checkoutLoading}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all duration-200 ${
                  checkoutLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {checkoutLoading ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FaCheckCircle />
                    Confirm Checkout
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center text-gray-700">
                <FaInfoCircle className="mr-2" />
                <span>
                  {booking.status !== "confirmed"
                    ? "Booking must be confirmed to checkout"
                    : booking.paymentStatus !== "paid"
                    ? "Payment must be completed to checkout"
                    : new Date() < new Date(booking.check_out)
                    ? `Checkout will be available on ${new Date(booking.check_out).toLocaleDateString()}`
                    : "Checkout period has passed"}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Booking Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Dates Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FaCalendarCheck className="text-primary" size={20} />
            </div>
            <h3 className="font-semibold text-gray-900">Booking Dates</h3>
          </div>
          <BookingDates booking={booking} className="text-gray-600" />
        </div>

        {/* Price Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FaMoneyBillWave className="text-primary" size={20} />
            </div>
            <h3 className="font-semibold text-gray-900">Total Price</h3>
          </div>
          <div className="text-3xl font-bold text-primary">${booking.price}</div>
        </div>

        {/* Payment Status Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FaCreditCard className="text-primary" size={20} />
            </div>
            <h3 className="font-semibold text-gray-900">Payment Status</h3>
          </div>
          <PaymentStatusBadge status={paymentStatus} method={paymentMethod} />
        </div>

        {/* Cancellation Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FaRegTimesCircle className="text-primary" size={20} />
            </div>
            <h3 className="font-semibold text-gray-900">Cancellation</h3>
          </div>
          {renderCancellationSection()}
        </div>
      </div>

      {/* Place Gallery */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <PlaceGallery place={placeToPass} />
      </div>

      {/* Review Section */}
      {!hasReviewed ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          {booking?.paymentStatus === "paid" || paymentStatus === "paid" ? (
            <ReviewPage
              rating={rating}
              setRating={setRating}
              placeId={booking.place._id}
              onReviewSubmitted={() => setHasReviewed(true)}
            />
          ) : (
            <div className="p-6 text-center text-gray-600">
              <FaStar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p>Complete your payment to leave a review</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="p-6 text-center">
            <div className="bg-green-50 rounded-xl p-4 inline-flex items-center gap-2 text-green-700">
              <FaCheckCircle className="text-green-500" />
              <span>Thank you! You've already reviewed this booking</span>
            </div>
          </div>
        </div>
      )}

      {/* Report Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <FaFlag className="text-red-500" size={20} />
            </div>
            <h3 className="font-semibold text-gray-900">Report an Issue</h3>
          </div>
          {canReport() ? (
            <button
              onClick={() => setShowReportForm(true)}
              className="px-4 py-2 bg-red-200 max-w-32 text-red-600 hover:bg-red-300 rounded-lg transition-colors"
            >
              Report Issue
            </button>
          ) : (
            user && (
              <span className="text-red-600 text-sm">
                Only registered users can report issues
              </span>
            )
          )}
        </div>
      </div>

      {/* Modals */}
      {isModalOpen && booking && user && (
        <PaymentOptionsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          price={booking.price}
          bookingId={booking._id}
          userId={user._id}
        />
      )}

      {showReportForm && canReport() && (
        <ReportForm
          placeId={booking.place._id}
          onClose={() => setShowReportForm(false)}
        />
      )}
    </div>
  );
}
