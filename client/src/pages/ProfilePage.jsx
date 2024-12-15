import { useContext, useState, useEffect } from "react";
import { UserContext } from "../UserContext";
import { Navigate, useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import PlacesPage from "./PlacesPage";
import AccountNav from "../AccountNav";
import { toast } from "react-hot-toast";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaEdit,
  FaSignOutAlt,
  FaCheck,
  FaTimes,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaEnvelopeOpen,
  FaCamera,
  FaUpload,
} from "react-icons/fa";

export default function ProfilePage() {
  const { ready, user, setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const [redirect, setRedirect] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [updatedUserData, setUpdatedUserData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [errors, setErrors] = useState({});
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [verificationStatus, setVerificationStatus] = useState({
    sent: false,
    error: null,
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  let { subpage: activePage } = useParams();
  if (activePage === undefined) {
    activePage = "profile";
  }

  useEffect(() => {
    if (user) {
      setUpdatedUserData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  useEffect(() => {
    if (redirect) {
      navigate("/");
    }
  }, [redirect, navigate]);

  const logout = async () => {
    try {
      await axios.post("/logout");
      setUser(null);
      setRedirect(true);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Cleanup on unmount or chat change

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (ready && !user) {
    return <Navigate to="/login" />;
  }

  const resetForm = () => {
    setUpdatedUserData({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
    });
    setErrors({});
    setIsEditing(false);
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    resetForm();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdatedUserData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validatePhone = (phone) => {
    if (!phone) return true;
    const phoneRegex = /^(\+\d{1,3}\s?)?\d{8,}$/;
    return phoneRegex.test(phone.replace(/\s/g, ""));
  };

  const handleSaveClick = async (e) => {
    e.preventDefault();
    setErrors({});

    try {
      // Basic validation
      if (!updatedUserData.name.trim()) {
        setErrors({ name: "Name is required" });
        return;
      }

      if (!updatedUserData.email.trim()) {
        setErrors({ email: "Email is required" });
        return;
      }

      // Enhanced Gmail validation
      const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
      if (!gmailRegex.test(updatedUserData.email.toLowerCase())) {
        setErrors({
          email: "Please enter a valid Gmail address (example@gmail.com)",
        });
        return;
      }

      // Phone validation if provided
      if (updatedUserData.phone && !validatePhone(updatedUserData.phone)) {
        setErrors({ phone: "Please enter a valid phone number" });
        return;
      }

      // Only check email existence if it's different from current email
      if (updatedUserData.email !== user.email) {
        const checkEmailResponse = await axios.post("/check-email", {
          email: updatedUserData.email,
          userId: user._id,
        });

        if (checkEmailResponse.data.exists) {
          setErrors({ email: "This email is already in use" });
          return;
        }
      }

      // Proceed with update
      const response = await axios.put("/update-profile", updatedUserData);

      if (response.data.success) {
        setUser((prev) => ({
          ...prev,
          ...response.data.user,
        }));
        resetForm();
        toast.success(response.data.message);
      }
    } catch (error) {
      console.error("Update failed:", error);

      if (error.response?.data?.error) {
        if (typeof error.response.data.error === "object") {
          setErrors(error.response.data.error);
        } else {
          setErrors({ general: error.response.data.error });
        }
      } else {
        setErrors({ general: "Failed to update profile" });
      }
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    try {
      const response = await axios.put("/change-password", passwordData);
      setPasswordSuccess(response.data.message);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setTimeout(() => setShowPasswordSection(false), 2000);
    } catch (error) {
      setPasswordError(
        error.response?.data?.error || "Failed to change password"
      );
    }
  };

  const sendVerificationEmail = async () => {
    try {
      const response = await axios.post("/send-verification-email");
      if (response.data.message) {
        setVerificationStatus({
          sent: true,
          error: null,
        });
      }
    } catch (error) {
      console.error("Failed to send verification email:", error);
      setVerificationStatus({
        sent: false,
        error:
          error.response?.data?.error || "Failed to send verification email",
      });
    }
  };

  // Update local state

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handlePhotoUpload = async () => {
    if (!photoFile) return;

    const formData = new FormData();
    formData.append("photo", photoFile);

    try {
      const { data } = await axios.put("/update-profile-photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (data.success) {
        setUser((prev) => ({ ...prev, photo: data.photo }));
        setPhotoFile(null);
        setPhotoPreview(null);
      }
    } catch {
      console.error("Failed to upload photo:");
      // Add error handling UI if needed
    }
  };

  return (
    <div className="p-8">
      <AccountNav />
      <div className="max-w-4xl mx-auto">
        {activePage === "profile" && (
          <div className="space-y-8">
            {/* Enhanced Profile Header with Photo */}
            <div className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-8 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/20 shadow-xl">
                      {photoPreview || user?.photo ? (
                        <img
                          src={photoPreview || user.photo}
                          alt={user.name}
                          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/150";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-white/10 flex items-center justify-center">
                          <FaUser className="text-4xl text-white/70" />
                        </div>
                      )}
                    </div>
                    <label
                      className="absolute bottom-0 right-0 bg-white text-primary p-2 rounded-full cursor-pointer
                              hover:bg-gray-50 transition-all transform hover:scale-110 shadow-lg"
                    >
                      <FaCamera className="text-lg" />
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handlePhotoChange}
                      />
                    </label>
                  </div>
                  {photoFile && (
                    <button
                      onClick={handlePhotoUpload}
                      className="px-6 py-3 bg-white text-primary rounded-xl hover:bg-gray-50 
                             transition-all duration-200 flex items-center gap-2 shadow-lg"
                    >
                      <FaUpload />
                      Upload Photo
                    </button>
                  )}
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-6 py-3 bg-red-200 max-w-32 text-red-500 rounded-xl
                           hover:bg-red-600 hover:text-white  transition-all duration-200"
                >
                  <FaSignOutAlt className="text-red-500 hover:text-white" />
                  Logout
                </button>
              </div>
              <div className="mt-6">
                <h2 className="text-2xl font-bold">{user.name}</h2>
                <p className="text-white/80">{user.email}</p>
              </div>
            </div>

            {/* Rest of the profile content with enhanced styling */}
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-6">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">
                        Personal Information
                      </h3>
                      <p className="text-gray-500 text-sm mt-1">
                        Manage your personal information
                      </p>
                    </div>
                    {!isEditing && (
                      <button
                        type="button"
                        onClick={handleEditClick}
                        className="px-4 py-2 max-w-40 text-primary hover:bg-primary/10 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <FaEdit />
                        Edit Profile
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleSaveClick} className="space-y-6">
                    {errors.general && (
                      <div className="p-3 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
                        <FaTimes className="flex-shrink-0" />
                        {errors.general}
                      </div>
                    )}
                    {/* Name Field */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-gray-700 font-medium">
                        <FaUser className="text-primary" />
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={updatedUserData.name}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className={`w-full p-3 rounded-xl border transition-all duration-300
                          ${
                            isEditing
                              ? "border-primary focus:ring-2 focus:ring-primary/20"
                              : "border-gray-200 bg-gray-50"
                          }
                          ${errors.name ? "border-red-500" : ""}
                        `}
                      />
                      {errors.name && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <FaTimes className="flex-shrink-0" />
                          {errors.name}
                        </p>
                      )}
                    </div>

                    {/* Email Field */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-gray-700 font-medium">
                        <FaEnvelope className="text-primary" />
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={updatedUserData.email}
                        onChange={(e) =>
                          setUpdatedUserData((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        disabled={!isEditing}
                        className={`w-full p-3 rounded-xl border transition-all duration-300
                          ${
                            isEditing
                              ? "border-primary focus:ring-2 focus:ring-primary/20"
                              : "border-gray-200 bg-gray-50"
                          }
                          ${errors.email ? "border-red-500" : ""}
                        `}
                      />
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <FaTimes className="flex-shrink-0" />
                          {errors.email}
                        </p>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      {user?.emailVerified ? (
                        <span className="text-green-600 font-medium text-sm flex items-center gap-1">
                          <FaCheck className="text-green-600" />
                          Email verified
                        </span>
                      ) : (
                        <>
                          <span className="text-yellow-600  font-medium text-sm">
                            Email not verified
                          </span>
                          <button
                            onClick={sendVerificationEmail}
                            disabled={verificationStatus.sent}
                            className="text-primary max-w-32 hover:text-primary-dark text-sm flex items-center gap-1"
                          >
                            <FaEnvelopeOpen />
                            {verificationStatus.sent
                              ? "Verification email sent"
                              : "Verify email"}
                          </button>
                          {verificationStatus.error && (
                            <span className="text-red-500 text-sm">
                              {verificationStatus.error}
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {/* Phone Field */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-gray-700 font-medium">
                        <FaPhone className="text-primary" />
                        Phone Number
                      </label>
                      <input
                        type="text"
                        name="phone"
                        maxLength="10"
                        value={updatedUserData.phone}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="+84 1234 5678"
                        className={`w-full p-3 rounded-xl border transition-all duration-300
                          ${
                            isEditing
                              ? "border-primary focus:ring-2 focus:ring-primary/20"
                              : "border-gray-200 bg-gray-50"
                          }
                          ${errors.phone ? "border-red-500" : ""}
                        `}
                      />
                      {errors.phone && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <FaTimes className="flex-shrink-0" />
                          {errors.phone}
                        </p>
                      )}
                    </div>

                    {isEditing && (
                      <div className="flex justify-end gap-4 pt-4">
                        <button
                          type="button"
                          onClick={handleCancelClick}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                          <FaTimes />
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
                        >
                          <FaCheck />
                          Save Changes
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              </div>

              {/* Right Column - Password Change */}
              <div className="md:col-span-1">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-800">
                      Password Settings
                    </h3>
                    <p className="text-gray-500 text-sm mt-1">
                      Update your password
                    </p>
                  </div>

                  <button
                    onClick={() => setShowPasswordSection(!showPasswordSection)}
                    className="w-full py-2   px-4 border border-primary text-primary hover:bg-primary/5 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <FaLock />
                    {showPasswordSection ? "Cancel" : "Change Password"}
                  </button>

                  {showPasswordSection && (
                    <form
                      onSubmit={handlePasswordChange}
                      className="mt-6 space-y-4"
                    >
                      {/* Current Password */}
                      <div>
                        <label className="text-gray-700 text-sm font-medium mb-1 block">
                          Current Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.current ? "text" : "password"}
                            value={passwordData.currentPassword}
                            onChange={(e) =>
                              setPasswordData((prev) => ({
                                ...prev,
                                currentPassword: e.target.value,
                              }))
                            }
                            className="w-full  p-2 pr-10 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/20"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPasswords((prev) => ({
                                ...prev,
                                current: !prev.current,
                              }))
                            }
                            className="absolute max-w-6 right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                      </div>

                      {/* New Password */}
                      <div>
                        <label className="text-gray-700 text-sm font-medium mb-1 block">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.new ? "text" : "password"}
                            value={passwordData.newPassword}
                            onChange={(e) =>
                              setPasswordData((prev) => ({
                                ...prev,
                                newPassword: e.target.value,
                              }))
                            }
                            className="w-full p-2 pr-10 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/20"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPasswords((prev) => ({
                                ...prev,
                                new: !prev.new,
                              }))
                            }
                            className="absolute max-w-6 right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                      </div>

                      {/* Confirm Password */}
                      <div>
                        <label className="text-gray-700 text-sm font-medium mb-1 block">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.confirm ? "text" : "password"}
                            value={passwordData.confirmPassword}
                            onChange={(e) =>
                              setPasswordData((prev) => ({
                                ...prev,
                                confirmPassword: e.target.value,
                              }))
                            }
                            className="w-full p-2 pr-10 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/20"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPasswords((prev) => ({
                                ...prev,
                                confirm: !prev.confirm,
                              }))
                            }
                            className="absolute max-w-6 right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                      </div>

                      {/* Messages */}
                      {passwordError && (
                        <div className="p-2 rounded-lg bg-red-50 text-red-600 text-sm">
                          {passwordError}
                        </div>
                      )}
                      {passwordSuccess && (
                        <div className="p-2 rounded-lg bg-green-50 text-green-600 text-sm">
                          {passwordSuccess}
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
                      >
                        <FaLock />
                        Update Password
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        {activePage === "places" && <PlacesPage />}
      </div>
    </div>
  );
}
