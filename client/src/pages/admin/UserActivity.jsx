import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const UserActivity = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [userLikes, setUserLikes] = useState([]);
  const [userComments, setUserComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState({ type: null, id: null });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError('');
        
        const res = await axios.get('/users');
        setUsers(res.data.data);
      } catch (err) {
        setError('Failed to load users. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);
  
  // Fetch user activity when a user is selected
  useEffect(() => {
    const fetchUserActivity = async () => {
      if (!selectedUser) return;
      
      try {
        setActivityLoading(true);
        setError('');
        setSuccessMessage('');
        
        // Get token from localStorage
        const token = localStorage.getItem('token');
        
        // Make API calls to fetch user activity
        const [likesRes, commentsRes] = await Promise.all([
          axios.get(`/users/${selectedUser}/activity/likes`, {
            headers: {
              Authorization: token ? `Bearer ${token}` : ''
            }
          }),
          axios.get(`/users/${selectedUser}/activity/comments`, {
            headers: {
              Authorization: token ? `Bearer ${token}` : ''
            }
          })
        ]);
        
        console.log('User likes response:', likesRes.data);
        console.log('User comments response:', commentsRes.data);
        
        setUserLikes(likesRes.data.data || []);
        setUserComments(commentsRes.data.data || []);
        
        console.log('Set userComments state to:', commentsRes.data.data);
      } catch (err) {
        setError('Failed to load user activity. Please try again.');
        console.error('Error fetching user activity:', err);
      } finally {
        setActivityLoading(false);
      }
    };
    
    fetchUserActivity();
  }, [selectedUser]);
  
  // Handle user selection change
  const handleUserChange = (e) => {
    setSelectedUser(e.target.value);
    setSuccessMessage('');
  };
  
  // Handle like deletion
  const handleDeleteLike = async (blogId) => {
    if (!window.confirm('Are you sure you want to delete this like?')) {
      return;
    }
    
    try {
      setDeleteLoading({ type: 'like', id: blogId });
      setError('');
      setSuccessMessage('');
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      await axios.delete(`/users/${selectedUser}/activity/likes/${blogId}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : ''
        }
      });
      
      // Update the likes list
      setUserLikes(userLikes.filter(like => like._id !== blogId));
      setSuccessMessage('Like deleted successfully');
    } catch (err) {
      setError('Failed to delete like. Please try again.');
      console.error('Error deleting like:', err);
    } finally {
      setDeleteLoading({ type: null, id: null });
    }
  };
  
  // Handle comment deletion
  const handleDeleteComment = async (blogId, commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }
    
    try {
      setDeleteLoading({ type: 'comment', id: commentId });
      setError('');
      setSuccessMessage('');
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      await axios.delete(`/users/${selectedUser}/activity/comments/${blogId}/${commentId}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : ''
        }
      });
      
      // Update the comments list by filtering out the deleted comment
      const updatedComments = userComments.map(item => {
        if (item.blogId === blogId) {
          const filteredComments = item.comments.filter(comment => comment._id !== commentId);
          // If there are still comments for this blog, return updated item
          if (filteredComments.length > 0) {
            return { ...item, comments: filteredComments };
          }
          // If no more comments for this blog, return null to filter it out
          return null;
        }
        return item;
      }).filter(Boolean); // Remove any null items
      
      setUserComments(updatedComments);
      setSuccessMessage('Comment deleted successfully');
    } catch (err) {
      setError('Failed to delete comment. Please try again.');
      console.error('Error deleting comment:', err);
    } finally {
      setDeleteLoading({ type: null, id: null });
    }
  };
  
  return (
    <div className="container py-5">
      <h1 className="mb-4">User Activity Tracking</h1>
      
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="alert alert-success" role="alert">
          {successMessage}
        </div>
      )}
      
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Select User</h5>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-3">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading users...</span>
              </div>
            </div>
          ) : (
            <div className="row">
              <div className="col-md-6">
                <select 
                  className="form-select" 
                  value={selectedUser}
                  onChange={handleUserChange}
                >
                  <option value="">Select a user</option>
                  {users.map(user => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {selectedUser && (
        <>
          {activityLoading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading activity data...</span>
              </div>
            </div>
          ) : (
            <>
              {/* User Likes Section */}
              <div className="card mb-4">
                <div className="card-header bg-light">
                  <h5 className="mb-0">Liked Blogs</h5>
                </div>
                <div className="card-body">
                  {userLikes.length === 0 ? (
                    <p className="text-muted">This user has not liked any blogs yet.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Blog Title</th>
                            <th>Category</th>
                            <th>Liked Date</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userLikes.map(blog => (
                            <tr key={blog._id}>
                              <td>{blog.title}</td>
                              <td>
                                {blog.category ? (
                                  <span className="badge bg-info">
                                    {blog.category.name}
                                  </span>
                                ) : (
                                  <span className="text-muted">Uncategorized</span>
                                )}
                              </td>
                              <td>{new Date(blog.createdAt).toLocaleDateString()}</td>
                              <td>
                                <div className="btn-group">
                                  <Link 
                                    to={`/blogs/${blog._id}`}
                                    className="btn btn-sm btn-outline-primary me-2"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    View Blog
                                  </Link>
                                  <button 
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleDeleteLike(blog._id)}
                                    disabled={deleteLoading.type === 'like' && deleteLoading.id === blog._id}
                                  >
                                    {deleteLoading.type === 'like' && deleteLoading.id === blog._id ? 
                                      'Deleting...' : 'Delete Like'}
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
              
              {/* User Comments Section */}
              <div className="card">
                <div className="card-header bg-light">
                  <h5 className="mb-0">Comments Made</h5>
                </div>
                <div className="card-body">
                  {console.log('Rendering comments section with userComments:', userComments)}
                  {userComments.length === 0 ? (
                    <p className="text-muted">This user has not made any comments yet.</p>
                  ) : (
                    <div className="accordion" id="userCommentsAccordion">
                      {userComments.map((item, index) => {
                        console.log('Rendering comment item:', item);
                        return (
                        <div className="accordion-item" key={item.blogId}>
                          <h2 className="accordion-header">
                            <button 
                              className="accordion-button collapsed" 
                              type="button" 
                              data-bs-toggle="collapse" 
                              data-bs-target={`#collapse${index}`}
                            >
                              <strong>{item.blogTitle}</strong>
                              <span className="badge bg-secondary ms-2">
                                {item.comments.length} comment(s)
                              </span>
                            </button>
                          </h2>
                          <div 
                            id={`collapse${index}`} 
                            className="accordion-collapse collapse" 
                            data-bs-parent="#userCommentsAccordion"
                          >
                            <div className="accordion-body">
                              <div className="list-group">
                                {item.comments.map(comment => {
                                  console.log('Rendering individual comment:', comment);
                                  return (
                                  <div className="list-group-item" key={comment._id}>
                                    <div className="d-flex justify-content-between align-items-center">
                                      <small className="text-muted">
                                        {new Date(comment.createdAt).toLocaleString()}
                                      </small>
                                      <div>
                                        <Link 
                                          to={`/blogs/${item.blogId}`}
                                          className="btn btn-sm btn-outline-primary me-2"
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        >
                                          View Blog
                                        </Link>
                                        <button 
                                          className="btn btn-sm btn-outline-danger"
                                          onClick={() => handleDeleteComment(item.blogId, comment._id)}
                                          disabled={deleteLoading.type === 'comment' && deleteLoading.id === comment._id}
                                        >
                                          {deleteLoading.type === 'comment' && deleteLoading.id === comment._id ? 
                                            'Deleting...' : 'Delete Comment'}
                                        </button>
                                      </div>
                                    </div>
                                    <p className="mt-2 mb-0">{comment.text}</p>
                                  </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default UserActivity; 