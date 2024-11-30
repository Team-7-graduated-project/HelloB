import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { TextInput } from "../TextInput";
import { GoogleLogin } from "@react-oauth/google";
import TermsModal from "../components/TermsModal";
import PrivacyModal from "../components/PrivacyModal";

// Add validation functions at the top
const validateUsername = (name) => {
  return /^[a-zA-Z0-9_]{4,20}$/.test(name);
};

const validatePhone = (phone) => {
  const cleanPhone = phone.replace(/\D/g, "");
  return /^\d{10}$/.test(cleanPhone);
};

export default function HostRegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repassword, setRepassword] = useState("");
  const [phone, setPhone] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  // Add phone input handler
  const handlePhoneChange = (ev) => {
    const value = ev.target.value.replace(/[^\d]/g, ""); // Only allow digits
    setPhone(value);
  };

  // Add name input handler
  const handleNameChange = (ev) => {
    const value = ev.target.value.replace(/[^a-zA-Z0-9_]/g, ""); // Only allow valid characters
    setName(value);
  };

  // Update validateForm function
  function validateForm() {
    const newErrors = {};

    // Name validation
    if (!name) {
      newErrors.name = "Name is required";
    } else if (name.length < 4 || name.length > 20) {
      newErrors.name = "Name must be between 4 and 20 characters";
    } else if (!validateUsername(name)) {
      newErrors.name =
        "Name can only contain letters, numbers, and underscores";
    }

    // Email validation
    if (!email || !/^\S+@\S+\.\S{2,}$/.test(email)) {
      newErrors.email =
        "Enter a valid email with a complete domain (e.g., example@gmail.com)";
    }

    // Password validation
    if (!password || password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    // Password match validation
    if (password !== repassword) {
      newErrors.repassword = "Passwords do not match";
    }

    // Phone validation
    const cleanPhone = phone.replace(/\D/g, "");
    if (!phone || !validatePhone(cleanPhone)) {
      newErrors.phone = "Phone number must be exactly 10 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function registerHost(ev) {
    ev.preventDefault();
    if (!validateForm()) return;

    try {
      await axios.post("/host/register", {
        name,
        email,
        password,
        repassword,
        phone,
        role: "host",
      });
      setSuccessMessage("Registration successful. Redirecting to login...");
      setErrorMessage("");
      clearForm();

      // Show success message and redirect after a short delay
      setTimeout(() => {
        navigate("/host/login");
      }, 2000);
    } catch (error) {
      handleRegistrationError(error);
    }
  }

  const clearForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setRepassword("");
    setPhone("");
    setErrors({});
  };

  const handleRegistrationError = (error) => {
    if (error.response?.data) {
      const serverErrors = error.response.data.error;
      if (typeof serverErrors === "string") {
        setErrorMessage(serverErrors);
      } else {
        setErrors(serverErrors);
      }
    } else {
      setErrorMessage("Registration failed. Please try again.");
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      await axios.post(
        "/host/auth/google",
        {
          ...credentialResponse,
          role: "host",
        },
        { withCredentials: true }
      );
      setSuccessMessage("Registration successful. Redirecting to login...");
      clearForm();

      // Show success message and redirect after a short delay
      setTimeout(() => {
        navigate("/host/login");
      }, 2000);
    } catch (error) {
      console.error("Google registration error:", error);
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
      repassword &&
      phone &&
      acceptedTerms &&
      phone.length === 10
    );
  };

  return (
    <>
      <div className="mt-4 grow flex items-center justify-center">
        <div className="w-full max-w-md mx-auto px-4 py-6">
          <h1 className="text-3xl md:text-4xl text-center mb-4">
            Host Registration
          </h1>

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

          <form onSubmit={registerHost} className="space-y-4">
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
              placeholder="Re-enter Password"
              value={repassword}
              onChange={(ev) => setRepassword(ev.target.value)}
              className={`w-full px-4 py-2 border ${
                errors.repassword ? "border-red-500" : "border-gray-300"
              }`}
              required
            />
            {errors.repassword && (
              <p className="text-red-500 text-sm">{errors.repassword}</p>
            )}

            <TextInput
              type="tel"
              placeholder="Phone Number (10 digits)"
              value={phone}
              onChange={handlePhoneChange}
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
              className={`primary w-full py-3 text-white rounded-md shadow-md transition duration-300 
                ${
                  isFormComplete()
                    ? "hover:bg-blue-600"
                    : "opacity-50 cursor-not-allowed"
                }`}
            >
              Register as Host
            </button>
            <div className="text-center py-2 text-gray-500">
              Already have a host account?{" "}
              <Link className="underline text-blue" to="/host/login">
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

            <div className="mt-4">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  setErrorMessage("Google registration failed");
                }}
              />
            </div>
          </div>

          <div className="text-center py-2 text-gray-500">
            Already have a host account?{" "}
            <Link className="underline text-blue" to="/host/login">
              Login now
            </Link>
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
