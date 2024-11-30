import PropTypes from "prop-types";
import { FaTimes } from "react-icons/fa";

export default function TermsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto relative">
        <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold">Terms of Service</h2>
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
              Welcome to our service. By using our site, you agree to these
              terms:
            </p>

            <h3 className="font-bold mt-4">1. Use of Service</h3>
            <p>You must use our service responsibly and legally.</p>

            <h3 className="font-bold mt-4">2. User Accounts</h3>
            <p>
              You are responsible for maintaining the security of your account.
            </p>

            <h3 className="font-bold mt-4">3. Content</h3>
            <p>
              You retain rights to your content, but grant us license to use it
              on our platform.
            </p>

            <h3 className="font-bold mt-4">4. Prohibited Activities</h3>
            <p>
              You may not use our service for any illegal or unauthorized
              purpose.
            </p>

            <h3 className="font-bold mt-4">5. Termination</h3>
            <p>
              We may terminate or suspend your account for violations of these
              terms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

TermsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
