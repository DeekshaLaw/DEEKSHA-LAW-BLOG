import { useState, useEffect } from 'react';
import axios from 'axios';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
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
    const isCurrentUser = users.find(user => user._id === id && user.role === 'admin');
    if (isCurrentUser) {
      setError('You cannot delete your own admin account.');
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }
    
    try {
      await axios.delete(`/users/${id}`);
      
      // Update users state
      setUsers(users.filter(user => user._id !== id));
    } catch (err) {
      setError('Failed to delete user. They may have associated blogs or comments.');
      console.error(err);
    }
  };
  
  const handleRoleChange = async (id, newRole) => {
    // Prevent admin from changing their own role
    const isCurrentUser = users.find(user => user._id === id && user.role === 'admin');
    if (isCurrentUser) {
      setError('You cannot change your own admin role.');
      return;
    }
    
    try {
      const res = await axios.put(`/users/${id}`, { role: newRole });
      
      // Update users state
      setUsers(users.map(user => 
        user._id === id ? res.data.data : user
      ));
    } catch (err) {
      setError('Failed to update user role.');
      console.error(err);
    }
  };
  
  return (
    <div className="container py-5">
      <h1 className="mb-4">Manage Users</h1>
      
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Registered Users</h5>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : users.length === 0 ? (
            <p className="text-center py-3">No users found.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Verified</th>
                    <th>Registered On</th>
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
                          <button 
                            className="btn btn-sm btn-outline-primary me-1"
                            onClick={() => handleRoleChange(
                              user._id, 
                              user.role === 'admin' ? 'user' : 'admin'
                            )}
                          >
                            Make {user.role === 'admin' ? 'User' : 'Admin'}
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(user._id)}
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

export default Users; 