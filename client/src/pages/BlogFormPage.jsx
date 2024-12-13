import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { TextInput } from "../TextInput";
import { PhotosUploader } from "../components/PhotosUploader";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const BlogFormPage = () => {
  const [newPost, setNewPost] = useState({
    title: "",
    excerpt: "",
    content: "",
    category: "",
    images: [],
    tags: [],
    status: "published"
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tags, setTags] = useState([]);
  
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setNewPost({ ...newPost, [name]: value });
  };

  const handleTagInput = (e) => {
    if (e.key === 'Enter' && e.target.value) {
      setTags([...tags, e.target.value]);
      e.target.value = '';
    }
  };

  const removeTag = (indexToRemove) => {
    setTags(tags.filter((_, index) => index !== indexToRemove));
  };

  const handleCreatePost = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");
    
    try {
      // Basic validation
      if (!newPost.title?.trim()) {
        setError("Title is required");
        setIsSubmitting(false);
        return;
      }
      if (!newPost.excerpt?.trim()) {
        setError("Excerpt is required");
        setIsSubmitting(false);
        return;
      }
      if (!newPost.content?.trim()) {
        setError("Content is required");
        setIsSubmitting(false);
        return;
      }
      if (!newPost.category?.trim()) {
        setError("Category is required");
        setIsSubmitting(false);
        return;
      }

      // Prepare the data
      const postData = {
        title: newPost.title.trim(),
        excerpt: newPost.excerpt.trim(),
        content: newPost.content.trim(),
        category: newPost.category.trim(),
        images: Array.isArray(newPost.images) 
          ? newPost.images.map(img => typeof img === 'string' ? img : img.secure_url)
          : [],
        tags: Array.isArray(tags) ? tags : []
      };

      console.log("Sending post data:", postData);

      const response = await axios.post("/api/blog-posts", postData, {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });

      console.log("Server response:", response.data);

      if (response.data.success) {
        setSuccess("Post created successfully!");
        setTimeout(() => {
          navigate(`/blog/${response.data.post._id}`);
        }, 1500);
      }
    } catch (error) {
      console.error("Error creating post:", {
        response: error.response?.data,
        status: error.response?.status,
        error: error
      });
      
      if (error.response?.status === 401) {
        setError("Please log in to create a post");
      } else if (error.response?.status === 400) {
        setError(error.response.data.details || error.response.data.error);
      } else {
        setError("Failed to create post. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Create a new blog post</h1>
      
      <form onSubmit={handleCreatePost} className="space-y-6">
        <TextInput
          label="Title"
          placeholder="Enter a title"
          name="title"
          value={newPost.title}
          onChange={handleInputChange}
          className="mb-4"
        />
        <TextInput
          label="Excerpt"
          placeholder="Enter an excerpt"
          name="excerpt"
          value={newPost.excerpt}
          onChange={handleInputChange}
          className="mb-4"
        />
        <TextInput
          label="Category"
          placeholder="Enter a category"
          name="category"
          value={newPost.category}
          onChange={handleInputChange}
          className="mb-4"
        />
        <PhotosUploader
          addedPhotos={newPost.images}
          onAddPhoto={(photo) => {
            setNewPost({ ...newPost, images: [...newPost.images, photo] });
          }}
          onRemovePhoto={(photo) => {
            setNewPost({
              ...newPost,
              images: newPost.images.filter((img) => img !== photo),
            });
          }}
          className="mb-4"
        />
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Content
          </label>
          <ReactQuill 
            value={newPost.content}
            onChange={(content) => setNewPost({...newPost, content})}
            className="h-64 mb-12"
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Tags
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag, index) => (
              <span key={index} className="bg-blue-100 px-2 py-1 rounded-full text-sm">
                {tag}
                <button type="button" onClick={() => removeTag(index)} className="ml-2">×</button>
              </span>
            ))}
          </div>
          <input
            type="text"
            onKeyDown={handleTagInput}
            placeholder="Type and press Enter to add tags"
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Status
          </label>
          <select
            value={newPost.status}
            onChange={(e) => setNewPost({...newPost, status: e.target.value})}
            className="w-full p-2 border rounded"
          >
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded
            ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isSubmitting ? 'Creating...' : 'Create Post'}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mt-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mt-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogFormPage;
