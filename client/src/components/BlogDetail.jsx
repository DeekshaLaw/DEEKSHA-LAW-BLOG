import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import defaultBlogImage from '../assets/default-blog-image.jpg';

const BlogDetail = ({ blog }) => {
  const [imageError, setImageError] = useState(false);
  
  // Configure DOMPurify for safe HTML rendering
  useEffect(() => {
    // Add additional configurations to DOMPurify if needed
    DOMPurify.addHook('afterSanitizeAttributes', function (node) {
      // Add target="_blank" to all links
      if ('target' in node) {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener noreferrer');
      }

      // Set all form elements as disabled
      if (
        node.nodeName === 'INPUT' ||
        node.nodeName === 'TEXTAREA' ||
        node.nodeName === 'SELECT' ||
        node.nodeName === 'BUTTON'
      ) {
        node.setAttribute('disabled', 'disabled');
      }
    });
  }, []);
  
  const handleImageError = () => {
    console.log('Image failed to load');
    setImageError(true);
  };
  
  // Sanitize content
  const sanitizedContent = blog?.content ? DOMPurify.sanitize(blog.content) : '';
  
  // Format date
  const formattedDate = blog?.createdAt 
    ? new Date(blog.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Unknown date';
  
  return (
    <div className="blog-detail">
      <h1>{blog?.title || 'Blog Title Not Available'}</h1>
      
      <div className="blog-meta mb-4">
        <span className="author">
          <i className="fas fa-user me-1"></i> 
          {blog?.author?.name || 'Unknown Author'}
        </span>
        <span className="date ms-3">
          <i className="far fa-calendar-alt me-1"></i> {formattedDate}
        </span>
        <span className="category ms-3">
          <i className="fas fa-folder me-1"></i> 
          {blog?.category?.name || 'Uncategorized'}
        </span>
      </div>
      
      {blog?.featuredImage && !imageError ? (
        <div className="featured-image mb-4">
          <img 
            src={`http://localhost:5000${blog.featuredImage}`}
            alt={blog.title}
            className="img-fluid rounded"
            onError={handleImageError}
          />
        </div>
      ) : (
        <div className="featured-image mb-4">
          <img 
            src={defaultBlogImage}
            alt="Default blog"
            className="img-fluid rounded"
          />
          {imageError && <p className="text-muted mt-1 small">Featured image could not be loaded</p>}
        </div>
      )}
      
      <div 
        className="blog-content"
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      ></div>
    </div>
  );
};

export default BlogDetail; 