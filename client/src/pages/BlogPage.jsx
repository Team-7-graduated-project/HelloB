import { useState, useEffect } from 'react';
import axios from 'axios';

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('newest');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(`/api/blog-posts`, {
          params: {
            category,
            sort,
            search
          }
        });

        if (response.data.success) {
          setPosts(response.data.posts);
        } else {
          throw new Error(response.data.error );
        }
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError(err.response?.data?.error || err.message || 'Failed to fetch posts');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [category, sort, search]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!posts.length) return <div>No posts found</div>;

  return (
    <div>
      {posts.map(post => (
        <div key={post._id}>
          <h2>{post.title}</h2>
          <p>{post.excerpt}</p>
        </div>
      ))}
    </div>
  );
}
