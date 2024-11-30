import "./YourHome.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function YourHome() {
  const center = [16.047079, 108.20623];
  const navigate = useNavigate();

  // Simulate an authentication state (replace this with your actual authentication logic)
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Here, you can add logic to check if the user is authenticated
    // For example, checking a token in local storage or calling an auth API
    const token = localStorage.getItem("authToken");
    const userLoggedIn = !!token;
    setIsLoggedIn(userLoggedIn);

    // Redirect to dashboard if user is already logged in
    if (userLoggedIn) {
      navigate("/host/hostdashboard");
    }
  }, [navigate]);

  // Function to handle navigation for setup button
  const handleSetupClick = () => {
    if (isLoggedIn) {
      navigate("/host/hostdashboard");
    } else {
      navigate("/host/login");
    }
  };

  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              Turn Your Space into <span className="text-primary">Income</span>
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Join thousands of hosts who are earning extra income by sharing
              their spaces on Booking-Hotel. Get started today with our easy
              setup process.
            </p>
            <button
              onClick={handleSetupClick}
              className="inline-flex items-center px-8 py-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transform hover:-translate-y-0.5 transition-all duration-300"
            >
              Start Hosting
              <svg
                className="ml-2 w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </button>
          </div>

          <div className="rounded-2xl shadow-2xl">
            <MapContainer
              center={center}
              zoom={12}
              className="h-[400px] w-full"
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={center}>
                <Popup>Your location</Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Host with Us?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Easy Setup",
                description: "Get step-by-step guidance to list your property",
                icon: "🏠",
              },
              {
                title: "Host Support",
                description:
                  "Connect with experienced Superhosts for mentorship",
                icon: "💪",
              },
              {
                title: "Smart Tools",
                description: "Access powerful tools to manage your listings",
                icon: "🛠",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-2xl p-6 text-center hover:shadow-lg transition-all duration-300"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Banner */}
      <div className="bg-gradient-to-r from-primary to-primary-dark text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-6">Ready to Start Hosting?</h2>
          <p className="text-xl mb-8">
            Join our community of successful hosts today
          </p>
          <Link
            to="/"
            className="inline-flex items-center px-8 py-4 bg-white text-primary font-semibold rounded-xl hover:bg-gray-100 transition-all duration-300"
          >
            Learn More
          </Link>
        </div>
      </div>
    </div>
  );
}
