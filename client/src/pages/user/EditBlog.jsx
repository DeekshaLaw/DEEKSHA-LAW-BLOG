import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';
import 'react-quill/dist/quill.snow.css';

const EditBlog = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: ''
  });
  const [featuredImage, setFeaturedImage] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState('');
  
  const { title, content, category } = formData;
  
  const isAdmin = user && user.role === 'admin';
  
  // Fetch blog and categories on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch blog
        const blogRes = await axios.get(`/blogs/${id}`);
        const blog = blogRes.data.data;
        
        // Check if user is authorized to edit this blog
        if (user.role !== 'admin' && blog.author._id !== user.id) {
          // Redirect to appropriate dashboard based on user role
          if (user.role === 'admin') {
            navigate('/admin/dashboard');
          } else {
            navigate('/dashboard');
          }
          return;
        }
        
        // Set form data
        setFormData({
          title: blog.title,
          content: blog.content,
          category: blog.category._id
        });
        
        // Set current image
        if (blog.featuredImage) {
          setCurrentImage(blog.featuredImage);
        }
        
        // Fetch categories
        const categoriesRes = await axios.get('/categories');
        setCategories(categoriesRes.data.data);
      } catch (err) {
        setError('Failed to load blog data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, user, navigate]);
  
  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleContentChange = (value) => {
    setFormData({ ...formData, content: value });
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
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setImageError('Only .jpg, .jpeg, and .png files are allowed.');
      return;
    }
    
    // Validate file size (minimum 2MB)
    const minSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size < minSize) {
      setImageError('Image must be at least 2MB in size.');
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
  
  const removeImage = () => {
    setFeaturedImage(null);
    setPreviewUrl(null);
    setCurrentImage(null);
  };
  
  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    // Validate form
    if (!title || !content || !category) {
      setError('Please fill all required fields.');
      setSubmitting(false);
      return;
    }
    
    try {
      // Create FormData object for file upload
      const blogFormData = new FormData();
      blogFormData.append('title', title);
      blogFormData.append('content', content);
      blogFormData.append('category', category);
      
      if (featuredImage) {
        blogFormData.append('featuredImage', featuredImage);
      } else if (currentImage === null) {
        // If current image was removed and no new image selected
        blogFormData.append('removeImage', 'true');
      }
      
      // Submit blog update
      await axios.put(`/blogs/${id}`, blogFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Redirect based on user role
      if (isAdmin) {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update blog.');
      console.error(err);
      setSubmitting(false);
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
  
  return (
    <div className="container py-5">
      <h1 className="mb-4">Edit Blog</h1>
      
      {isAdmin && (
        <div className="alert alert-info mb-4" role="alert">
          <strong>Admin Notice:</strong> As an admin, your blog edits will be automatically approved and the blog will remain visible to users.
        </div>
      )}
      
      {!isAdmin && (
        <div className="alert alert-warning mb-4" role="alert">
          <strong>Notice:</strong> After editing, your blog will return to pending status and require admin approval before it's visible again.
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
            name="title"
            value={title}
            onChange={onChange}
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
            Featured Image (Optional, min 2MB, .jpg, .jpeg, .png)
          </label>
          
          {currentImage && !previewUrl && (
            <div className="mb-2">
              <img 
                src={`http://localhost:5000${currentImage}`}
                alt="Current featured" 
                className="img-thumbnail" 
                style={{ maxHeight: '200px' }}
              />
              <button 
                type="button" 
                className="btn btn-sm btn-danger ms-2"
                onClick={removeImage}
              >
                Remove Image
              </button>
            </div>
          )}
          
          <input 
            type="file" 
            className="form-control" 
            id="featuredImage" 
            onChange={handleImageChange}
            accept=".jpg,.jpeg,.png"
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
              <button 
                type="button" 
                className="btn btn-sm btn-danger ms-2"
                onClick={removeImage}
              >
                Remove Image
              </button>
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
            disabled={submitting}
          >
            {submitting ? 'Updating...' : 'Update Blog'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditBlog; 