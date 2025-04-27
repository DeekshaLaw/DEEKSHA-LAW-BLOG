import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Email form, 2: OTP verification, 3: New password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { forgotPassword, resetPassword, verifyResetOTP } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Email request form submission
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Basic validation
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    
    setLoading(true);
    
    try {
      const res = await forgotPassword(email.trim());
      setSuccess(res.message || 'OTP sent successfully to your email');
      setStep(2); // Move to OTP verification step
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process your request');
    } finally {
      setLoading(false);
    }
  };
  
  // OTP verification and password reset form submission
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validate OTP
    if (!otp.trim()) {
      setError('Please enter the OTP sent to your email');
      return;
    }
    
    // If we're on the OTP verification step, proceed with verification
    if (step === 2) {
      setLoading(true);
      
      try {
        // Use the dedicated OTP verification endpoint
        const res = await verifyResetOTP({
          email: email.trim(),
          otp: otp.trim()
        });
        
        // If successful, move to password creation step
        setStep(3);
        setSuccess('OTP verified successfully. Please create a new password.');
      } catch (err) {
        console.error('OTP verification error:', err);
        
        // Handle specific error for invalid OTP
        if (err.response?.data?.attemptsLeft) {
          setError(`${err.response.data.message} (${err.response.data.attemptsLeft} attempts left)`);
        } else if (err.response?.status === 400) {
          // Handle other validation errors
          setError(err.response?.data?.message || 'Invalid or expired OTP');
        } else if (err.response?.status === 404) {
          setError('Account not found with this email');
        } else {
          setError('Failed to verify OTP. Please try again or request a new one.');
        }
      } finally {
        setLoading(false);
      }
      return;
    }
    
    // Validate passwords
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    
    try {
      const res = await resetPassword({
        email: email.trim(),
        otp: otp.trim(),
        password
      });
      
      setSuccess(res.message || 'Password updated successfully');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error('Password reset error:', err);
      
      if (err.response?.status === 400) {
        setError(err.response?.data?.message || 'Invalid or expired reset token');
      } else if (err.response?.status === 404) {
        setError('Account not found with this email');
      } else {
        setError('Failed to reset password. Please try again or request a new reset link.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h4 className="mb-0">
                {step === 1 && 'Forgot Password'}
                {step === 2 && 'Enter OTP'}
                {step === 3 && 'Create New Password'}
              </h4>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="alert alert-success" role="alert">
                  {success}
                </div>
              )}
              
              {step === 1 ? (
                // Step 1: Email form
                <form onSubmit={handleEmailSubmit}>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      required
                    />
                    <small className="form-text text-muted">
                      Enter your registered email address to receive a password reset OTP.
                    </small>
                  </div>
                  <div className="mb-3">
                    <button 
                      type="submit" 
                      className="btn btn-primary w-100"
                      disabled={loading}
                    >
                      {loading ? 'Processing...' : 'Send Reset OTP'}
                    </button>
                  </div>
                </form>
              ) : step === 2 ? (
                // Step 2: OTP verification
                <form onSubmit={handleResetPasswordSubmit}>
                  <div className="mb-3">
                    <p>We've sent a 6-digit OTP to your email address.</p>
                    <label htmlFor="otp" className="form-label">One-Time Password (OTP)</label>
                    <input
                      type="text"
                      className="form-control"
                      id="otp"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      disabled={loading}
                      maxLength={6}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <button 
                      type="submit" 
                      className="btn btn-primary w-100"
                      disabled={loading}
                    >
                      {loading ? 'Verifying...' : 'Verify OTP'}
                    </button>
                  </div>
                </form>
              ) : (
                // Step 3: New password form
                <form onSubmit={handleResetPasswordSubmit}>
                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      minLength={6}
                      required
                    />
                    <small className="form-text text-muted">
                      Password must be at least 6 characters long.
                    </small>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                    <input
                      type="password"
                      className="form-control"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <button 
                      type="submit" 
                      className="btn btn-primary w-100"
                      disabled={loading}
                    >
                      {loading ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              )}
              
              <div className="mt-3 text-center">
                <p>
                  Remember your password? <Link to="/login">Back to Login</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword; 