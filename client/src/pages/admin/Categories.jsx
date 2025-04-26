import { useState, useEffect } from 'react';
import axios from 'axios';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  
  const { name } = formData;
  
  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);
  
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError('');
      
      const res = await axios.get('/categories');
      setCategories(res.data.data);
    } catch (err) {
      setError('Failed to load categories. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFormError('');
  };
  
  const onSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setFormError('Category name cannot be empty');
      return;
    }
    
    setFormLoading(true);
    setFormError('');
    
    try {
      if (editingId) {
        // Update category
        const res = await axios.put(`/categories/${editingId}`, formData);
        
        // Update categories state
        setCategories(categories.map(category => 
          category._id === editingId ? res.data.data : category
        ));
        
        // Reset form and editingId
        resetForm();
      } else {
        // Create new category
        const res = await axios.post('/categories', formData);
        
        // Add new category to state
        setCategories([...categories, res.data.data]);
        
        // Reset form
        resetForm();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save category.');
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };
  
  const startEditing = (category) => {
    setFormData({ name: category.name });
    setEditingId(category._id);
    setFormError('');
  };
  
  const resetForm = () => {
    setFormData({ name: '' });
    setEditingId(null);
    setFormError('');
  };
  
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) {
      return;
    }
    
    try {
      await axios.delete(`/categories/${id}`);
      
      // Update categories state
      setCategories(categories.filter(category => category._id !== id));
      
      // If editing the deleted category, reset form
      if (editingId === id) {
        resetForm();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete category.');
      console.error(err);
    }
  };
  
  return (
    <div className="container py-5">
      <h1 className="mb-4">Manage Categories</h1>
      
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      
      <div className="row">
        <div className="col-md-4 mb-4">
          <div className="card">
            <div className="card-header">
              <h5>{editingId ? 'Edit Category' : 'Add Category'}</h5>
            </div>
            <div className="card-body">
              {formError && (
                <div className="alert alert-danger" role="alert">
                  {formError}
                </div>
              )}
              
              <form onSubmit={onSubmit}>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">Category Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    id="name" 
                    name="name"
                    value={name}
                    onChange={onChange}
                    required
                  />
                </div>
                
                <div className="d-flex">
                  <button 
                    type="submit" 
                    className="btn btn-primary me-2"
                    disabled={formLoading}
                  >
                    {formLoading ? 'Saving...' : (editingId ? 'Update' : 'Add')}
                  </button>
                  
                  {editingId && (
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={resetForm}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
        
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h5>Categories</h5>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : categories.length === 0 ? (
                <p className="text-center py-3">No categories found.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Created At</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map(category => (
                        <tr key={category._id}>
                          <td>{category.name}</td>
                          <td>{new Date(category.createdAt).toLocaleDateString()}</td>
                          <td>
                            <div className="btn-group">
                              <button 
                                className="btn btn-sm btn-primary me-1"
                                onClick={() => startEditing(category)}
                              >
                                Edit
                              </button>
                              <button 
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDelete(category._id)}
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
      </div>
    </div>
  );
};

export default Categories; 