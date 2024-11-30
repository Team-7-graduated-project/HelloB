import { FaArrowCircleUp } from "react-icons/fa"; // Nhập biểu tượng từ react-icons

const BackToTop = () => {
  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      onClick={handleScrollToTop}
      className="fixed bottom-4 right-4 bg-red-500 text-white p-3 rounded-full shadow-lg hover:bg-red-600 transition"
      style={{ width: "54px", height: "50px", fontSize: "20px" }}
      aria-label="Back to top"
    >
      <FaArrowCircleUp size={30} /> {/* Sử dụng biểu tượng mũi tên lớn hơn */}
    </button>
  );
};

export default BackToTop;
