import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import {
  FaTicketAlt,
  FaCreditCard,
  FaTimes,
  FaCheck,
  FaArrowLeft,
  FaMoneyBillWave,
  FaClock,
  FaInfoCircle,
} from "react-icons/fa";

export default function PaymentOptionsModal({
  isOpen,
  onClose,
  price,
  bookingId,
  userId,
}) {
  const [selectedOption, setSelectedOption] = useState("payNow");
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [finalPrice, setFinalPrice] = useState(price);

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [currentStep, setCurrentStep] = useState("voucher"); // 'voucher' or 'payment'

  const fetchAvailableVouchers = useCallback(async () => {
    if (!bookingId) return;

    setLoadingVouchers(true);
    setErrorMessage("");

    try {
      const response = await axios.get(`/vouchers/available/${bookingId}`, {
        withCredentials: true,
      });

      const usableVouchers = response.data.filter(
        (voucher) => voucher.usedCount < voucher.usageLimit
      );

      setAvailableVouchers(usableVouchers);
    } catch (error) {
      console.error("Error fetching vouchers:", error);
      setErrorMessage(
        error.response?.data?.error ||
          "Failed to load vouchers. Please try again."
      );
      setAvailableVouchers([]);
    } finally {
      setLoadingVouchers(false);
    }
  }, [bookingId]);

  useEffect(() => {
    if (showVoucherModal && bookingId) {
      fetchAvailableVouchers();
    }
  }, [showVoucherModal, bookingId, fetchAvailableVouchers]);

  const handleSelectVoucher = async (voucherCode) => {
    setIsProcessing(true);
    try {
      const validateResponse = await axios.post(
        "/vouchers/validate",
        {
          voucherCode,
          bookingId,
        },
        { withCredentials: true }
      );

      if (validateResponse.data.valid) {
        setCouponCode(voucherCode);
        const discountAmount = (price * validateResponse.data.discount) / 100;
        setDiscount(discountAmount);
        setFinalPrice(price - discountAmount);
        setSuccessMessage("Voucher applied successfully!");
        setShowVoucherModal(false);
        setErrorMessage(""); // Clear any previous errors
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.error || "Failed to apply voucher");
      setCouponCode("");
      setDiscount(0);
      setFinalPrice(price);
    } finally {
      setIsProcessing(false);
    }
  };

  const VoucherModal = () => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-800">
              Available Vouchers
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Select a voucher to apply to your booking
            </p>
          </div>
          <button
            onClick={() => setShowVoucherModal(false)}
            className="text-gray-500 max-w-10 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Loading State */}
        {loadingVouchers && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-gray-500 mt-4">Loading available vouchers...</p>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-4">
            <div className="flex items-center">
              <FaTimes className="text-red-500 mr-2" />
              <p className="text-red-700">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Vouchers List */}
        {!loadingVouchers && availableVouchers.length > 0 ? (
          <div className="space-y-4">
            {availableVouchers.map((voucher) => (
              <div
                key={voucher._id}
                className={`relative overflow-hidden rounded-xl border ${
                  voucher.canUse
                    ? "border-primary/20 bg-gradient-to-r from-white to-primary/5"
                    : "border-gray-200 bg-gray-50"
                } transition-all duration-300 hover:shadow-lg`}
              >
                {/* Discount Badge */}
                <div className="absolute top-0 right-0">
                  <div className="bg-primary text-white px-3 py-1 rounded-bl-lg text-sm font-bold">
                    {voucher.discount}% OFF
                  </div>
                </div>

                <div className="p-4">
                  {/* Voucher Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <FaTicketAlt
                          className={`${
                            voucher.canUse ? "text-primary" : "text-gray-400"
                          } transform -rotate-45`}
                        />
                        <span className="font-bold text-lg text-gray-800">
                          {voucher.code}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {voucher.description}
                      </p>
                    </div>
                  </div>

                  {/* Voucher Details */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <FaMoneyBillWave className="text-green-500" />
                      <span>
                        Save up to $
                        {((price * voucher.discount) / 100).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FaClock className="text-orange-500" />
                      <span>
                        Expires{" "}
                        {new Date(voucher.expirationDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Status and Action */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      {voucher.claimed ? (
                        <span className="inline-flex items-center text-sm text-green-600">
                          <FaCheck className="mr-1" /> Claimed
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-sm text-orange-600">
                          <FaInfoCircle className="mr-1" /> Not claimed
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleSelectVoucher(voucher.code)}
                      disabled={!voucher.canUse || isProcessing}
                      className={`px-4 py-2 max-w-40 rounded-lg text-sm font-medium transition-all duration-300 ${
                        isProcessing
                          ? "bg-gray-200 text-gray-500 cursor-wait"
                          : voucher.used
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                          : !voucher.claimed
                          ? "bg-orange-100 text-orange-600 hover:bg-orange-200"
                          : voucher.canUse
                          ? "bg-primary text-white hover:bg-primary-dark transform hover:-translate-y-0.5"
                          : "bg-gray-200 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      {isProcessing
                        ? "Processing..."
                        : voucher.used
                        ? "Already Used"
                        : !voucher.claimed
                        ? "Claim First"
                        : "Use Voucher"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FaTicketAlt className="mx-auto text-4xl text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">
              No vouchers available for this booking.
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Check back later for new offers!
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const handleNextStep = () => {
    setCurrentStep("payment");
  };

  const handleBackStep = () => {
    setCurrentStep("voucher");
  };

  const VoucherStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xl font-semibold">Apply Voucher (Optional)</h3>
        <button
          onClick={() => setShowVoucherModal(true)}
          className="text-primary max-w-40 hover:text-primary-dark flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <FaTicketAlt />
          Open Voucher List
        </button>
      </div>

      {couponCode && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaCheck className="text-green-500" />
            <div>
              <span className="font-medium">Voucher applied: {couponCode}</span>
              <p className="text-sm">Discount: ${discount.toFixed(2)}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setCouponCode("");
              setDiscount(0);
              setFinalPrice(price);
              setSuccessMessage("");
            }}
            className="text-green-600 max-w-10 hover:text-green-800 p-2 rounded-full hover:bg-green-100 transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="text-lg">
          <span className="text-gray-600">Total: </span>
          <span className="font-bold">${finalPrice.toFixed(2)}</span>
          {discount > 0 && (
            <span className="text-sm text-gray-500 line-through ml-2">
              ${price.toFixed(2)}
            </span>
          )}
        </div>
        <button
          onClick={handleNextStep}
          className="bg-primary max-w-56 text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors"
        >
          Continue to Payment
        </button>
      </div>
    </div>
  );

  const PaymentStep = () => {
    // Add state for card details
    const [cardDetails, setCardDetails] = useState({
      cardNumber: "",
      cardHolder: "",
      expiryDate: "",
      cvv: "",
    });

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-semibold">Select Payment Method</h3>
          <button
            onClick={handleBackStep}
            className="text-gray-600 max-w-32 hover:text-gray-800 flex items-center gap-2 text-sm"
          >
            <FaArrowLeft /> Back to Voucher
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              id: "card",
              label: "Credit/Debit Card",
              icon: FaCreditCard,
              color: "blue",
              description: "Pay securely with your card",
            },
            {
              id: "momo",
              label: "Momo Card Payment",
              icon: FaCreditCard,
              color: "purple",
              description: "Pay with ATM/Credit card via Momo",
            },
            {
              id: "payLater",
              label: "Pay at Property",
              icon: FaMoneyBillWave,
              color: "green",
              description: "Pay when you arrive",
            },
          ].map(({ id, label, icon: Icon, color, description }) => (
            <button
              key={id}
              onClick={() => {
                setPaymentMethod(id);
                if (id === "payLater") {
                  setSelectedOption("payLater");
                } else {
                  setSelectedOption("payNow");
                }
              }}
              className={`p-4 rounded-xl flex flex-col items-center text-center gap-2 transition-all ${
                paymentMethod === id
                  ? `border-2 border-${color}-500 bg-${color}-50 shadow-lg scale-105`
                  : "border border-gray-200 hover:border-gray-300"
              }`}
            >
              <Icon className={`text-${color}-500 text-2xl`} />
              <div>
                <span className="font-medium block">{label}</span>
                <span className="text-sm text-gray-600">{description}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Add Card Payment Form */}
        {paymentMethod === "card" && (
          <div className="mt-6 p-4 border border-gray-200 rounded-lg">
            <h4 className="text-lg font-medium mb-4">Enter Card Details</h4>
            <div className="space-y-4">
              {/* Card Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Card Number
                </label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  value={cardDetails.cardNumber}
                  onChange={(e) =>
                    setCardDetails({
                      ...cardDetails,
                      cardNumber: e.target.value
                        .replace(/\D/g, "")
                        .replace(/(\d{4})/g, "$1 ")
                        .trim(),
                    })
                  }
                  maxLength="19"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                />
              </div>

              {/* Card Holder */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Card Holder Name
                </label>
                <input
                  type="text"
                  placeholder="JOHN DOE"
                  value={cardDetails.cardHolder}
                  onChange={(e) =>
                    setCardDetails({
                      ...cardDetails,
                      cardHolder: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                />
              </div>

              {/* Expiry Date and CVV */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={cardDetails.expiryDate}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, "");
                      if (value.length >= 2) {
                        value = value.slice(0, 2) + "/" + value.slice(2, 4);
                      }
                      setCardDetails({
                        ...cardDetails,
                        expiryDate: value,
                      });
                    }}
                    maxLength="5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CVV
                  </label>
                  <input
                    type="password"
                    placeholder="123"
                    value={cardDetails.cvv}
                    onChange={(e) =>
                      setCardDetails({
                        ...cardDetails,
                        cvv: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    maxLength="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              {/* Card Icons */}
              <div className="flex gap-2 mt-2">
                <img src="/visa.svg" alt="Visa" className="h-8" />
                <img src="/mastercard.svg" alt="Mastercard" className="h-8" />
                {/* Add more card icons as needed */}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mt-6">
          <div className="text-lg">
            <span className="text-gray-600">Total to pay: </span>
            <span className="font-bold">${finalPrice.toFixed(2)}</span>
            {discount > 0 && (
              <span className="text-sm text-gray-500 line-through ml-2">
                ${price.toFixed(2)}
              </span>
            )}
          </div>
          <button
            onClick={() => handlePayment(cardDetails)}
            disabled={
              isProcessing ||
              (paymentMethod === "card" && !isCardDetailsValid(cardDetails))
            }
            className={`px-6 max-w-52 py-2 rounded-lg ${
              isProcessing ||
              (paymentMethod === "card" && !isCardDetailsValid(cardDetails))
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-primary text-white hover:bg-primary-dark"
            }`}
          >
            {isProcessing
              ? "Processing..."
              : paymentMethod === "payLater"
              ? "Confirm Booking"
              : "Confirm Payment"}
          </button>
        </div>
      </div>
    );
  };

  const isCardDetailsValid = (cardDetails) => {
    const { cardNumber, cardHolder, expiryDate, cvv } = cardDetails;
    
    if (!cardNumber || !cardHolder || !expiryDate || !cvv) {
      return false;
    }

    // Basic validation
    const cleanCardNumber = cardNumber.replace(/\s/g, "");
    if (cleanCardNumber.length !== 16) {
      return false;
    }

    if (cardHolder.trim().length < 3) {
      return false;
    }

    const [month, year] = expiryDate.split("/");
    if (!month || !year || month.length !== 2 || year.length !== 2) {
      return false;
    }

    if (cvv.length < 3 || cvv.length > 4) {
      return false;
    }

    return true;
  };

  const handlePayment = async (cardDetails) => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);
      setErrorMessage("");
      
      if (paymentMethod === "momo") {
        // For MoMo payments, call the momo-specific endpoint
        const response = await axios.post("/payment-options/momo", {
          bookingId,
          userId,
          amount: Math.round(finalPrice * 23000),
        }, {
          withCredentials: true
        });

        if (response.data.success && response.data.data) {
          // Redirect to MoMo payment page
          window.location.href = response.data.data;
          return;
        }
        throw new Error("Failed to get MoMo payment URL");
      }

      // Validate payment method selection
      if (!selectedOption) {
        throw new Error("Please select a payment option");
      }

      // Prepare base payload
      const basePayload = {
        bookingId,
        userId,
        amount: Math.round(finalPrice * 23000),
        selectedOption,
        ...(discount > 0 && {
          voucherCode: couponCode.toUpperCase(),
          discountAmount: discount,
        }),
      };

      // Handle different payment methods
      if (selectedOption === "payNow") {
        if (paymentMethod === "card") {
          if (!isCardDetailsValid(cardDetails)) {
            throw new Error("Please enter valid card details");
          }
          basePayload.paymentMethod = "card";
          basePayload.cardDetails = cardDetails;
        } else if (paymentMethod === "momo") {
          basePayload.paymentMethod = "momo";
        } else {
          throw new Error("Invalid payment method");
        }
      } else {
        basePayload.paymentMethod = "payLater";
      }

      const response = await axios.post("/payment-options", basePayload, {
        withCredentials: true,
      });

      if (response.data.success) {
        setSuccessMessage("Payment processed successfully!");
        setTimeout(() => {
          onClose({
            status: response.data.booking.paymentStatus,
            method: response.data.booking.paymentMethod,
            amount: response.data.booking.amount,
          });
        }, 1500);
      } else {
        throw new Error(response.data.message || "Payment failed");
      }
    } catch (error) {
      console.error("Payment Error:", error);
      setErrorMessage(
        error.response?.data?.message || 
        error.message || 
        "Payment processing failed. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Main Content */}
        {currentStep === "voucher" ? <VoucherStep /> : <PaymentStep />}

        {/* Messages */}
        {(errorMessage || successMessage) && (
          <div
            className={`mt-4 p-4 rounded-lg ${
              errorMessage
                ? "bg-red-50 text-red-600"
                : "bg-green-50 text-green-600"
            }`}
          >
            {errorMessage || successMessage}
          </div>
        )}

        {/* Cancel Button */}
        <button
          onClick={onClose}
          className="mt-4 w-full py-2 text-red-600 hover:text-red-700 font-medium"
        >
          Cancel
        </button>
      </div>

      {showVoucherModal && <VoucherModal />}
    </div>
  );
}

PaymentOptionsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  price: PropTypes.number.isRequired,
  bookingId: PropTypes.string.isRequired,
  userId: PropTypes.string.isRequired,
};