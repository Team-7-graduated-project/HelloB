import { FaUsers, FaHistory, FaMedal, FaHandshake } from "react-icons/fa";

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-primary-dark text-white py-20">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-6">
            About HelloB
          </h1>
          <p className="text-xl text-center max-w-3xl mx-auto">
            Your trusted partner in finding the perfect accommodation worldwide.
            We connect travelers with unique places to stay and unforgettable
            experiences.
          </p>
        </div>
      </div>

      {/* Our Story Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">Our Story</h2>
            <p className="text-gray-600 mb-4">
              Founded in 2024, HelloB began with a simple mission: to make
              finding and booking accommodations as easy and enjoyable as
              possible.
            </p>
            <p className="text-gray-600">
              Today, we&apos;ve grown into a trusted platform connecting
              thousands of travelers with unique places to stay around the
              world.
            </p>
          </div>
          <div className="rounded-lg overflow-hidden shadow-xl">
            <img
              src="/path-to-your-image.jpg"
              alt="Our Story"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                icon: FaUsers,
                title: "Customer First",
                description:
                  "We prioritize our customers' needs and satisfaction above all else.",
              },
              {
                icon: FaHistory,
                title: "Reliability",
                description:
                  "We provide consistent, dependable service you can count on.",
              },
              {
                icon: FaMedal,
                title: "Quality",
                description:
                  "We maintain high standards in every aspect of our service.",
              },
              {
                icon: FaHandshake,
                title: "Trust",
                description:
                  "We build lasting relationships based on transparency and integrity.",
              },
            ].map((value, index) => (
              <div
                key={index}
                className="text-center p-6 rounded-lg bg-gray-50 hover:shadow-lg transition-shadow"
              >
                <value.icon className="text-4xl text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Our Team</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              name: "John Doe",
              position: "CEO & Founder",
              image: "/path-to-image.jpg",
            },
            {
              name: "Jane Smith",
              position: "Head of Operations",
              image: "/path-to-image.jpg",
            },
            {
              name: "Mike Johnson",
              position: "Lead Developer",
              image: "/path-to-image.jpg",
            },
          ].map((member, index) => (
            <div
              key={index}
              className="text-center p-6 rounded-lg bg-white shadow-lg"
            >
              <div className="w-32 h-32 rounded-full overflow-hidden mx-auto mb-4">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-semibold mb-2">{member.name}</h3>
              <p className="text-gray-600">{member.position}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
