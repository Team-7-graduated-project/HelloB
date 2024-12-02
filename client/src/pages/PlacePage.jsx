import { useEffect, useState, useContext, useCallback } from "react";
import { Navigate, useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import { format, addMonths } from "date-fns";
import BookingWidget from "../BookingWidget";
import PlaceGallery from "../PlaceGallery";
import AddressLink from "../AddressLink";
import "../App.css";
import ReportForm from "../components/ReportForm";
import {
  FaBath,
  FaBed,
  FaFlag,
  FaPersonBooth,
  FaUsers,
  FaTimes,
  FaStar,
  FaUser,
  FaClock,
  FaChevronUp,
  FaChevronDown,
  FaPaperPlane,
} from "react-icons/fa";
import { UserContext } from "../UserContext";
import FavoriteButton from "../components/FavoriteButton";
import { toast } from "react-hot-toast";

const messageBubbleStyle = `
  relative before:content-[''] before:absolute before:bottom-0 
  before:w-2 before:h-2 before:transform
`;

const leftBubbleStyle = `
  ${messageBubbleStyle}
  before:-left-1 before:bg-gray-100 
  before:rotate-45
`;

const rightBubbleStyle = `
  ${messageBubbleStyle}
  before:-right-1 before:bg-primary 
  before:rotate-45
`;

export default function PlacePage() {
  const { id } = useParams();
  const [place, setPlace] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [redirect] = useState(false);
  const navigate = useNavigate();
  const [similarPlaces, setSimilarPlaces] = useState([]);
  const [unavailableDates, setUnavailableDates] = useState([]);
  const [showAvailabilityCalendar, setShowAvailabilityCalendar] =
    useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const { user } = useContext(UserContext);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentChat, setCurrentChat] = useState(null);
  const [showHostInfo, setShowHostInfo] = useState(false);
  const [hostPlaces, setHostPlaces] = useState([]);
  const [socket, setSocket] = useState(null);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const INITIAL_REVIEWS_COUNT = 3; // Number of reviews to show initially
  const [typingUser, setTypingUser] = useState(null);

  const canReport = useCallback(() => {
    if (!user) return false;
    return user.role === "user"; // Only allow regular users to report
  }, [user]);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch place details
        const placeResponse = await axios.get(`/places/${id}`);

        setPlace(placeResponse.data);

        // Fetch reviews for the place
        const reviewsResponse = await axios.get(`/places/${id}/reviews`);
        setReviews(reviewsResponse.data);
      } catch {
        setError("Failed to load place details.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    if (!place) return;

    const fetchSimilarPlaces = async () => {
      try {
        const response = await axios.get(`/places/${id}/similar`);
        setSimilarPlaces(response.data);
      } catch (error) {
        console.error("Error fetching similar places:", error);
      }
    };

    fetchSimilarPlaces();
  }, [place, id]);

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!id) return;
      try {
        const response = await axios.get(`/places/${id}/availability`, {
          params: {
            start: format(new Date(), "yyyy-MM-dd"),
            end: format(addMonths(new Date(), 3), "yyyy-MM-dd"),
          },
        });
        setUnavailableDates(response.data);
      } catch (error) {
        console.error("Error fetching availability:", error);
      }
    };

    fetchAvailability();
  }, [id]);

  useEffect(() => {
    if (!place) return;

    const fetchHostPlaces = async () => {
      try {
        const response = await axios.get(`/places/${id}/host-places`);
        setHostPlaces(response.data);
      } catch (error) {
        console.error("Error fetching host places:", error);
      }
    };

    fetchHostPlaces();
  }, [place, id]);

  useEffect(() => {
    let ws;

    if (currentChat?._id && user?._id) {
      // Connect to WebSocket server
      ws = new WebSocket(
        `wss://hellob-be.onrender.com?userId=${user._id}&chatId=${currentChat._id}`
      );

      ws.onopen = () => {
        setSocket(ws);
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (message.type === "chat") {
          setMessages((prev) => [...prev, message.data]);
        } else if (message.type === "typing") {
          setTypingUser(message.data.isTyping ? message.data.userId : null);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      ws.onclose = () => {
        setSocket(null);
      };
    }

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [currentChat?._id, user?._id]);

  const formatDateRange = (startDate, endDate) => {
    return `${format(new Date(startDate), "MMM dd")} - ${format(
      new Date(endDate),
      "MMM dd, yyyy"
    )}`;
  };

  const renderOwnerSection = () => {
    if (!place?.owner) {
      return null;
    }

    // Check if current user is the owner
    const isOwner = user?._id === place.owner._id;
    // Check if user can contact (is user or admin, and not the owner)
    const canContact =
      user && (user.role === "user" || user.role === "admin") && !isOwner;

    const handleContactHost = (e) => {
      e.preventDefault();
      const subject = encodeURIComponent(`Inquiry about ${place.title}`);
      const body = encodeURIComponent(
        `Hello ${place.owner.name} (${place.owner.email}),\n\nI am interested in your property "${place.title}".\n\nBest regards`
      );

      window.open(
        `https://mail.google.com/mail/?view=cm&fs=1&to=${place.owner.email}&su=${subject}&body=${body}`,
        "_blank"
      );
    };

    const startChat = async () => {
      try {
        if (!user?._id || !place?.owner?._id) {
          toast.error("Please log in to start a chat");
          return;
        }

        const { data: chat } = await axios.post("/chats", {
          recipientId: place.owner._id.toString(),
        });

        setCurrentChat(chat);
        setMessages(chat.messages || []);
        setShowChat(true);
      } catch (error) {
        console.error("Failed to start chat:", error);
        toast.error("Failed to start chat");
      }
    };

    const sendMessage = async (e) => {
      e.preventDefault();
      const trimmedMessage = newMessage.trim();

      if (!trimmedMessage || !currentChat?._id || !user?._id) return;

      try {
        const { data: message } = await axios.post(
          `/chats/${currentChat._id}/messages`,
          {
            content: trimmedMessage,
          }
        );

        // Send through WebSocket if connected
        if (socket?.readyState === WebSocket.OPEN) {
          socket.send(
            JSON.stringify({
              type: "chat",
              data: {
                chatId: currentChat._id,
                content: trimmedMessage,
                sender: user._id,
                timestamp: new Date(),
              },
            })
          );
        }

        setMessages((prev) => [...prev, message]);
        setNewMessage("");
      } catch (error) {
        console.error("Failed to send message:", error);
        toast.error("Failed to send message");
      }
    };

    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mt-4">
        <h2 className="text-xl font-semibold mb-4">Meet Your Host</h2>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <img
              src={place.owner.photo || "https://via.placeholder.com/150"}
              alt={place.owner.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-primary"
              onError={(e) => {
                e.target.src = "https://via.placeholder.com/150";
              }}
            />
          </div>
          <div className="flex-grow">
            <h3 className="text-lg font-medium text-gray-900">
              {place.owner.name}
            </h3>
            <p className="text-gray-500 text-sm">
              Member since {new Date(place.owner.createdAt).getFullYear()}
            </p>
            {!user && (
              <div className="text-red-600 text-md">
                Please{" "}
                <Link
                  to="/login"
                  className="text-red-600 font-bold hover:underline"
                >
                  login
                </Link>{" "}
                to contact the host
              </div>
            )}
            {/* Only show "See More About Host" button if user is logged in */}
            {user && (
              <button
                onClick={() => setShowHostInfo(true)}
                className="text-primary hover:underline text-sm mt-2"
              >
                See More About Host
              </button>
            )}
          </div>
        </div>

        {/* Host Information Modal */}
        {showHostInfo && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
            <div className="bg-white w-[90%] max-w-6xl rounded-xl shadow-2xl relative z-[101] flex">
              {/* Left Section - Host Info */}
              <div className="w-1/3 p-6 border-r border-gray-200">
                <div className="sticky top-0">
                  <div className="flex flex-col items-center text-center mb-6">
                    <img
                      src={
                        place.owner.photo || "https://via.placeholder.com/150"
                      }
                      alt={place.owner.name}
                      className="w-32 h-32 rounded-full object-cover mb-4"
                    />
                    <h3 className="text-2xl font-semibold">
                      {place.owner.name}
                    </h3>
                    <p className="text-gray-500 mt-1">
                      Member since{" "}
                      {new Date(place.owner.createdAt).getFullYear()}
                    </p>
                    {place.owner.languages && (
                      <p className="text-gray-600 mt-2">
                        Speaks: {place.owner.languages.join(", ")}
                      </p>
                    )}

                    {/* Contact Buttons - Only show if user can contact */}
                    {canContact && (
                      <div className="flex flex-col gap-3 w-full mt-6">
                        <button
                          onClick={handleContactHost}
                          className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                        >
                          Contact Host
                        </button>
                        <button
                          onClick={() => startChat()}
                          className="w-full px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
                        >
                          Start Chat
                        </button>
                      </div>
                    )}

                    {/* Message for hosts trying to contact themselves */}
                    {isOwner && (
                      <p className="text-gray-500 mt-4 italic">
                        This is your listing
                      </p>
                    )}

                    {/* Message for non-users */}
                    {!user && (
                      <p className="text-gray-500 mt-4">
                        Please{" "}
                        <Link
                          to="/login"
                          className="text-primary hover:underline"
                        >
                          login
                        </Link>{" "}
                        to contact the host
                      </p>
                    )}
                  </div>

                  {/* Close button */}
                  <button
                    onClick={() => setShowHostInfo(false)}
                    className="absolute  top-4 max-w-10 right-4 text-gray-500 hover:text-gray-700"
                  >
                    <FaTimes size={20} />
                  </button>
                </div>
              </div>

              {/* Right Section - Host's Listings */}
              <div className="w-2/3 p-6 max-h-[80vh] overflow-y-auto">
                <h4 className="text-xl font-medium mb-6">
                  More places hosted by {place.owner.name}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {hostPlaces.map((hostPlace) => (
                    <Link
                      key={hostPlace._id}
                      to={`/place/${hostPlace._id}`}
                      onClick={() => {
                        setShowHostInfo(false);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="block group hover:bg-gray-50 rounded-lg p-4 transition-colors border border-gray-100 hover:border-primary"
                    >
                      <div className="flex gap-4">
                        <div className="w-32 h-24 flex-shrink-0">
                          <img
                            src={hostPlace.photos[0]}
                            alt={hostPlace.title}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                        <div className="flex-grow">
                          <h5 className="font-medium text-gray-900 group-hover:text-primary mb-1 line-clamp-1">
                            {hostPlace.title}
                          </h5>
                          <p className="text-sm text-gray-500 line-clamp-1 mb-2">
                            {hostPlace.address}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <span className="text-primary font-medium">
                                ${hostPlace.price}
                              </span>
                              <span className="text-gray-500 text-sm ml-1">
                                /night
                              </span>
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <svg
                                className="h-4 w-4 text-yellow-400 mr-1"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              {hostPlace.reviews?.length || 0} reviews
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {hostPlaces.length === 0 && (
                  <p className="text-gray-500 text-center">
                    No other listings from this host yet.
                  </p>
                )}
              </div>

              {/* Separate Chat Modal */}
              {showChat && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110]">
                  <div className="bg-white rounded-xl p-4 w-full max-w-md relative z-[111] h-[600px] flex flex-col">
                    {/* Chat Header */}
                    <div className="flex justify-between items-center pb-4 border-b">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden">
                          <img
                            src={place.owner.photo || "/default-avatar.png"}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold">{place.owner.name}</h3>
                          <p className="text-sm text-gray-500">
                            Usually responds within 1 hour
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowChat(false)}
                        className="p-2 hover:bg-gray-10 max-w-10 rounded-full transition-colors"
                      >
                        <FaTimes className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>

                    {/* Messages Container */}
                    <div className="flex-grow overflow-y-auto py-4 px-2 space-y-4">
                      {messages.map((msg, i) => (
                        <div
                          key={i}
                          className={`flex items-end gap-2 ${
                            msg.sender === user._id
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          {msg.sender !== user._id && (
                            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                              <img
                                src={place.owner.photo || "/default-avatar.png"}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}

                          <div
                            className={`max-w-[70%] p-3 rounded-2xl ${
                              msg.sender === user._id
                                ? `${rightBubbleStyle} bg-primary text-white`
                                : `${leftBubbleStyle} bg-gray-100`
                            }`}
                          >
                            <p className="break-words">{msg.content}</p>
                            <div
                              className={`text-xs mt-1 ${
                                msg.sender === user._id
                                  ? "text-white/70"
                                  : "text-gray-500"
                              }`}
                            >
                              {format(new Date(msg.timestamp), "h:mm a")}
                            </div>
                             <div
                              className={`text-xs ${
                                msg.sender === user?._id
                                  ? "text-white/70"
                                  : "text-gray-500"
                              }`}
                            >
                              {format(new Date(msg.timestamp), "MMMM d, yyyy")}{" "}
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Typing Indicator */}
                      {typingUser && typingUser !== user._id && (
                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                          <div className="w-8 h-8 rounded-full overflow-hidden">
                            <img
                              src={place.owner.photo || "/default-avatar.png"}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="bg-gray-100 p-3 rounded-xl">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Message Input */}
                    <form
                      onSubmit={sendMessage}
                      className="pt-4 border-t mt-auto"
                    >
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => {
                            setNewMessage(e.target.value);
                            // Add typing indicator logic here if needed
                            if (socket?.readyState === WebSocket.OPEN) {
                              socket.send(
                                JSON.stringify({
                                  type: "typing",
                                  data: {
                                    chatId: currentChat._id,
                                    userId: user._id,
                                    isTyping: true,
                                  },
                                })
                              );
                            }
                          }}
                          placeholder="Type your message..."
                          className="flex-grow p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        <button
                          type="submit"
                          disabled={!newMessage.trim()}
                          className={`px-6 max-w-16 py-3 rounded-xl  flex items-center gap-2 transition-all
                            ${
                              newMessage.trim()
                                ? "bg-primary text-white hover:bg-primary-dark"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            }`}
                        >
                          <FaPaperPlane className="w-4 h-4" />
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAvailabilitySection = () => (
    <div className="bg-white rounded-lg shadow-lg p-6 mt-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Availability</h2>
        <button
          onClick={() => setShowAvailabilityCalendar(!showAvailabilityCalendar)}
          className="flex items-center max-w-36 gap-2 text-primary hover:text-primary-dark transition-colors text-sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
              clipRule="evenodd"
            />
          </svg>
          {showAvailabilityCalendar ? "Hide Calendar" : "Show Calendar"}
        </button>
      </div>

      {showAvailabilityCalendar && (
        <div className="space-y-4">
          {!selectedDate && unavailableDates.length > 0 && (
            <>
              <div className="text-red-600 font-medium mb-2 text-sm">
                These dates are already booked:
              </div>
              <div className="grid grid-cols-1 gap-2">
                {unavailableDates.map((booking, index) => (
                  <div
                    key={index}
                    className="bg-red-50 text-red-700 px-3 py-2 rounded-md text-sm"
                  >
                    {formatDateRange(booking.check_in, booking.check_out)}
                  </div>
                ))}
              </div>
            </>
          )}

          {selectedDate && (
            <div className="text-green-600 text-sm bg-green-50 p-3 rounded-lg">
              ✓ Selected dates are available for booking!
            </div>
          )}

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2 text-sm">
              Booking Information:
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-primary"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z"
                    clipRule="evenodd"
                  />
                </svg>
                Check-in after {place?.check_in_time || "3:00 PM"}
              </li>
              <li className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-primary"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z"
                    clipRule="evenodd"
                  />
                </svg>
                Check-out before {place?.check_out_time || "11:00 AM"}
              </li>
              {place?.minimum_stay && (
                <li className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-primary"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Minimum stay: {place.minimum_stay} nights
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Availability Summary */}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!place) return null;
  if (redirect) {
    return <Navigate to="/" />;
  }

  // Calculate the average rating
  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, review) => sum + review.rating, 0) /
          reviews.length
        ).toFixed(1)
      : 0;

  const totalReviews = reviews.length;

  // Helper function to render perks with descriptions
  const renderPerks = () => {
    return place.perks.map((perk) => (
      <div
        key={perk}
        className="flex items-center gap-2 p-2 border rounded-lg hover:bg-gray-50"
      >
        <span className="text-xl">{getIconForPerk(perk)}</span>
        <div>
          <div className="font-medium">{formatPerkName(perk)}</div>
          {place.amenities_description?.[perk] && (
            <div className="text-sm text-gray-500">
              {place.amenities_description[perk]}
            </div>
          )}
        </div>
      </div>
    ));
  };

  // Helper function to format perk names
  const formatPerkName = (perk) => {
    return perk
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Helper function to get icon for perk
  const getIconForPerk = (perk) => {
    const icons = {
      wifi: "📶",
      tv: "📺",
      kitchen: "🍳",
      "air-conditioning": "❄️",
      heating: "🔥",
      washer: "🧺",
      dryer: "👕",
      "free parking spot": "🅿️",
      pool: "🏊‍♂️",
      gym: "💪",
      "hot-tub": "🛀",
      pets: "🐾",
      entrance: "🚪",
      "security-cameras": "📷",
      workspace: "💻",
      breakfast: "🍳",
      fireplace: "🔥",
      balcony: "🏠",
      garden: "🌳",
      "beach-access": "🏖️",
      smoking: "🚬",
      "first-aid": "🏥",
      "fire-extinguisher": "🧯",
      elevator: "🛗",
    };
    return icons[perk] || "✓";
  };

  return (
    <div className="bg-gray-50  min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-blue-600 hover:text-blue-800 transition-colors mb-6"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Back
        </button>

        {/* Header Section */}
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {place.title}
            </h1>
            <FavoriteButton
              placeId={place._id}
              className="p-2 max-w-9 rounded-full"
            />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <AddressLink>{place.address}</AddressLink>
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">
              {formatPerkName(place.property_type)}
            </span>
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="ml-1 text-gray-600">
                {averageRating} · {totalReviews} reviews
              </span>
            </div>
          </div>
        </div>

        {/* Gallery */}
        <PlaceGallery place={place} />

        {/* Main Content */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="md:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">About this place</h2>
              <p className="text-gray-700 whitespace-pre-line">
                {place.description}
              </p>
            </div>

            {/* Key Details */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">Place details</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-300 rounded-lg">
                  <div className="font-semibold flex items-center justify-center gap-2 text-lg">
                    {place.max_guests} <FaUsers />
                  </div>
                  <div className="text-gray-600">Guests</div>
                </div>
                <div className="text-center p-4 bg-gray-300 rounded-lg">
                  <div className="font-semibold flex items-center justify-center gap-2 text-lg">
                    {place.bedrooms} <FaPersonBooth />
                  </div>
                  <div className="text-gray-600">Bedrooms </div>
                </div>
                <div className="text-center p-4 bg-gray-300 rounded-lg">
                  <div className="font-semibold flex items-center justify-center gap-2 text-lg">
                    {place.beds} <FaBed />
                  </div>
                  <div className="text-gray-600">Beds</div>
                </div>
                <div className="text-center p-4 bg-gray-300 rounded-lg">
                  <div className="font-semibold  flex items-center justify-center gap-2 text-lg">
                    {" "}
                    {place.bathrooms} <FaBath />
                  </div>
                  <div className="text-gray-600 ">Bathrooms</div>
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">
                What this place offers
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderPerks()}
              </div>
            </div>

            {/* House Rules */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">House rules</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="text-gray-600">Check-in</div>
                  <div className="font-medium">{place.check_in}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-gray-600">Check-out</div>
                  <div className="font-medium">{place.check_out}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-gray-600">Minimum stay</div>
                  <div className="font-medium">{place.minimum_stay} nights</div>
                </div>
                <ul className="list-disc pl-5 space-y-2">
                  {place.house_rules.map((rule, index) => (
                    <li key={index} className="text-gray-700">
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Cancellation Policy */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">
                Cancellation policy
              </h2>
              <p className="text-gray-700 capitalize">
                {place.cancellation_policy}
              </p>
              {place.extra_info && (
                <div className="mt-4 text-gray-600">
                  <h3 className="font-medium mb-2">Additional information</h3>
                  <p>{place.extra_info}</p>
                </div>
              )}
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">Guest Reviews</h2>
                {reviews.length > 0 && (
                  <div className="flex items-center gap-2">
                    <FaStar className="text-yellow-400" />
                    <span className="font-bold text-lg">{averageRating}</span>
                    <span className="text-gray-600">
                      · {totalReviews} reviews
                    </span>
                  </div>
                )}
              </div>

              {reviews.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500 mb-2">No reviews yet</div>
                  <button
                    onClick={() => navigate(`/place/${id}`)}
                    className="text-primary max-w-fit hover:text-primary-dark transition-colors"
                  >
                    Be the first to review
                  </button>
                </div>
              ) : (
                <>
                  {/* Reviews List */}
                  <div className="space-y-6">
                    {(showAllReviews
                      ? reviews
                      : reviews.slice(0, INITIAL_REVIEWS_COUNT)
                    ).map((review) => (
                      <div
                        key={review._id}
                        className="border-b border-gray-100 last:border-0 pb-6 last:pb-0"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-4">
                            {review.user?.photo ? (
                              <img
                                src={review.user.photo}
                                alt={review.user.name}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                <FaUser className="text-gray-500 text-xl" />
                              </div>
                            )}
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {review.user?.name || "Anonymous"}
                              </h3>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <FaClock className="text-gray-400" />
                                {new Date(review.createdAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  }
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center bg-primary/10 px-3 py-1 rounded-full">
                            <FaStar className="text-primary mr-1" />
                            <span className="font-medium text-primary">
                              {Number(review.rating).toFixed(1)}
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                          {review.review_text}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Show More Button */}
                  {reviews.length > INITIAL_REVIEWS_COUNT && (
                    <div className="mt-6 text-center">
                      <button
                        onClick={() => setShowAllReviews(!showAllReviews)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors duration-200 font-medium text-gray-700"
                      >
                        {showAllReviews ? (
                          <>
                            Show Less
                            <FaChevronUp className="text-gray-500" />
                          </>
                        ) : (
                          <>
                            Show All Reviews ({reviews.length})
                            <FaChevronDown className="text-gray-500" />
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right Column - Booking Widget and Availability */}
          <div className="md:col-span-1">
            <div className="sticky top-8 space-y-4">
              <BookingWidget
                place={place}
                minimumStay={place?.minimum_stay}
                unavailableDates={unavailableDates}
                onDateSelect={setSelectedDate}
                selectedDate={selectedDate}
              />
              {renderAvailabilitySection()}
              {renderOwnerSection()}
            </div>
          </div>
        </div>

        {similarPlaces.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-semibold mb-6">
              Similar Places You May Like
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {similarPlaces.map((place) => (
                <Link
                  key={place._id}
                  to={`/place/${place._id}`}
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="block group"
                >
                  <div className="relative aspect-w-16 aspect-h-9 mb-2 overflow-hidden rounded-lg">
                    <img
                      src={place.photos[0]}
                      alt={place.title}
                      className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-lg text-sm font-medium">
                      ${place.price} / night
                    </div>
                  </div>
                  <h3 className="font-medium text-gray-900 group-hover:text-blue-600">
                    {place.title}
                  </h3>
                  <div className="text-sm text-gray-500">{place.address}</div>
                  <div className="flex items-center mt-1">
                    <svg
                      className="h-4 w-4 text-yellow-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="ml-1 text-sm text-gray-600">
                      {place.rating} · {place.reviews?.length || 0} reviews
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Add Report Button */}
        <div className="mt-4 border-t pt-4">
          {canReport() ? (
            <button
              onClick={() => setShowReportForm(true)}
              className="flex items-center gap-2 text-gray-600 hover:text-red-500"
            >
              <FaFlag />
              Report this listing
            </button>
          ) : (
            user && (
              <div className="text-red-600 font-bold italic">
                Only registered users can report listings
              </div>
            )
          )}
        </div>

        {/* Report Form Modal */}
        {showReportForm && canReport() && (
          <ReportForm
            placeId={id}
            onClose={() => setShowReportForm(false)}
            className="z-[70]"
          />
        )}
      </div>
    </div>
  );
}
