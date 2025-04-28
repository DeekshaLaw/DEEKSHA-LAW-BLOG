import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';
import 'react-quill/dist/quill.snow.css';

const CreateBlog = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const isAdmin = user && user.role === 'admin';
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: ''
  });
  const [featuredImage, setFeaturedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState('');
  
  const { title, content, category } = formData;
  
  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get('/categories');
        setCategories(res.data.data);
      } catch (err) {
        setError('Failed to load categories.');
        console.error(err);
      }
    };
    
    fetchCategories();
  }, []);
  
  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleContentChange = (value) => {
    setFormData({ ...formData, content: value });
    
    // Check if content exceeds reasonable size limit
    if (value && value.length > 500000) { // ~500KB limit for content
      setError('Blog content is too large. Please reduce the size or split into multiple posts.');
    } else {
      // Clear error if it was related to content size
      if (error && error.includes('Blog content is too large')) {
        setError('');
      }
    }
  };
  
  const handleTitleChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, title: value });
    
    // Validate title length
    if (value && value.length > 200) {
      setError('Title is too long. Please keep it under 200 characters.');
    } else {
      // Clear error if it was related to title length
      if (error && error.includes('Title is too long')) {
        setError('');
      }
    }
  };
  
  const handleImageChange = (e) => {
    setImageError('');
    
    const file = e.target.files[0];
    if (!file) {
      setFeaturedImage(null);
      setPreviewUrl(null);
      return;
    }
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setImageError('Only .jpg, .jpeg, webp and .png files are allowed.');
      return;
    }
    
    // Validate file size (maximum 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      setImageError('Image must be less than 2MB in size.');
      return;
    }
    
    // Minimum size check for meaningful images
    const minSize = 5 * 1024; // 5KB in bytes
    if (file.size < minSize) {
      setImageError('Image is too small. Please use a higher quality image (at least 5KB).');
      return;
    }
    
    setFeaturedImage(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };
  
  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Validate form
    if (!title || !content || !category) {
      setError('Please fill all required fields.');
      setLoading(false);
      return;
    }
    
    // Additional validation
    if (title.trim().length < 3) {
      setError('Title is too short. Please provide a meaningful title.');
      setLoading(false);
      return;
    }
    
    // Check if content is just HTML tags without meaningful content
    const plainTextContent = content.replace(/<[^>]*>/g, '').trim();
    if (plainTextContent.length < 50) {
      setError('Content is too short. Please provide more detailed content (at least 50 characters).');
      setLoading(false);
      return;
    }
    
    try {
      // Create FormData object for file upload
      const blogFormData = new FormData();
      blogFormData.append('title', title.trim());
      blogFormData.append('content', content);
      blogFormData.append('category', category);
      
      if (featuredImage) {
        blogFormData.append('featuredImage', featuredImage);
      }
      
      // Submit blog with progress tracking
      const res = await axios.post('/blogs', blogFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload progress: ${percentCompleted}%`);
        }
      });
      
      if (res.data.success) {
        // Redirect based on user role
        if (isAdmin) {
          navigate('/admin/dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(res.data.message || 'Failed to create blog. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        setError('Upload is taking longer than expected. Please try again with a smaller image or better internet connection.');
      } else {
        setError(err.response?.data?.message || 'Failed to create blog. Please try again.');
      }
      console.error(err);
      setLoading(false);
    }
  };
  
  return (
    <div className="container py-5">
      <h1 className="mb-4">Create New Blog</h1>
      
      {isAdmin && (
        <div className="alert alert-info mb-4" role="alert">
          <strong>Admin Notice:</strong> As an admin, your blog will be automatically approved and visible to users immediately after creation.
        </div>
      )}
      
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      
      <form onSubmit={onSubmit}>
        <div className="mb-3">
          <label htmlFor="title" className="form-label">Title</label>
          <input 
            type="text" 
            className="form-control" 
            id="title" 
            value={title}
            onChange={handleTitleChange}
            placeholder="Enter blog title"
            maxLength="200"
            required
          />
        </div>
        
        <div className="mb-3">
          <label htmlFor="category" className="form-label">Category</label>
          <select 
            className="form-select" 
            id="category" 
            name="category"
            value={category}
            onChange={onChange}
            required
          >
            <option value="">Select a category</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="mb-3">
          <label htmlFor="featuredImage" className="form-label">
            Featured Image (Optional, max 2MB, .jpg, .jpeg, .png, .webp)
          </label>
          <input 
            type="file" 
            className="form-control" 
            id="featuredImage" 
            onChange={handleImageChange}
            accept=".jpg,.jpeg,.png,.webp"
          />
          {imageError && (
            <div className="form-text text-danger">{imageError}</div>
          )}
          {previewUrl && (
            <div className="mt-2">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="img-thumbnail" 
                style={{ maxHeight: '200px' }}
              />
            </div>
          )}
        </div>
        
        <div className="mb-4">
          <label htmlFor="content" className="form-label">Content</label>
          <ReactQuill 
            theme="snow"
            value={content}
            onChange={handleContentChange}
            style={{ height: '300px', marginBottom: '50px' }}
          />
        </div>
        
        <div className="mb-3 mt-5">
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Blog'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateBlog; 