import { useEffect, useState, useContext } from "react";
import axios from "axios";
import {
  FaArrowLeft,
  FaTicketAlt,
  FaClock,
  FaUsers,
  FaTimes,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { UserContext } from "../UserContext";

export default function VoucherListPage() {
  const { user } = useContext(UserContext);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [claimingVoucher, setClaimingVoucher] = useState(null);
  const [filter] = useState("available"); // 'available' or 'claimed'
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      const response = await axios.get("/vouchers", {
        withCredentials: true,
      });
      setVouchers(response.data);
    } catch (error) {
      console.error("Error fetching vouchers:", error);
      setError("Failed to load vouchers");
    } finally {
      setLoading(false);
    }
  };

  const handleClaimVoucher = async (voucherId) => {
    if (!user) {
      setAlert({
        show: true,
        type: "error",
        message: "Please login to claim vouchers",
      });
      return;
    }

    const voucher = vouchers.find((v) => v._id === voucherId);
    if (
      voucher.claims?.some((claim) => {
        const claimUserId = claim.userId?._id || claim.userId;
        return claimUserId?.toString() === user.id?.toString();
      })
    ) {
      setAlert({
        show: true,
        type: "error",
        message: "You have already claimed this voucher!",
      });
      return;
    }

    setClaimingVoucher(voucherId);
    try {
      const response = await axios.post(
        `/vouchers/${voucherId}/claim`,
        {},
        { withCredentials: true }
      );

      if (response.data.success) {
        setVouchers((prevVouchers) =>
          prevVouchers.map((voucher) =>
            voucher._id === voucherId
              ? {
                  ...voucher,
                  claims: [...(voucher.claims || []), { userId: user.id }],
                }
              : voucher
          )
        );
        setAlert({
          show: true,
          type: "success",
          message: "Voucher claimed successfully! Check your voucher list.",
        });
      }
    } catch (error) {
      setAlert({
        show: true,
        type: "error",
        message:
          error.response?.data?.error ||
          "Failed to claim voucher. Please try again later.",
      });
    } finally {
      setClaimingVoucher(null);
      setTimeout(() => {
        setAlert({ show: false, type: "", message: "" });
      }, 5000);
    }
  };

  const isVoucherClaimable = (voucher) => {
    if (!user) return false;
    if (!voucher.active) return false;
    if (new Date(voucher.expirationDate) < new Date()) return false;
    if (voucher.usedCount >= (voucher.usageLimit || 100)) return false;
    return !voucher.claims?.some((claim) => claim.userId === user.id);
  };

  const getVoucherStatus = (voucher) => {
    const claimsCount = voucher.claims?.length || 0;
    const remainingClaims = voucher.usageLimit - claimsCount;
    const expirationDate = new Date(voucher.expirationDate);
    const daysLeft = Math.ceil(
      (expirationDate - new Date()) / (1000 * 60 * 60 * 24)
    );

    const isClaimed =
      user &&
      voucher.claims?.some((claim) => {
        const claimUserId = claim.userId?._id || claim.userId;
        const currentUserId = user.id;
        return claimUserId?.toString() === currentUserId?.toString();
      });

    return {
      claimsCount,
      remainingClaims,
      daysLeft,
      isExpired: expirationDate < new Date(),
      isClaimed,
    };
  };

  const filteredVouchers = vouchers.filter((voucher) => {
    const isClaimed =
      user &&
      voucher.claims?.some(
        (claim) =>
          claim.userId?._id?.toString() === user.id?.toString() ||
          claim.userId?.toString() === user.id?.toString()
      );

    const isExpired = new Date(voucher.expirationDate) < new Date();

    return !isExpired && (filter === "claimed" ? isClaimed : !isClaimed);
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      {alert.show && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md transform transition-all duration-500 ${
            alert.type === "error"
              ? "bg-red-50 border-l-4 border-red-500 text-red-700"
              : "bg-green-50 border-l-4 border-green-500 text-green-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {alert.type === "error" ? (
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              <p className="text-sm font-medium">{alert.message}</p>
            </div>
            <button
              onClick={() => setAlert({ show: false, type: "", message: "" })}
              className="ml-4 max-w-10 text-gray-400 hover:text-gray-600"
            >
              <FaTimes size={20} />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <Link
          onClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          to="/"
          className="flex items-center text-primary hover:text-primary-dark transition-colors"
        >
          <FaArrowLeft className="mr-3" />
          <h1 className="text-3xl font-bold">Vouchers</h1>
        </Link>
      </div>

      {/* Error and Loading states */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
        </div>
      ) : filteredVouchers.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredVouchers.map((voucher) => {
            const status = getVoucherStatus(voucher);

            return (
              <div
                key={voucher._id}
                className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden h-full flex flex-col"
              >
                <div className="bg-gradient-to-r from-primary to-primary-dark text-white p-6 relative">
                  <div className="text-2xl font-bold mb-2">{voucher.code}</div>
                  <div className="absolute top-4 right-4 bg-yellow-400 text-primary px-4 py-2 rounded-full text-lg font-bold transform rotate-3 shadow-lg">
                    {voucher.discount}% OFF
                  </div>
                </div>

                <div className="p-6 space-y-4 flex-grow flex flex-col justify-between">
                  <div className="space-y-4">
                    <p className="text-gray-600 leading-relaxed">
                      {voucher.description}
                    </p>

                    {/* Status Information */}
                    <div className="grid grid-cols-2 gap-4 py-4">
                      <div className="flex items-center gap-2">
                        <FaUsers className="text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {status.remainingClaims} remaining
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaClock className="text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {status.isExpired
                            ? "Expired"
                            : `${status.daysLeft} days left`}
                        </span>
                      </div>
                    </div>

                    {/* Applicable Places */}
                    {voucher.applicablePlaces?.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="font-semibold text-gray-800">
                          Valid for:
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {voucher.applicablePlaces.map((place) => (
                            <span
                              key={place._id}
                              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                            >
                              {place.title}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="mt-6">
                    {filter === "claimed" ? (
                      <button
                        className="w-full py-3 rounded-xl font-semibold text-white bg-green-500"
                        disabled
                      >
                        Claimed ✓
                      </button>
                    ) : !user ? (
                      <Link
                        to="/login"
                        onClick={() => {
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="block w-full py-3 rounded-xl font-semibold text-white bg-primary hover:bg-primary-dark transition-all duration-300 text-center"
                      >
                        Login to Claim
                      </Link>
                    ) : !isVoucherClaimable(voucher) ? (
                      <button
                        disabled
                        className="w-full py-3 rounded-xl font-semibold text-white bg-gray-400"
                      >
                        Not Available
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          window.scrollTo({ top: 0, behavior: "smooth" });
                          handleClaimVoucher(voucher._id);
                        }}
                        disabled={claimingVoucher === voucher._id}
                        className={`w-full py-3 rounded-xl font-semibold text-white transition-all duration-300
                          ${
                            claimingVoucher === voucher._id
                              ? "bg-gray-400"
                              : "bg-primary hover:bg-primary-dark transform hover:-translate-y-0.5"
                          }`}
                      >
                        {claimingVoucher === voucher._id
                          ? "Claiming..."
                          : "Claim Now"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl shadow-md">
          <FaTicketAlt className="w-16 h-16 mx-auto mb-6 text-gray-300" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            {filter === "claimed"
              ? "No Claimed Vouchers"
              : "No Vouchers Available"}
          </h3>
          <p className="text-gray-500">
            {filter === "claimed"
              ? "You haven't claimed any vouchers yet"
              : "Check back later for new offers!"}
          </p>
        </div>
      )}
    </div>
  );
}
