import PropTypes from "prop-types";
import { FaTimes } from "react-icons/fa";

export default function PrivacyModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto relative">
        <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold">Privacy Policy</h2>
          <button
            onClick={onClose}
            className="text-gray-500 max-w-8 hover:text-gray-700"
          >
            <FaTimes size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="prose max-w-none">
            <p>
              Your privacy is important to us. This policy outlines how we
              handle your data:
            </p>

            <h3 className="font-bold mt-4">1. Information Collection</h3>
            <p>
              We collect information you provide directly to us when using our
              service.
            </p>

            <h3 className="font-bold mt-4">2. Use of Information</h3>
            <p>
              We use your information to operate, maintain, and improve our
              services.
            </p>

            <h3 className="font-bold mt-4">3. Information Sharing</h3>
            <p>We do not sell your personal information to third parties.</p>

            <h3 className="font-bold mt-4">4. Data Security</h3>
            <p>
              We implement measures to protect your information from
              unauthorized access.
            </p>

            <h3 className="font-bold mt-4">5. Your Rights</h3>
            <p>
              You have the right to access, correct, or delete your personal
              information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

PrivacyModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
