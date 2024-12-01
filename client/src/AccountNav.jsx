import { useLocation, Link } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "./UserContext";
import { FaEnvelope } from "react-icons/fa";

export default function AccountNav() {
  const { user, loading } = useContext(UserContext);
  const { pathname } = useLocation();
  const subpage = pathname.split("/")?.[2] || "profile";

  function linkClasses(type = null) {
    let classes = "inline-flex gap-1 py-2 px-6 rounded-full ";
    classes += type === subpage ? "bg-primary text-white" : "bg-gray-200";
    return classes;
  }

  if (loading) return null;

  return (
    <div>
      <nav className="w-full flex justify-center mt-8 gap-2 mb-8 flex-wrap">
        <Link
          onClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className={linkClasses("profile")}
          to="/account"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            />
          </svg>
          My Profile
        </Link>

        <Link
          onClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className={linkClasses("messages")}
          to="/account/messages"
        >
          <FaEnvelope className="w-6 h-6" />
          Messages
        </Link>

        {user?.role === "user" && (
          <>
            <Link
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={linkClasses("bookings")}
              to="/account/bookings"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Z"
                />
              </svg>
              Current Bookings
            </Link>

            <Link
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={linkClasses("history")}
              to="/account/history"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Booking History
            </Link>
          </>
        )}
      </nav>
    </div>
  );
}
