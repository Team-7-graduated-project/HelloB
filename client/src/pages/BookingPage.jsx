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

  const renderPaymentButton = () => {
    if (booking?.paymentStatus === "paid" || paymentStatus === "paid") {
      return (
        <div className="ml-10 text-green-600 font-semibold">
          Paid via{" "}
          {booking?.paymentMethod === "payLater"
            ? "Pay at Property"
            : "Online Payment"}
        </div>
      );
    }

    if (
      (booking?.paymentStatus === "pending" &&
        booking?.paymentMethod === "payLater") ||
      (paymentStatus === "pending" && paymentMethod === "payLater")
    ) {
      return (
        <div className="ml-10 text-orange-600 font-semibold">
          Payment pending - Pay at Property
        </div>
      );
    }

    return (
      <button
        className="ml-10 text-black max-w-36 bg-sky-500 rounded-md px-4 py-2 hover:bg-sky-600"
        onClick={handleOpenModal}
      >
        Choose your Payment
      </button>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Booking Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {placeToPass.title}
        </h1>
        <AddressLink className="text-gray-600">
          {booking.place.address || "Address not available"}
        </AddressLink>
      </div>

      {/* Checkout Status Section */}
      {booking && (
        <div className="bg-white shadow-lg rounded-2xl overflow-hidden mb-8">
          <div className="p-6">
            <div className="flex items-center mb-4 text-gray-800">
              <FaCheckCircle className="text-primary mr-2" size={20} />
              <h2 className="text-xl font-semibold">Checkout Status</h2>
            </div>

            {booking.status === "completed" ? (
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center text-green-600">
                  <FaCheckCircle className="mr-2" />
                  <span>Checkout completed</span>
                </div>
              </div>
            ) : isReadyForCheckout(booking) ? (
              <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                <div className="flex items-center mb-4">
                  <FaCheckCircle className="text-green-600 mr-2" size={24} />
                  <h3 className="text-lg font-medium">Ready for Checkout</h3>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                  className={`w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors ${
                    checkoutLoading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <FaCheckCircle />
                  {checkoutLoading ? "Processing..." : "Confirm Checkout"}
                </button>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center text-gray-600">
                  <FaCalendarCheck className="mr-2" />
                  <span>
                    {booking.status !== "confirmed"
                      ? "Booking must be confirmed to checkout"
                      : booking.paymentStatus !== "paid"
                      ? "Payment must be completed to checkout"
                      : new Date() < new Date(booking.check_out)
                      ? `Checkout will be available on ${new Date(
                          booking.check_out
                        ).toLocaleDateString()}`
                      : new Date() > new Date(booking.check_out)
                      ? "Checkout period has passed"
                      : "Checkout not available"}
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  Check-out date:{" "}
                  {new Date(booking.check_out).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Booking Information Card */}
      <div className="bg-white shadow-lg rounded-2xl overflow-hidden mb-8">
        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Dates Section */}
            <div>
              <div className="flex items-center mb-4 text-gray-800">
                <FaCalendarCheck className="text-primary mr-2" size={20} />
                <h2 className="text-xl font-semibold">Booking Dates</h2>
              </div>
              {booking?.check_in && booking?.check_out ? (
                <BookingDates booking={booking} className="text-gray-600" />
              ) : (
                <div className="text-red-500">Booking dates not available</div>
              )}
            </div>

            {/* Price Section */}
            <div>
              <div className="flex items-center mb-4 text-gray-800">
                <FaMoneyBillWave className="text-primary mr-2" size={20} />
                <h2 className="text-xl font-semibold">Total Price</h2>
              </div>
              <div className="bg-primary/10 p-4 max-w-32 rounded-xl">
                <span className="text-2xl font-bold text-primary">
                  ${booking.price}
                </span>
                <span className="text-gray-600 ml-2">total</span>
              </div>
            </div>

            {/* Payment Section */}
            <div>
              <div className="flex items-center mb-4 text-gray-800">
                <FaCreditCard className="text-primary mr-2" size={20} />
                <h2 className="text-xl font-semibold">Payment Status</h2>
              </div>
              <div className="space-y-4">{renderPaymentButton()}</div>
            </div>

            {/* Cancellation Section */}
            <div>
              <div className="flex items-center mb-4 text-gray-800">
                <FaRegTimesCircle className="text-primary mr-2" size={20} />
                <h2 className="text-xl font-semibold">Cancellation</h2>
              </div>
              <div className="space-y-4">{renderCancellationSection()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Place Gallery */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
        <PlaceGallery place={placeToPass} />
      </div>

      {/* Review Section */}
      <div className="bg-white overflow-hidden">
        {booking?.paymentStatus === "paid" || paymentStatus === "paid" ? (
          <ReviewPage
            rating={rating}
            setRating={setRating}
            placeId={booking.place._id}
          />
        ) : (
          <div className="p-6 text-center text-gray-600">
            Please complete your payment to leave a review.
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {isModalOpen && booking && user && (
        <PaymentOptionsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          price={booking.price}
          bookingId={booking._id}
          userId={user._id}
        />
      )}

      {/* Add Report Button */}
      <div className="mt-4 border-t pt-4">
        {canReport() ? (
          <button
            onClick={() => setShowReportForm(true)}
            className="flex items-center gap-2 text-gray-600 hover:text-red-500"
          >
            <FaFlag />
            Report an issue
          </button>
        ) : (
          user && (
            <div className="text-red-600 font-bold italic">
              Only registered users can report issues
            </div>
          )
        )}
      </div>

      {/* Report Form Modal */}
      {showReportForm && canReport() && (
        <ReportForm
          placeId={booking.place._id}
          onClose={() => setShowReportForm(false)}
        />
      )}
    </div>
  );
}
