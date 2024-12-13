import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { format } from "date-fns";
import { 
  FaCalendar, 
  FaUser, 
  FaTags, 
  FaArrowLeft,
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaClock,
  FaBookmark,
  FaRegBookmark,
  FaHeart,
  FaRegHeart
} from "react-icons/fa";

export default function BlogDetailPage() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [readingTime, setReadingTime] = useState("0 min");

  useEffect(() => {
    fetchPost();
  }, [id]);

  useEffect(() => {
    if (post?.content) {
      // Calculate reading time (assuming average reading speed of 200 words per minute)
      const words = post.content.trim().split(/\s+/).length;
      const time = Math.ceil(words / 200);
      setReadingTime(`${time} min read`);
    }
  }, [post]);

  const fetchPost = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/api/blog/${id}`);
      setPost(response.data);
      setError(null);
    } catch (error) {
      console.error("Error fetching post:", error);
      setError("Failed to load blog post");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const text = post.title;
    
    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${text}`, '_blank');
        break;
      default:
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading post...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Link
            to="/blog"
            className="text-primary hover:text-primary-dark transition-colors"
          >
            Return to Blog
          </Link>
        </div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Image */}
      <div className="relative h-[70vh] w-full">
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/30 z-10" />
        <img
          src={post.image || "/default-blog-image.jpg"}
          alt={post.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 z-20 flex items-center">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Link
                to="/blog"
                className="inline-flex items-center text-white/80 hover:text-white mb-8 transition-colors"
              >
                <FaArrowLeft className="mr-2" />
                Back to Blog
              </Link>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                {post.title}
              </h1>
              <div className="flex flex-wrap items-center gap-6 text-white/90 text-sm">
                <span className="flex items-center">
                  <FaCalendar className="mr-2" />
                  {format(new Date(post.createdAt), "MMMM d, yyyy")}
                </span>
                <span className="flex items-center">
                  <FaUser className="mr-2" />
                  {post.author?.name || "Anonymous"}
                </span>
                <span className="flex items-center">
                  <FaClock className="mr-2" />
                  {readingTime}
                </span>
                <span className="flex items-center">
                  <FaTags className="mr-2" />
                  {post.category}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Floating Action Buttons */}
          <div className="fixed left-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-4">
            <button
              onClick={() => setIsLiked(!isLiked)}
              className="p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all"
            >
              {isLiked ? (
                <FaHeart className="text-red-500 text-xl" />
              ) : (
                <FaRegHeart className="text-gray-500 hover:text-red-500 text-xl" />
              )}
            </button>
            <button
              onClick={() => setIsBookmarked(!isBookmarked)}
              className="p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all"
            >
              {isBookmarked ? (
                <FaBookmark className="text-primary text-xl" />
              ) : (
                <FaRegBookmark className="text-gray-500 hover:text-primary text-xl" />
              )}
            </button>
          </div>

          {/* Excerpt */}
          <div className="text-xl text-gray-600 mb-12 font-medium bg-white p-8 rounded-xl shadow-sm">
            {post.excerpt}
          </div>

          {/* Main Content */}
          <div className="prose prose-lg max-w-none">
            {post.content.split('\n').map((paragraph, index) => (
              paragraph.trim() && (
                <p key={index} className="mb-6 text-gray-800 leading-relaxed">
                  {paragraph}
                </p>
              )
            ))}
          </div>

          {/* Tags and Share Section */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-600 font-medium">Category:</span>
                <span className="bg-primary/10 text-primary px-4 py-2 rounded-full font-medium">
                  {post.category}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-gray-600 font-medium">Share:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleShare('facebook')}
                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                  >
                    <FaFacebook />
                  </button>
                  <button
                    onClick={() => handleShare('twitter')}
                    className="p-2 bg-sky-500 text-white rounded-full hover:bg-sky-600 transition-colors"
                  >
                    <FaTwitter />
                  </button>
                  <button
                    onClick={() => handleShare('linkedin')}
                    className="p-2 bg-blue-700 text-white rounded-full hover:bg-blue-800 transition-colors"
                  >
                    <FaLinkedin />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Action Buttons */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-around lg:hidden">
            <button
              onClick={() => setIsLiked(!isLiked)}
              className="flex items-center gap-2 text-gray-600"
            >
              {isLiked ? (
                <FaHeart className="text-red-500" />
              ) : (
                <FaRegHeart />
              )}
              Like
            </button>
            <button
              onClick={() => setIsBookmarked(!isBookmarked)}
              className="flex items-center gap-2 text-gray-600"
            >
              {isBookmarked ? (
                <FaBookmark className="text-primary" />
              ) : (
                <FaRegBookmark />
              )}
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
