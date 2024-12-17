import PropTypes from "prop-types";
import { useContext, useEffect, useState, useCallback } from "react";
import { differenceInCalendarDays, format } from "date-fns";
import axios from "axios";
import { Link, Navigate } from "react-router-dom";
import { UserContext } from "./UserContext";

export default function BookingWidget({ place }) {
  const [check_in, setCheckIn] = useState("");
  const [check_out, setCheckOut] = useState("");
  const [max_guests, setMaxGuests] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [redirect, setRedirect] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { user } = useContext(UserContext);
  const [unavailableDates, setUnavailableDates] = useState([]);
  const [hasValidDates, setHasValidDates] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone);
    }
  }, [user]);

  let numberOfNights = 0;
  if (check_in && check_out) {
    numberOfNights = differenceInCalendarDays(
      new Date(check_out),
      new Date(check_in)
    );
    if (numberOfNights < 0) {
      numberOfNights = 0;
    }
  }

  async function bookThisPlace() {
    if (!isFormValid()) {
      if (isDateUnavailable(check_in) || isDateUnavailable(check_out)) {
        setErrorMessage("Selected dates are not available");
      } else {
        setErrorMessage("Please fill in all required fields correctly");
      }
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post("/bookings", {
        check_in,
        check_out,
        name,
        phone,
        place: place._id,
        price: numberOfNights * place.price,
        max_guests,
      });

      const bookingId = response.data._id;
      setRedirect(`/account/bookings/${bookingId}`);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          "There was an error with your booking. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const isFormValid = () => {
    if (isDateUnavailable(check_in) || isDateUnavailable(check_out)) {
      return false;
    }

    if (check_in && check_out && new Date(check_out) <= new Date(check_in)) {
      return false;
    }

    return (
      check_in &&
      check_out &&
      numberOfNights > 0 &&
      name &&
      phone &&
      max_guests > 0 &&
      max_guests <= place.max_guests
    );
  };

  useEffect(() => {
    if (check_in && check_out && new Date(check_out) <= new Date(check_in)) {
      setErrorMessage("Check-out date must be after check-in date.");
    } else {
      setErrorMessage("");
    }
  }, [check_in, check_out]);

  const fetchUnavailableDates = useCallback(async () => {
    try {
      const response = await axios.get(`/bookings/unavailable-dates/${place._id}`);
      
      if (Array.isArray(response.data)) {
        const bookedDates = response.data.map((booking) => ({
          check_in: new Date(booking.check_in),
          check_out: new Date(booking.check_out),
        }));
        setUnavailableDates(bookedDates);
      } else {
        console.error("Invalid response format:", response.data);
        setUnavailableDates([]);
      }
    } catch (error) {
      console.error("Error fetching unavailable dates:", error);
      // Don't show error to user, just set empty array
      setUnavailableDates([]);
    }
  }, [place._id]);

  useEffect(() => {
    fetchUnavailableDates();
  }, [fetchUnavailableDates]);

  const isDateUnavailable = (date) => {
    if (!date) return false;

    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0); // Normalize time part

    return unavailableDates.some((booking) => {
      const startDate = new Date(booking.check_in);
      const endDate = new Date(booking.check_out);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);

      return checkDate >= startDate && checkDate <= endDate;
    });
  };

  const handleCheckInChange = (ev) => {
    const date = ev.target.value;
    if (isDateUnavailable(date)) {
      setErrorMessage("This date is not available");
      setHasValidDates(false);
    } else {
      setCheckIn(date);
      setErrorMessage("");
      setHasValidDates(date && check_out && !isDateUnavailable(check_out));
    }
  };

  const handleCheckOutChange = (ev) => {
    const date = ev.target.value;
    if (isDateUnavailable(date)) {
      setErrorMessage("This date is not available");
      setHasValidDates(false);
    } else if (check_in && new Date(date) <= new Date(check_in)) {
      setErrorMessage("Check-out date must be after check-in date");
      setHasValidDates(false);
    } else {
      setCheckOut(date);
      setErrorMessage("");
      setHasValidDates(check_in && date && !isDateUnavailable(check_in));
    }
  };

  const isBookingAllowed = () => {
    if (!user) return false;

    if (user.role === "admin" || user.role === "host") return false;

    if (place.owner?._id === user._id) return false;

    return true;
  };

  if (redirect) {
    return <Navigate to={redirect} />;
  }

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6">
      {/* Price Display */}
      <div className="mb-6">
        <div className="text-3xl font-bold text-center mb-2">
          ${place.price}
          <span className="text-lg font-normal text-gray-500"> / night</span>
        </div>
        {numberOfNights > 0 && (
          <div className="text-center text-gray-600">
            Total for {numberOfNights} nights: ${numberOfNights * place.price}
          </div>
        )}
      </div>

      {!user ? (
        <div className="bg-gray-50 p-4 rounded-xl text-center mb-6">
          <p className="text-gray-600 mb-4">Sign in to book this place</p>
          <div className="space-x-4">
            <Link
              to="/login"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="inline-block px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              Login
            </Link>
            <Link
              to="/register"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="inline-block px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Register
            </Link>
          </div>
        </div>
      ) : !isBookingAllowed() ? (
        <div className="bg-gray-50 p-4 rounded-xl text-center">
          {place.owner?._id === user._id ? (
            <div>
              <p className="text-red-600 font-bold">This is your property</p>
              <p className="text-gray-700 italic">
                You cannot make a booking on your own property
              </p>
            </div>
          ) : (
            <div>
              <p className="text-red-600 font-bold">
                {user.role === "admin" ? "Administrators" : "Hosts"} cannot make
                bookings
              </p>
              <p className="text-gray-700 italic">
                If you wanna booking this place, please contact the host
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Dates Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Check-in
              </label>
              <input
                type="date"
                value={check_in}
                onChange={handleCheckInChange}
                min={format(new Date(), "yyyy-MM-dd")}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent
                  ${isDateUnavailable(check_in) 
                    ? "border-red-500 bg-red-50" 
                    : "border-gray-300"}`}
              />
              {isDateUnavailable(check_in) && (
                <p className="text-red-500 text-sm mt-1">This date is not available</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Check-out
              </label>
              <input
                type="date"
                value={check_out}
                onChange={handleCheckOutChange}
                min={check_in || format(new Date(), "yyyy-MM-dd")}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent
                  ${isDateUnavailable(check_out) 
                    ? "border-red-500 bg-red-50" 
                    : "border-gray-300"}`}
              />
              {isDateUnavailable(check_out) && (
                <p className="text-red-500 text-sm mt-1">This date is not available</p>
              )}
            </div>
          </div>

          {/* Only show unavailable dates if no valid dates are selected */}
          {!hasValidDates && unavailableDates.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                You couldn&apos;t book these dates:
              </h3>
              <div className="text-sm text-gray-500">
                {unavailableDates.map((booking, index) => (
                  <div key={index} className="mb-1">
                    {format(new Date(booking.check_in), "MMM dd, yyyy")} -{" "}
                    {format(new Date(booking.check_out), "MMM dd, yyyy")}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Guests Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Guests
            </label>
            <select
              value={max_guests}
              onChange={(ev) => setMaxGuests(parseInt(ev.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {[...Array(place.max_guests)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1} {i === 0 ? "guest" : "guests"}
                </option>
              ))}
            </select>
          </div>

          {numberOfNights > 0 && (
            <>
              {/* Personal Information */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(ev) => setName(ev.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    maxLength="10"
                    onChange={(ev) => {
                      const value = ev.target.value.replace(/\D/g, "");
                      setPhone(value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    ${place.price} × {numberOfNights} nights
                  </span>
                  <span>${place.price * numberOfNights}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>${place.price * numberOfNights}</span>
                </div>
              </div>
            </>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg text-center">
              {errorMessage}
            </div>
          )}

          {/* Book Button */}
          <button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
              bookThisPlace();
            }}
            disabled={!isFormValid() || loading || isDateUnavailable(check_in) || isDateUnavailable(check_out)}
            className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors ${
              isFormValid() && !loading && !isDateUnavailable(check_in) && !isDateUnavailable(check_out)
                ? "bg-primary hover:bg-primary-dark"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing...
              </div>
            ) : isDateUnavailable(check_in) || isDateUnavailable(check_out) ? (
              "Selected dates are not available"
            ) : (
              `Book Now ${numberOfNights > 0 ? `• $${numberOfNights * place.price}` : ""}`
            )}
          </button>
        </div>
      )}
    </div>
  );
}

BookingWidget.propTypes = {
  place: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    max_guests: PropTypes.number.isRequired,
    owner: PropTypes.shape({
      _id: PropTypes.string.isRequired,
    }),
  }).isRequired,
};
