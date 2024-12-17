import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { TextInput } from "../TextInput";
import "../App.css";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import TermsModal from "../components/TermsModal";
import PrivacyModal from "../components/PrivacyModal";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  const validateUsername = (name) => {
    return /^[a-zA-Z0-9_\s]{4,20}$/.test(name);
  };
  const validatePhone = (phone) => {
    const cleanPhone = phone.replace(/\D/g, "");
    return /^\d{10}$/.test(cleanPhone);
  };
  const validatePassword = (password) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
      password
    );
  };
  function validateForm() {
    const newErrors = {};
    if (!name) {
      newErrors.name = "Name is required";
    } else if (name.length < 4 || name.length > 20) {
      newErrors.name = "Name must be between 4 and 20 characters";
    } else if (!validateUsername(name)) {
      newErrors.name =
        "Name can only contain letters, numbers, and underscores";
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email =
        "Enter a valid email with a complete domain (e.g., example@gmail.com)";
    }
    if (!password) {
      newErrors.password = "Password is required";
    } else if (!validatePassword(password)) {
      newErrors.password =
        "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)";
    }

    // Confirm Password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    const cleanPhone = phone.replace(/\D/g, "");
    if (!phone || !validatePhone(cleanPhone)) {
      newErrors.phone = "Phone number must be exactly 10 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const handleNameChange = (ev) => {
    const value = ev.target.value.replace(/[^a-zA-Z0-9_\s]/g, "");
    setName(value);
  };

  async function registerUser(ev) {
    ev.preventDefault();
    if (!validateForm()) return;

    try {
      await axios.post("/register", {
        name,
        email,
        password,
        confirmPassword,
        phone,
      });
      setSuccessMessage("Registration successful");
      setErrorMessage("");
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setPhone("");
      setErrors({});

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      if (error.response && error.response.data) {
        // Check if backend provided specific error messages
        const serverErrors = error.response.data.error;
        if (typeof serverErrors === "string") {
          setErrorMessage(serverErrors); // General error
        } else {
          setErrors(serverErrors); // Field-specific errors if returned as an object
        }
      } else {
        setErrorMessage("Registration failed. Please try again.");
      }
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      await axios.post("/auth/google", credentialResponse, {
        withCredentials: true,
      });
      setSuccessMessage("Registration successful");
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setPhone("");

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.error || "Google registration failed"
      );
    }
  };

  const handleTermsClick = (e) => {
    e.preventDefault();
    setIsTermsOpen(true);
  };

  const handlePrivacyClick = (e) => {
    e.preventDefault();
    setIsPrivacyOpen(true);
  };

  // Add disabled button state calculation
  const isFormComplete = () => {
    return (
      name &&
      email &&
      password &&
      confirmPassword &&
      phone &&
      acceptedTerms &&
      phone.length === 10
    );
  };

  return (
    <>
      <div className="mt-4 grow flex items-center justify-center">
        <div className="w-full max-w-md mx-auto px-4 py-6">
          <h1 className="text-3xl md:text-4xl text-center mb-4">Register</h1>

          {successMessage && (
            <p className="text-green-500 text-center mb-4 fade-in">
              {successMessage}
            </p>
          )}
          {errorMessage && (
            <p className="text-red-500 text-center mb-4 fade-in">
              {errorMessage}
            </p>
          )}

          <form onSubmit={registerUser} className="space-y-4">
            <TextInput
              type="text"
              placeholder="Username (4-20 characters, letters, numbers, underscores)"
              value={name}
              onChange={handleNameChange}
              className={`w-full px-4 py-2 border ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              maxLength="20"
              required
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name}</p>
            )}

            <TextInput
              type="email"
              placeholder="Type your email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              className={`w-full px-4 py-2 border ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
              required
            />
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email}</p>
            )}

            <TextInput
              type="password"
              placeholder="Password"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              className={`w-full px-4 py-2 border ${
                errors.password ? "border-red-500" : "border-gray-300"
              }`}
              required
            />
            {errors.password && (
              <p className="text-red-500 text-sm">{errors.password}</p>
            )}

            <TextInput
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(ev) => setConfirmPassword(ev.target.value)}
              className={`w-full px-4 py-2 border ${
                errors.confirmPassword ? "border-red-500" : "border-gray-300"
              }`}
              required
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm">{errors.confirmPassword}</p>
            )}

            <TextInput
              type="tel"
              placeholder="Phone Number (10 digits)"
              value={phone}
              onChange={(ev) => setPhone(ev.target.value)}
              className={`w-full px-4 py-2 border ${
                errors.phone ? "border-red-500" : "border-gray-300"
              }`}
              pattern="[0-9]*"
              maxLength="10"
              required
            />
            {errors.phone && (
              <p className="text-red-500 text-sm">{errors.phone}</p>
            )}

            <div className="flex items-center whitespace-nowrap">
              <input
                type="checkbox"
                id="terms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="h-4 w-4 mr-2"
              />
              <span className="text-sm text-gray-600 inline-flex items-center">
                I agree to the
                <button
                  type="button"
                  onClick={handleTermsClick}
                  className="text-primary hover:underline mx-1"
                >
                  Terms of Service
                </button>
                and
                <button
                  type="button"
                  onClick={handlePrivacyClick}
                  className="text-primary hover:underline mx-1"
                >
                  Privacy Policy
                </button>
              </span>
            </div>

            <button
              disabled={!isFormComplete()}
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`primary w-full py-3 text-white rounded-md shadow-md transition duration-300 
                ${
                  isFormComplete()
                    ? "hover:bg-blue-600"
                    : "opacity-50 cursor-not-allowed"
                }`}
            >
              Register
            </button>
            <div className="text-center py-2 text-gray-500">
              Already have an account?{" "}
              <Link
                className="underline text-blue"
                to="/login"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Login now
              </Link>
            </div>
          </form>

          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or register with
                </span>
              </div>
            </div>

            <div className="mt-4 text-center flex justify-center">
              <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
                <GoogleLogin
                  onSuccess={async (credentialResponse) => {
                    try {
                      const response = await axios.post(
                        "/auth/google/register",
                        credentialResponse,
                        {
                          withCredentials: true,
                          headers: {
                            'Content-Type': 'application/json'
                          }
                        }
                      );
                      
                      if (response.data.success) {
                        // Clear any error messages
                        setErrorMessage("");
                        setSuccessMessage("Registration successful");
                        
                        setTimeout(() => {
                          navigate('/login');
                        }, 2000);
                      } else {
                        throw new Error(response.data.error || "Registration failed");
                      }
                    } catch (error) {
                      console.error("Google registration error:", error);
                      setErrorMessage(
                        error.response?.data?.error || 
                        error.message || 
                        "Google registration failed"
                      );
                    }
                  }}
                  onError={() => {
                    setErrorMessage("Google registration failed");
                  }}
                  useOneTap={false}
                  cookiePolicy={'single_host_origin'}
                  popupType="window"
                />
              </GoogleOAuthProvider>
            </div>
          </div>
        </div>
      </div>

      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
      <PrivacyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />
    </>
  );
}
