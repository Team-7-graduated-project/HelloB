import {
  FaHome,
  FaSearch,
  FaCreditCard,
  FaUserShield,
  FaHeadset,
  FaMobile,
} from "react-icons/fa";

export default function ServicesPage() {
  const services = [
    {
      icon: FaHome,
      title: "Accommodation Booking",
      description:
        "Find and book the perfect place to stay from our vast selection of properties.",
    },
    {
      icon: FaSearch,
      title: "Advanced Search",
      description:
        "Use our powerful search tools to find exactly what you're looking for.",
    },
    {
      icon: FaCreditCard,
      title: "Secure Payments",
      description: "Safe and secure payment processing for peace of mind.",
    },
    {
      icon: FaUserShield,
      title: "Verified Hosts",
      description: "All our hosts are verified to ensure quality and safety.",
    },
    {
      icon: FaHeadset,
      title: "24/7 Support",
      description:
        "Round-the-clock customer support for any assistance you need.",
    },
    {
      icon: FaMobile,
      title: "Mobile App",
      description: "Book and manage your stays on the go with our mobile app.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-primary-dark text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Our Services</h1>
          <p className="text-xl max-w-3xl mx-auto">
            Discover the comprehensive range of services we offer to make your
            accommodation journey seamless and enjoyable.
          </p>
        </div>
      </div>

      {/* Services Grid */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
            >
              <service.icon className="text-4xl text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3">{service.title}</h3>
              <p className="text-gray-600">{service.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Search",
                description:
                  "Find your perfect accommodation using our search filters.",
              },
              {
                step: "2",
                title: "Book",
                description:
                  "Secure your booking with our easy payment system.",
              },
              {
                step: "3",
                title: "Enjoy",
                description: "Arrive and enjoy your stay with peace of mind.",
              },
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
