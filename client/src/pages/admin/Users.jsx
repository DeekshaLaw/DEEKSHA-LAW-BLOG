import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { user: currentUser } = useContext(AuthContext);
  
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
  
  const handleDelete = async (id) => {
    // Prevent admin from deleting themselves
    const isCurrentUser = users.find(user => user._id === id)._id === currentUser.id;
    if (isCurrentUser) {
      setError('You cannot delete your own account.');
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }
    
    try {
      await axios.delete(`/users/${id}`);
      
      // Update users state
      setUsers(users.filter(user => user._id !== id));
      setSuccessMessage('User deleted successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError('Failed to delete user. They may have associated blogs or comments.');
      console.error(err);
    }
  };
  
  const handleRoleChange = async (id, newRole) => {
    const targetUser = users.find(user => user._id === id);
    
    // Check if trying to change own role
    if (targetUser._id === currentUser.id) {
      setError('You cannot change your own role.');
      return;
    }
    
    try {
      // Clear any previous messages
      setError('');
      setSuccessMessage('');
      
      const res = await axios.put(`/users/${id}`, { 
        name: targetUser.name,
        email: targetUser.email,
        role: newRole
      });
      
      // Update users state
      setUsers(users.map(user => 
        user._id === id ? res.data.data : user
      ));
      
      setSuccessMessage(`User role updated to ${newRole} successfully`);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      if (err.response && err.response.status === 403) {
        setError(err.response.data.message || 'You do not have permission to change admin roles.');
      } else {
        setError('Failed to update user role.');
      }
      console.error(err);
    }
  };
  
  const isPrimaryAdmin = currentUser && currentUser.email === 'admin@deekshalaw.in';
  
  // Helper function to determine if role change button should be shown
  const canChangeUserRole = (user) => {
    // Primary admin can change any role except their own
    if (isPrimaryAdmin) {
      return user._id !== currentUser.id;
    }
    // Regular admins cannot change any admin roles (including their own)
    return false;
  };
  
  return (
    <div className="container py-5">
      <h1 className="mb-4">Manage Users</h1>
      
      {!isPrimaryAdmin && (
        <div className="alert alert-info mb-4">
          <strong>Note:</strong> Only the primary admin account (admin@deekshalaw.in) can change admin roles.
        </div>
      )}
      
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
      
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Users</h5>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-4">
              <p>No users found.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Verified</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user._id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`badge ${user.role === 'admin' ? 'bg-danger' : 'bg-primary'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${user.isVerified ? 'bg-success' : 'bg-warning'}`}>
                          {user.isVerified ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="btn-group">
                          {canChangeUserRole(user) && (
                            <button 
                              className="btn btn-sm btn-outline-primary me-1"
                              onClick={() => handleRoleChange(
                                user._id, 
                                user.role === 'admin' ? 'user' : 'admin'
                              )}
                            >
                              Make {user.role === 'admin' ? 'User' : 'Admin'}
                            </button>
                          )}
                          {user._id !== currentUser.id && (
                            <button 
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(user._id)}
                            >
                              Delete
                            </button>
                          )}
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

export default Users; 