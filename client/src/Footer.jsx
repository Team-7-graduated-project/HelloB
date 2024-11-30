import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaYoutube,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaHeart,
} from "react-icons/fa";
import TermsModal from "./components/TermsModal";
import PrivacyModal from "./components/PrivacyModal";

function Footer() {
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleTermsClick = (e) => {
    e.preventDefault();
    setIsTermsOpen(true);
  };

  const handlePrivacyClick = (e) => {
    e.preventDefault();
    setIsPrivacyOpen(true);
  };

  return (
    <>
      <footer className="bg-gradient-to-b from-gray-900 to-gray-950 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Company Info */}
            <div className="space-y-6">
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSQUcUPHrQFwODi-3aJ5GvQYWJnRxv1Bn5h0A&s"
                alt="HelloB"
                className="h-16 rounded-lg"
              />
              <p className="text-gray-400 leading-relaxed">
                Your trusted platform for finding perfect accommodations
                worldwide. Experience comfort and luxury at your fingertips.
              </p>
              <div className="flex gap-4">
                {[
                  FaFacebook,
                  FaTwitter,
                  FaInstagram,
                  FaLinkedin,
                  FaYoutube,
                ].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="text-gray-400 hover:text-primary transform hover:scale-110 transition-all"
                  >
                    <Icon size={24} />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links - Updated */}
            <div>
              <h4 className="text-white font-semibold text-xl mb-6">
                Quick Links
              </h4>
              <ul className="space-y-4">
                {[
                  { name: "About Us", path: "/about" },
                  { name: "Services", path: "/services" },
                  { name: "Blog", path: "/blog" },
                  { name: "Contact", path: "/contact" },
                ].map((item) => (
                  <li key={item.name}>
                    <button
                      onClick={() => handleNavigation(item.path)}
                      className="text-gray-400 hover:text-white hover:translate-x-1 transition-all inline-flex items-center gap-2"
                    >
                      <span className="h-1 w-1 bg-primary rounded-full"></span>
                      {item.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-white font-semibold text-xl mb-6">
                Contact Us
              </h4>
              <ul className="space-y-4">
                {[
                  {
                    icon: FaMapMarkerAlt,
                    text: "Da Nang City, Viet Nam",
                  },
                  { icon: FaPhone, text: "+84 775 413 001" },
                  { icon: FaEnvelope, text: "nguyenhuy23112004@gmail.com" },
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-4 text-gray-400 hover:text-white transition-colors group"
                  >
                    <div className="p-2 bg-gray-800 rounded-lg group-hover:bg-primary/20 transition-colors">
                      <item.icon className="text-primary" />
                    </div>
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-semibold text-xl mb-6">Legal</h4>
              <ul className="space-y-4">
                <li>
                  <a
                    href="#"
                    onClick={handlePrivacyClick}
                    className="text-gray-400 hover:text-white hover:translate-x-1 transition-all inline-flex items-center gap-2"
                  >
                    <span className="h-1 w-1 bg-primary rounded-full"></span>
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    onClick={handleTermsClick}
                    className="text-gray-400 hover:text-white hover:translate-x-1 transition-all inline-flex items-center gap-2"
                  >
                    <span className="h-1 w-1 bg-primary rounded-full"></span>
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white hover:translate-x-1 transition-all inline-flex items-center gap-2"
                  >
                    <span className="h-1 w-1 bg-primary rounded-full"></span>
                    Cookie Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white hover:translate-x-1 transition-all inline-flex items-center gap-2"
                  >
                    <span className="h-1 w-1 bg-primary rounded-full"></span>
                    Disclaimer
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 mt-16 pt-8 text-center">
            <p className="text-gray-400 flex items-center justify-center gap-2">
              &copy; {new Date().getFullYear()} HelloB. Made with
              <FaHeart className="text-red-500" />
              All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Add Modals */}
      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
      <PrivacyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />
    </>
  );
}

export default Footer;
