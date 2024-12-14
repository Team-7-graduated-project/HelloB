import { useState, useEffect } from "react";
import { FaArrowCircleUp } from "react-icons/fa";

const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Show button when page is scrolled up to given distance
  const toggleVisibility = () => {
    if (window.pageYOffset > 300) { // Show after 300px of scroll
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    window.addEventListener("scroll", toggleVisibility);
    return () => {
      window.removeEventListener("scroll", toggleVisibility);
    };
  }, []);

  return (
    <>
      {isVisible && (
        <button
          onClick={handleScrollToTop}
          className="fixed bottom-4 right-4 bg-primary text-white p-3 rounded-full shadow-lg hover:bg-primary-dark transition-all duration-300 transform hover:scale-110 opacity-90 hover:opacity-100 z-50"
          style={{ width: "54px", height: "50px" }}
          aria-label="Back to top"
        >
          <FaArrowCircleUp size={30} className="mx-auto" />
        </button>
      )}
    </>
  );
};

export default BackToTop;
