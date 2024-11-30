import { useState } from "react";
import { FaCalendar, FaUser, FaTags, FaSearch } from "react-icons/fa";

export default function BlogPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const blogPosts = [
    {
      id: 1,
      title: "Top 10 Destinations for 2024",
      excerpt:
        "Discover the most exciting travel destinations that should be on your radar this year.",
      image: "/path-to-image.jpg",
      date: "March 15, 2024",
      author: "John Doe",
      category: "Travel Tips",
    },
    // Add more blog posts...
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-primary-dark text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-6">
            HelloB Blog
          </h1>
          <p className="text-xl text-center max-w-3xl mx-auto">
            Stay updated with travel tips, accommodation guides, and industry
            insights.
          </p>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center mb-8">
          <div className="relative w-full max-w-xl">
            <input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <FaSearch className="absolute right-3 top-3 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Blog Posts Grid */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
            >
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <FaCalendar className="mr-2" />
                  <span className="mr-4">{post.date}</span>
                  <FaUser className="mr-2" />
                  <span>{post.author}</span>
                </div>
                <h2 className="text-xl font-semibold mb-3">{post.title}</h2>
                <p className="text-gray-600 mb-4">{post.excerpt}</p>
                <div className="flex items-center">
                  <FaTags className="text-primary mr-2" />
                  <span className="text-sm text-gray-500">{post.category}</span>
                </div>
                <button className="mt-4 text-primary hover:text-primary-dark font-semibold">
                  Read More →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
