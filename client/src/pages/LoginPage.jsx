import { useContext, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import { UserContext } from "../UserContext";
import { TextInput } from "../TextInput";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

// Get the client ID from environment variables
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [redirect, setRedirect] = useState(false);
  const { setUser } = useContext(UserContext);
  const [errorMessage, setErrorMessage] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    general: "",
  });

  async function handleLoginSubmit(ev) {
    ev.preventDefault();
    setErrors({}); // Clear previous errors

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setErrors((prev) => ({ ...prev, email: "Email is required" }));
      return;
    }
    if (!emailRegex.test(email)) {
      setErrors((prev) => ({
        ...prev,
        email: "Please enter a valid email address",
      }));
      return;
    }

    // Password validation
    if (!password) {
      setErrors((prev) => ({ ...prev, password: "Password is required" }));
      return;
    }

    try {
      const response = await axios.post(
        "/login",
        { email, password },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.data.user?.isActive) {
        setErrors((prev) => ({
          ...prev,
          general: `Account deactivated. Reason: ${
            response.data.user?.deactivationReason ||
            "Account has been deactivated"
          }`,
        }));
        return;
      }

      setUser(response.data.user);
      localStorage.setItem("token", response.data.token);

      // Redirect based on user role
      if (response.data.user.role === "host") {
        navigate("/host");
      } else if (response.data.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (e) {
      console.error("Login error:", e);
      if (e.response?.status === 401) {
        setErrors((prev) => ({
          ...prev,
          general:
            e.response.data.error || "Invalid credentials. Please try again.",
        }));
      } else if (e.response?.status === 404) {
        setErrors((prev) => ({
          ...prev,
          email: "Email not found",
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          general:
            "Login failed. Please check your network connection and try again.",
        }));
      }
    }
  }

  async function handleForgotPassword(ev) {
    ev.preventDefault();
    try {
      const response = await axios.post("/forgot-password", {
        email: forgotEmail,
      });
      setResetMessage(response.data.message);
      setForgotEmail("");
    } catch (error) {
      setErrorMessage(
        error.response?.data?.error || "Failed to process request"
      );
    }
  }

  const isFormComplete = () => {
    return email && password;
  };

  if (redirect) {
    return <Navigate to={redirect} />;
  }

  return (
    <div className="mt-4 grow flex items-center justify-around">
      <div className="mb-64 w-full max-w-md mx-auto">
        <h1 className="text-4xl text-center mb-4">Login</h1>
        {errorMessage && (
          <p className="text-red-500 text-center mb-4">{errorMessage}</p>
        )}
        {resetMessage && (
          <p className="text-green-500 text-center mb-4">{resetMessage}</p>
        )}

        {!showForgotPassword ? (
          <>
            <form onSubmit={handleLoginSubmit}>
              <div className="mb-4">
                <TextInput
                  type="email"
                  placeholder="Type your email"
                  value={email}
                  onChange={(ev) => {
                    setEmail(ev.target.value);
                    setErrors((prev) => ({ ...prev, email: "", general: "" }));
                  }}
                  required
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div className="mb-4">
                <TextInput
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(ev) => {
                    setPassword(ev.target.value);
                    setErrors((prev) => ({
                      ...prev,
                      password: "",
                      general: "",
                    }));
                  }}
                  required
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}
              </div>

              {errors.general && (
                <p className="text-red-500 text-sm mb-4 text-center">
                  {errors.general}
                </p>
              )}

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
                Login
              </button>
            </form>
            <div className="text-center mt-2">
              <button
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  setShowForgotPassword(true);
                }}
                className="text-primary hover:underline"
              >
                Forgot Password?
              </button>
            </div>
          </>
        ) : (
          <div>
            <form onSubmit={handleForgotPassword}>
              <TextInput
                type="email"
                placeholder="Enter your email"
                value={forgotEmail}
                onChange={(ev) => setForgotEmail(ev.target.value)}
                required
              />
              <button className="primary w-full">Send Reset Link</button>
            </form>
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
                setShowForgotPassword(false);
              }}
              className="text-gray-500 hover:underline mt-2 w-full text-center"
            >
              Back to Login
            </button>
          </div>
        )}

        <div className="mt-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          <div className="mt-4 text-center flex justify-center">
            <GoogleOAuthProvider
              clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}
            >
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  try {
                    const response = await axios.post(
                      "/auth/google",
                      credentialResponse,
                      {
                        withCredentials: true,
                        headers: {
                          "Content-Type": "application/json",
                        },
                      }
                    );

                    if (response.data.success) {
                      // Clear any existing error messages
                      setErrorMessage("");

                      setUser(response.data.user);
                      localStorage.setItem("token", response.data.token);

                      // Redirect based on role
                      if (response.data.user.role === "admin") {
                        navigate("/admin");
                      } else {
                        navigate("/");
                      }
                    } else {
                      throw new Error(response.data.error || "Login failed");
                    }
                  } catch (error) {
                    console.error("Google login error:", error);
                    setErrorMessage(
                      error.response?.data?.error ||
                        error.message ||
                        "Google login failed"
                    );
                  }
                }}
                onError={() => {
                  setErrorMessage("Google login failed");
                }}
                useOneTap={false}
                cookiePolicy={"single_host_origin"}
                popupType="window"
              />
            </GoogleOAuthProvider>
          </div>
        </div>

        <div className="text-center py-2 text-gray-500">
          Have no account yet?{" "}
          <Link
            className="underline text-blue"
            to="/register"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            Register now
          </Link>
        </div>
      </div>
    </div>
  );
}
