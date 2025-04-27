import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from '../config/axios';
import DOMPurify from 'dompurify';
import AuthContext from '../context/AuthContext';
import ScrollToTop from '../components/common/ScrollToTop';

const BlogDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useContext(AuthContext);
  
  // Check if this is an admin preview
  const isAdminPreview = location.state?.adminPreview && user?.role === 'admin';
  
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  
  // Get the base URL for uploads from the environment variables
  const uploadsBaseUrl = import.meta.env.VITE_UPLOADS_URL;
  
  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Get token from localStorage for authorization
        const token = localStorage.getItem('token');
        
        // Include special admin flag when admin is previewing
        const headers = {
          Authorization: token ? `Bearer ${token}` : ''
        };
        
        // If this is an admin preview, set special query parameter
        let url = `/blogs/${id}`;
        if (user?.role === 'admin' && location.state?.adminPreview) {
          url += '?admin_preview=true';
        }
        
        const res = await axios.get(url, { headers });
        setBlog(res.data.data);
      } catch (err) {
        setError('Blog not found or you do not have permission to view it.');
      } finally {
        setLoading(false);
      }
    };
    
    // Only attempt to fetch if the user data is available for admin preview
    if (!location.state?.adminPreview || (location.state?.adminPreview && user)) {
      fetchBlog();
    }
  }, [id, user, location.state]);
  
  const handleLike = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    try {
      setLikeLoading(true);
      const res = await axios.put(`/blogs/${id}/like`);
      
      // Update blog with new likes
      setBlog({
        ...blog,
        likes: res.data.data
      });
    } catch (err) {
      setError('Failed to like blog.');
    } finally {
      setLikeLoading(false);
    }
  };
  
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (!comment.trim()) {
      return;
    }
    
    try {
      setCommentLoading(true);
      const res = await axios.post(`/blogs/${id}/comments`, { comment });
      
      // Update blog with new comments
      setBlog({
        ...blog,
        comments: res.data.data
      });
      
      // Clear comment form
      setComment('');
    } catch (err) {
      setError('Failed to add comment.');
    } finally {
      setCommentLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger" role="alert">
          {error}
          {location.state?.adminPreview && (
            <div className="mt-2">
              <p>
                <strong>Admin Note:</strong> Make sure you are logged in as an admin to preview pending blogs.
              </p>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => window.close()}
              >
                Close Preview
              </button>
            </div>
          )}
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => navigate('/')}
        >
          Back to Home
        </button>
      </div>
    );
  }
  
  if (!blog) {
    return null;
  }
  
  const isLikedByUser = blog.likes.some(
    like => user && like.user === user.id
  );
  
  // Sanitize blog content with DOMPurify
  const sanitizedContent = DOMPurify.sanitize(blog.content);
  
  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-lg-8 mx-auto">
          {/* Admin Preview Banner */}
          {isAdminPreview && blog?.status !== 'approved' && (
            <div className={`alert ${blog?.status === 'pending' ? 'alert-warning' : 'alert-danger'} mb-4`}>
              <strong>Admin Preview Mode:</strong> You are viewing this {blog?.status} blog as an administrator. 
              <div className="mt-2">
                <button 
                  className="btn btn-sm btn-secondary"
                  onClick={() => window.close()}
                >
                  Close Preview
                </button>
              </div>
            </div>
          )}
          
          {/* Blog header */}
          <h1 className="mb-3">{blog.title}</h1>
          <p className="text-muted">
            <span>
              Category: {blog.category.name} | Author: {blog.author.name}
            </span>
            <span className="ms-3">
              {new Date(blog.createdAt).toLocaleDateString()}
            </span>
            {isAdminPreview && (
              <span className={`ms-2 badge ${
                blog.status === 'approved' ? 'bg-success' : 
                blog.status === 'pending' ? 'bg-warning' : 'bg-danger'
              }`}>
                {blog.status}
              </span>
            )}
          </p>
          
          {/* Featured image */}
          {blog.featuredImage && (
            <div className="mb-4">
              <img 
                src={`${uploadsBaseUrl}${blog.featuredImage}`} 
                className="img-fluid rounded" 
                alt={blog.title}
                loading="lazy"
              />
            </div>
          )}
          
          {/* Blog content */}
          <div className="blog-content mb-5">
            <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
          </div>
          
          {/* Like button */}
          <div className="mb-4">
            <button 
              className={`btn ${isLikedByUser ? 'btn-danger' : 'btn-outline-danger'}`}
              onClick={handleLike}
              disabled={likeLoading || !isAuthenticated}
            >
              <i className="bi bi-heart-fill me-1"></i>
              {isLikedByUser ? 'Liked' : 'Like'} ({blog.likes.length})
            </button>
            
            {!isAuthenticated && (
              <small className="text-muted ms-2">
                Please <a href="/login">login</a> to like this blog.
              </small>
            )}
          </div>
          
          {/* Comments section */}
          <div className="mt-5">
            <h3 className="mb-4">Comments ({blog.comments.length})</h3>
            
            {/* Comment form */}
            {isAuthenticated ? (
              <form onSubmit={handleCommentSubmit} className="mb-4">
                <div className="mb-3">
                  <textarea 
                    className="form-control" 
                    rows="3" 
                    placeholder="Leave a comment..." 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                  ></textarea>
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={commentLoading}
                >
                  {commentLoading ? 'Posting...' : 'Post Comment'}
                </button>
              </form>
            ) : (
              <div className="alert alert-info mb-4">
                Please <a href="/login">login</a> to comment on this blog.
              </div>
            )}
            
            {/* Comments list */}
            {blog.comments.length === 0 ? (
              <p className="text-muted">No comments yet. Be the first to comment!</p>
            ) : (
              <div className="comments-list">
                {blog.comments.map((comment, index) => (
                  <div key={index} className="card mb-3">
                    <div className="card-body">
                      <h5 className="card-title">{comment.name}</h5>
                      <h6 className="card-subtitle mb-2 text-muted">
                        {new Date(comment.date).toLocaleDateString()}
                      </h6>
                      <p className="card-text">{comment.comment}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  );
};

export default BlogDetails; 