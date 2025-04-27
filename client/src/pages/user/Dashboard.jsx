import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('approved');
  const [blogs, setBlogs] = useState([]);
  const [userLikes, setUserLikes] = useState([]);
  const [userComments, setUserComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(false);
  const [error, setError] = useState('');
  const [activityError, setActivityError] = useState('');
  
  useEffect(() => {
    if (activeTab === 'activity') {
      fetchUserActivity();
    } else {
      fetchBlogs();
    }
  }, [activeTab]);
  
  const fetchBlogs = async () => {
    try {
      setLoading(true);
      setError('');
      
      const res = await axios.get(`/blogs/user/${activeTab}`);
      setBlogs(res.data.data);
    } catch (err) {
      setError('Failed to load blogs. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchUserActivity = async () => {
    try {
      setActivityLoading(true);
      setActivityError('');
      
      // First, verify user authentication
      try {
        const userRes = await axios.get('/users/me');
        console.log('Current user verified:', userRes.data.data);
      } catch (userErr) {
        console.error('Error verifying user:', userErr);
        setActivityError('Authentication error. Please try logging in again.');
        setActivityLoading(false);
        return;
      }
      
      // Run detailed debug to examine likes structure
      try {
        console.log('Running detailed likes debug...');
        const debugRes = await axios.get('/users/debug/blog-likes');
        console.log('Debug result:', debugRes.data);
      } catch (debugErr) {
        console.error('Debug endpoint error:', debugErr);
        // Continue despite debug error
      }
      
      // Initialize with empty arrays
      let likes = [];
      let comments = [];
      let likesError = false;
      let commentsError = false;
      
      // Fetch user likes
      try {
        console.log('Fetching user likes...');
        const likesRes = await axios.get('/users/activity/likes');
        likes = likesRes.data.data || [];
        console.log('Likes fetched successfully:', likes.length);
      } catch (err) {
        likesError = true;
        console.error('Error fetching likes:', err);
        if (err.response && err.response.data) {
          console.error('Response data:', err.response.data);
        }
      }
      
      // Fetch user comments
      try {
        console.log('Fetching user comments...');
        const commentsRes = await axios.get('/users/activity/comments');
        comments = commentsRes.data.data || [];
        console.log('Comments fetched successfully:', comments.length);
      } catch (err) {
        commentsError = true;
        console.error('Error fetching comments:', err);
        if (err.response && err.response.data) {
          console.error('Response data:', err.response.data);
        }
      }
      
      // Update state with whatever data we got
      setUserLikes(likes);
      setUserComments(comments);
      
      // Set appropriate error message
      if (likesError && commentsError) {
        setActivityError('Could not load your activity. Please try again later.');
      } else if (likesError) {
        setActivityError('Could not load your liked blogs. Comments were loaded successfully.');
      } else if (commentsError) {
        setActivityError('Could not load your comments. Liked blogs were loaded successfully.');
      } else if (likes.length === 0 && comments.length === 0) {
        setActivityError('No activity found. You have not liked any blogs or made any comments yet.');
      }
    } catch (err) {
      setActivityError(`Failed to load activity data. Please try again later.`);
      console.error('Activity fetch error:', err);
    } finally {
      setActivityLoading(false);
    }
  };
  
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this blog?')) {
      return;
    }
    
    try {
      await axios.delete(`/blogs/${id}`);
      // Update blogs state by removing the deleted blog
      setBlogs(blogs.filter(blog => blog._id !== id));
    } catch (err) {
      setError('Failed to delete blog.');
      console.error(err);
    }
  };
  
  const handleUnlike = async (blogId) => {
    try {
      await axios.put(`/blogs/${blogId}/like`);
      // Remove the blog from likes list
      setUserLikes(userLikes.filter(blog => blog._id !== blogId));
    } catch (err) {
      setActivityError('Failed to unlike blog.');
      console.error(err);
    }
  };
  
  const handleDeleteComment = async (blogId, commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }
    
    try {
      await axios.delete(`/users/activity/comments/${blogId}/${commentId}`);
      
      // Update the comments state
      const updatedComments = userComments.map(blog => {
        if (blog.blogId === blogId) {
          return {
            ...blog,
            comments: blog.comments.filter(comment => comment._id !== commentId)
          };
        }
        return blog;
      }).filter(blog => blog.comments.length > 0); // Remove blogs with no comments left
      
      setUserComments(updatedComments);
    } catch (err) {
      setActivityError('Failed to delete comment.');
      console.error(err);
    }
  };
  
  // Render activity tab content
  const renderActivityTab = () => {
    if (activityLoading) {
      return (
        <div className="text-center py-4">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      );
    }
    
    if (activityError) {
      return (
        <div className="alert alert-danger" role="alert">
          {activityError}
        </div>
      );
    }
    
    return (
      <div className="activity-tabs">
        <ul className="nav nav-pills mb-4">
          <li className="nav-item">
            <a className="nav-link active" data-bs-toggle="pill" href="#likes">
              Liked Blogs ({userLikes.length})
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" data-bs-toggle="pill" href="#comments">
              My Comments ({userComments.length})
            </a>
          </li>
        </ul>
        
        <div className="tab-content">
          {/* Liked Blogs Tab */}
          <div className="tab-pane fade show active" id="likes">
            {userLikes.length === 0 ? (
              <div className="text-center py-4">
                <p>You haven't liked any blogs yet.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Blog Title</th>
                      <th>Category</th>
                      <th>Date Liked</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userLikes.map(blog => (
                      <tr key={blog._id}>
                        <td>
                          <Link to={`/blogs/${blog._id}`}>{blog.title}</Link>
                        </td>
                        <td>{blog.category.name}</td>
                        <td>{new Date(blog.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button 
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleUnlike(blog._id)}
                          >
                            <i className="bi bi-heart-fill me-1"></i>
                            Unlike
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* Comments Tab */}
          <div className="tab-pane fade" id="comments">
            {userComments.length === 0 ? (
              <div className="text-center py-4">
                <p>You haven't commented on any blogs yet.</p>
              </div>
            ) : (
              <div className="comment-list">
                {userComments.map(blog => (
                  <div key={blog.blogId} className="card mb-4">
                    <div className="card-header">
                      <h5 className="mb-0">
                        <Link to={`/blogs/${blog.blogId}`}>
                          {blog.blogTitle}
                        </Link>
                      </h5>
                    </div>
                    <div className="card-body">
                      {blog.comments.map(comment => (
                        <div key={comment._id} className="comment-item mb-3 pb-3 border-bottom">
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="comment-content">
                              <p className="mb-1">{comment.comment}</p>
                              <small className="text-muted">
                                {new Date(comment.date).toLocaleDateString()} at {new Date(comment.date).toLocaleTimeString()}
                              </small>
                            </div>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteComment(blog.blogId, comment._id)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="container py-5">
      <h1 className="mb-4">My Dashboard</h1>
      
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      
      <div className="mb-4">
        <Link to="/blogs/create" className="btn btn-primary">
          Create New Blog
        </Link>
      </div>
      
      <div className="card">
        <div className="card-header">
          <ul className="nav nav-tabs card-header-tabs">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'approved' ? 'active' : ''}`}
                onClick={() => setActiveTab('approved')}
              >
                Approved Blogs
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'pending' ? 'active' : ''}`}
                onClick={() => setActiveTab('pending')}
              >
                Pending Blogs
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'rejected' ? 'active' : ''}`}
                onClick={() => setActiveTab('rejected')}
              >
                Rejected Blogs
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'activity' ? 'active' : ''}`}
                onClick={() => setActiveTab('activity')}
              >
                Activity
              </button>
            </li>
          </ul>
        </div>
        <div className="card-body">
          {activeTab === 'activity' ? (
            renderActivityTab()
          ) : loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-4">
              <p>No {activeTab} blogs found.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Created At</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {blogs.map(blog => (
                    <tr key={blog._id}>
                      <td>
                        {blog.status === 'approved' ? (
                          <Link to={`/blogs/${blog._id}`}>{blog.title}</Link>
                        ) : (
                          blog.title
                        )}
                      </td>
                      <td>{blog.category.name}</td>
                      <td>{new Date(blog.createdAt).toLocaleDateString()}</td>
                      <td>
                        <span 
                          className={`badge ${
                            blog.status === 'approved' 
                              ? 'bg-success' 
                              : blog.status === 'pending' 
                                ? 'bg-warning' 
                                : 'bg-danger'
                          }`}
                        >
                          {blog.status}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group">
                          <Link 
                            to={`/blogs/edit/${blog._id}`} 
                            className="btn btn-sm btn-outline-primary me-1"
                          >
                            Edit
                          </Link>
                          <button 
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(blog._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 