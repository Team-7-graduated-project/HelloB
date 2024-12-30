import { useState, useEffect } from "react";
import axios from "axios";
import {
  FaTrash,
  FaImage,
  FaPlus,
  FaTimes,
  FaUpload,
  FaSearch,
} from "react-icons/fa";

export default function ManageBlogPage() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentPost, setCurrentPost] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    content: "",
    image: "",
    category: "",
  });
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [visiblePosts, setVisiblePosts] = useState(10);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await axios.get("/api/blog", {
        withCredentials: true,
      });
      setPosts(response.data);
      setFilteredPosts(response.data);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentPost) {
        await axios.put(`/api/blog/${currentPost._id}`, formData, {
          withCredentials: true,
        });
      } else {
        await axios.post("/api/blog", formData, {
          withCredentials: true,
        });
      }
      fetchPosts();
      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error("Error saving post:", error);
    }
  };

  const handleEdit = (post) => {
    setCurrentPost(post);
    setFormData({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      image: post.image,
      category: post.category,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        await axios.delete(`/api/blog/${id}`, {
          withCredentials: true,
        });
        fetchPosts();
        if (currentPost?._id === id) {
          resetForm();
        }
      } catch (error) {
        console.error("Error deleting post:", error);
      }
    }
  };

  const resetForm = () => {
    setCurrentPost(null);
    setFormData({
      title: "",
      excerpt: "",
      content: "",
      image: "",
      category: "",
    });
  };

  const uploadPhoto = async (e) => {
    const files = e.target.files;
    const data = new FormData();
    for (let i = 0; i < files.length; i++) {
      data.append("photos", files[i]);
    }
    try {
      const response = await axios.post("/uploads", data, {
        withCredentials: true,
        headers: { "Content-type": "multipart/form-data" },
      });
      setFormData((prev) => ({
        ...prev,
        image: response.data[0], // Set the first uploaded image as the main image
      }));
      setUploadedFiles((prev) => [...prev, ...response.data]);
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  const uploadByLink = async (ev) => {
    ev.preventDefault();
    const imageUrl = formData.image;
    if (!imageUrl) return;
    try {
      const response = await axios.post(
        "/upload-by-link",
        {
          link: imageUrl,
        },
        {
          withCredentials: true,
        }
      );
      setFormData((prev) => ({
        ...prev,
        image: response.data,
      }));
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.trim() === "") {
      setFilteredPosts(posts);
    } else {
      setFilteredPosts(
        posts.filter(
          (post) =>
            post.title.toLowerCase().includes(value.toLowerCase()) ||
            post.excerpt.toLowerCase().includes(value.toLowerCase()) ||
            post.category.toLowerCase().includes(value.toLowerCase()) ||
            post.content.toLowerCase().includes(value.toLowerCase())
        )
      );
    }
    setVisiblePosts(10);
  };

  const handleLoadMore = () => {
    setVisiblePosts((prev) => prev + 10);
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-8 mb-8 text-white">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Blog Management</h1>
            <p className="text-white/80">Create and manage blog content</p>
          </div>
          {!showForm && (
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="px-6 max-w-44 py-2 bg-white/10 backdrop-blur-sm text-white rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2"
            >
              <FaPlus />
              Add New Post
            </button>
          )}
        </div>
      </div>
      <div className="relative flex-1 max-w-2xl mx-auto mb-6">
        <input
          type="text"
          placeholder="Search posts..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
      </div>
      {/* Search Bar */}

      {/* Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              {currentPost ? "Edit Post" : "Create New Post"}
            </h2>
            <button
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="text-gray-400 max-w-10 hover:text-gray-600"
            >
              <FaTimes size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                  placeholder="Enter post title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image Upload
                </label>
                <div className="space-y-2">
                  {/* URL Upload */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={formData.image}
                        onChange={(e) =>
                          setFormData({ ...formData, image: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-lg p-3 pl-10 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                        placeholder="Enter image URL"
                      />
                      <FaImage className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                    <button
                      onClick={uploadByLink}
                      className="px-4 py-2 max-w-24 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                    >
                      Add by Link
                    </button>
                  </div>

                  {/* File Upload */}
                  <div className="flex items-center gap-2">
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={uploadPhoto}
                        accept="image/*"
                      />
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary transition-colors duration-200">
                        <FaUpload
                          className="mx-auto text-gray-400 mb-2"
                          size={24}
                        />
                        <span className="text-gray-600">
                          Click to upload images
                        </span>
                      </div>
                    </label>
                  </div>

                  {/* Preview Uploaded Images */}
                  {uploadedFiles.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {uploadedFiles.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt="Upload preview"
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => {
                              setUploadedFiles((prev) =>
                                prev.filter((_, i) => i !== index)
                              );
                            }}
                            className="absolute max-w-6 top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          >
                            <FaTimes size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                  placeholder="Enter post category"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Excerpt
                </label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) =>
                    setFormData({ ...formData, excerpt: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                  rows="3"
                  placeholder="Enter post excerpt"
                  required
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="h-full">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  className="w-full h-[calc(100%-2rem)] border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                  placeholder="Enter post content"
                  required
                />
              </div>
            </div>

            <div className="col-span-2 flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors duration-200 font-medium shadow-sm hover:shadow-md"
              >
                {currentPost ? "Update Post" : "Create Post"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Posts List */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading posts...</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {filteredPosts.slice(0, visiblePosts).map((post) => (
              <div
                key={post._id}
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
                onClick={() => handleEdit(post)}
              >
                <div className="flex gap-4">
                  {post.image && (
                    <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = "fallback-image-url.jpg";
                          e.target.onerror = null;
                        }}
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">
                          {post.title}
                        </h2>
                        <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                          {post.excerpt}
                        </p>
                        <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          {post.category}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(post._id);
                        }}
                        className="text-gray-400 max-w-10 hover:text-red-600 transition-colors duration-200"
                      >
                        <FaTrash size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {visiblePosts < filteredPosts.length && (
            <div className="flex justify-center mt-6">
              <button
                onClick={handleLoadMore}
                className="bg-black max-w-40 text-white px-6 py-2 rounded-lg   transition-colors  flex items-center gap-2"
              >
                Load More
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
