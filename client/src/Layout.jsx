import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header Section */}
      <Header />

      {/* Main Content Section */}
      <main className="flex-grow px-4 sm:px-6 py-4 overflow-y-auto">
        <Outlet /> {/* Renders the selected component */}
      </main>

      {/* Footer Section */}
      <Footer />
    </div>
  );
}
