import { useState, useContext, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const VerifyEmail = () => {
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendSuccess, setResendSuccess] = useState(false);
  
  const { verifyEmail, resendVerification } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Get email from location state
    if (location.state && location.state.email) {
      setEmail(location.state.email);
    } else {
      // No email provided, redirect to register
      navigate('/register');
    }
  }, [location, navigate]);
  
  const onChange = (e) => {
    setOtp(e.target.value);
  };
  
  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await verifyEmail({ email, otp });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
      setLoading(false);
    }
  };
  
  const handleResend = async () => {
    setResendLoading(true);
    setError('');
    setResendSuccess(false);
    
    try {
      await resendVerification(email);
      setResendSuccess(true);
      setTimeout(() => {
        setResendSuccess(false);
      }, 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };
  
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h2 className="card-title text-center mb-4">Email Verification</h2>
              
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              
              {resendSuccess && (
                <div className="alert alert-success" role="alert">
                  OTP sent successfully to your email.
                </div>
              )}
              
              <p className="text-center mb-4">
                Please enter the 6-digit code sent to {email}
              </p>
              
              <form onSubmit={onSubmit}>
                <div className="mb-3">
                  <label htmlFor="otp" className="form-label">Verification Code</label>
                  <input 
                    type="text" 
                    className="form-control text-center" 
                    id="otp" 
                    name="otp"
                    value={otp}
                    onChange={onChange}
                    required
                    minLength="6"
                    maxLength="6"
                    placeholder="Enter 6-digit code"
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-primary w-100"
                  disabled={loading}
                >
                  {loading ? 'Verifying...' : 'Verify Email'}
                </button>
              </form>
              
              <div className="text-center mt-3">
                <p>Didn't receive the code?</p>
                <button 
                  className="btn btn-link" 
                  onClick={handleResend}
                  disabled={resendLoading}
                >
                  {resendLoading ? 'Sending...' : 'Resend Code'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail; 