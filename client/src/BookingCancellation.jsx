import { useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";

export default function BookingCancellation({ bookingId, onCancel, booking }) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const calculateCancellationFee = () => {
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

  const handleCancelClick = () => {
    setIsConfirming(true);
  };

  const handleConfirmCancel = async () => {
    setErrorMessage("");
    try {
      setIsLoading(true);
      const cancellationFee = calculateCancellationFee();

      if (cancellationFee > 0) {
        const confirmFee = window.confirm(
          `Early cancellation will incur a fee of $${cancellationFee}. Do you want to proceed?`
        );

        if (!confirmFee) {
          setIsLoading(false);
          setIsConfirming(false);
          return;
        }
      }

      await onCancel(bookingId, { cancellationFee });
      setIsConfirming(false);
      navigate("/account/bookings");
    } catch (error) {
      console.error("Cancellation failed:", error);
      setErrorMessage("Cancellation failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelDismiss = () => {
    setIsConfirming(false);
    setErrorMessage("");
  };

  return (
    <div className="relative">
      <button
        className="bg-red-500 max-w-40 hover:bg-red-600 text-white py-2 px-6 rounded-lg 
                   text-sm font-medium transition-colors duration-200 ease-in-out
                   flex items-center gap-2"
        onClick={handleCancelClick}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18 18 6M6 6l12 12"
          />
        </svg>
        Cancel Booking
      </button>

      {isConfirming && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-8 h-8 text-red-500"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Cancel Booking
              </h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to cancel this booking? This action cannot
                be undone.
              </p>

              {/* Add cancellation fee warning if applicable */}
              {calculateCancellationFee() > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800">
                    <span className="font-semibold">
                      Early Cancellation Fee:
                    </span>{" "}
                    ${calculateCancellationFee()}
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    This fee applies because you&apos;re cancelling during the
                    booking period.
                  </p>
                </div>
              )}
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                  />
                </svg>
                {errorMessage}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                className={`flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg
                           font-medium transition-colors duration-200 ease-in-out
                           flex items-center justify-center gap-2
                           ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={handleConfirmCancel}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Cancelling...
                  </>
                ) : (
                  `Yes, Cancel${
                    calculateCancellationFee() > 0 ? " with Fee" : ""
                  }`
                )}
              </button>
              <button
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-lg
                         font-medium transition-colors duration-200 ease-in-out"
                onClick={handleCancelDismiss}
              >
                No, Keep Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

BookingCancellation.propTypes = {
  bookingId: PropTypes.string.isRequired,
  onCancel: PropTypes.func.isRequired,
  booking: PropTypes.shape({
    check_out: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
  }).isRequired,
};
