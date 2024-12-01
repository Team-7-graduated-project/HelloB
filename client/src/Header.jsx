import { useContext, useEffect, useState } from "react";
import { UserContext } from "./UserContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, Transition } from "@headlessui/react";
import {
  FaHome,
  FaUserCircle,
  FaSignOutAlt,
  FaCog,
  FaHotel,
  FaHeart,
} from "react-icons/fa";
import axios from "axios";

export default function Header() {
  const { ready, user, setUser } = useContext(UserContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!ready) {
    return null;
  }

  const logout = async () => {
    try {
      await axios.post("/logout");
      setUser(null);
      localStorage.removeItem("token");
      window.location.reload();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const renderUserAvatar = () => {
    if (!user?.photo) {
      return <FaUserCircle className="w-6 h-6" />;
    }

    return (
      <img
        src={user.photo}
        alt={user.name}
        className="w-full h-full object-cover"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = "https://via.placeholder.com/150";
        }}
      />
    );
  };

  return (
    <div className="relative">
      <header
        className={`px-6 py-4 flex justify-between items-center bg-white w-full z-50 transition-all duration-300 ${
          isSticky
            ? "fixed top-0 left-0 right-0 shadow-lg animate-slideDown"
            : "relative"
        }`}
      >
        {/* Logo */}
        <Link
          to={"/"}
          onClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSQUcUPHrQFwODi-3aJ5GvQYWJnRxv1Bn5h0A&s"
            alt="Logo"
            className="w-10 h-10 object-cover rounded-xl"
          />
          <span className="font-bold text-2xl bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
            HelloB
          </span>
        </Link>

        {/* Right Side Menu */}
        <div className="flex items-center gap-6">
          {location.pathname === "/host/yourhome" && (
            <button
              className="hidden md:flex items-center gap-2 text-white bg-gradient-to-r from-primary to-primary-dark rounded-full py-2.5 px-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
                navigate("/host/login");
              }}
            >
              <FaHotel className="text-lg" />
              <span>Start Hosting</span>
            </button>
          )}

          {!user &&
            location.pathname !== "/host/yourhome" &&
            location.pathname !== "/host/login" &&
            location.pathname !== "/host/register" && (
              <div className="flex items-center gap-4">
                <Link
                  to={"/host/yourhome"}
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="hidden md:flex items-center gap-2 text-gray-600 hover:text-primary transition-colors"
                >
                  <FaHome />
                  <span>Rent your place</span>
                </Link>

                <div className="flex items-center gap-3">
                  <Link
                    to={"/register"}
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="px-5 py-2.5 bg-white text-primary border-2 border-primary rounded-full hover:bg-primary hover:text-white transition-all duration-300"
                  >
                    Register
                  </Link>
                  <Link
                    to={"/login"}
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="px-5 py-2.5 bg-primary text-white rounded-full hover:bg-primary-dark transition-all duration-300"
                  >
                    Login
                  </Link>
                </div>
              </div>
            )}

          {user && (
            <Menu as="div" className="relative inline-block text-left">
              {({ open }) => (
                <>
                  <Menu.Button
                    className={`flex items-center gap-3 px-4 py-2 rounded-full border ${
                      open
                        ? "bg-gray-50 border-gray-300"
                        : "border-transparent hover:bg-gray-50 hover:border-gray-300"
                    } transition-all duration-200`}
                  >
                    <div className="flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5 text-gray-600"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                        />
                      </svg>
                      <span className="hidden md:block text-gray-700 font-medium">
                        {user.name}
                      </span>
                    </div>
                    <div className="w-9 h-9 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full flex items-center justify-center overflow-hidden">
                      {renderUserAvatar()}
                    </div>
                  </Menu.Button>

                  <Transition
                    show={open}
                    enter="transition ease-out duration-200"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-150"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 z-10 mt-3 w-60 origin-top-right rounded-2xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none divide-y divide-gray-100">
                      <div className="px-4 py-3">
                        <p className="text-sm text-gray-500">Signed in as</p>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.email}
                        </p>
                      </div>

                      <div className="py-2">
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              to="/account"
                              onClick={() => {
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              className={`flex items-center gap-3 px-4 py-3 text-sm ${
                                active ? "bg-gray-50" : ""
                              } text-gray-700`}
                            >
                              <FaUserCircle className="text-primary" />
                              Profile Settings
                            </Link>
                          )}
                        </Menu.Item>

                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              to="/favorites"
                              onClick={() => {
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              className={`flex items-center gap-3 px-4 py-3 text-sm ${
                                active ? "bg-gray-50" : ""
                              } text-gray-700`}
                            >
                              <FaHeart className="text-primary" />
                              My Favorites
                            </Link>
                          )}
                        </Menu.Item>

                        {user.role === "admin" && (
                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                to="/admin"
                                onClick={() => {
                                  window.scrollTo({
                                    top: 0,
                                    behavior: "smooth",
                                  });
                                }}
                                className={`flex items-center gap-3 px-4 py-3 text-sm ${
                                  active ? "bg-gray-50" : ""
                                } text-gray-700`}
                              >
                                <FaCog className="text-primary" />
                                Admin Dashboard
                              </Link>
                            )}
                          </Menu.Item>
                        )}

                        {user.role === "host" && (
                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                to="/host"
                                onClick={() => {
                                  window.scrollTo({
                                    top: 0,
                                    behavior: "smooth",
                                  });
                                }}
                                className={`flex items-center gap-3 px-4 py-3 text-sm ${
                                  active ? "bg-gray-50" : ""
                                } text-gray-700`}
                              >
                                <FaHotel className="text-primary" />
                                Your Properties
                              </Link>
                            )}
                          </Menu.Item>
                        )}
                      </div>

                      <div className="py-2">
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => {
                                window.scrollTo({
                                  top: 0,
                                  behavior: "smooth",
                                });
                                logout();
                              }}
                              className={`flex items-center gap-3 px-4 py-3 text-sm w-full ${
                                active ? "bg-gray-50" : ""
                              } text-red-600`}
                            >
                              <FaSignOutAlt />
                              Sign Out
                            </button>
                          )}
                        </Menu.Item>
                      </div>
                    </Menu.Items>
                  </Transition>
                </>
              )}
            </Menu>
          )}
        </div>
      </header>
    </div>
  );
}
