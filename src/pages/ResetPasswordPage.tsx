import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Loader2, CheckCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    // Handle Supabase auth callback with recovery token
    const handleAuthCallback = async () => {
      try {
        // Check if there's a hash fragment with tokens (from email link)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        console.log('Reset password page - checking auth params:', { 
          hasAccessToken: !!accessToken, 
          type,
          hash: window.location.hash.substring(0, 50) + '...'
        });

        // If we have tokens from the URL, set the session
        if (accessToken && type === 'recovery') {
          console.log('Setting session from recovery tokens...');
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          });

          if (error) {
            console.error('Error setting session:', error);
            setIsValidSession(false);
            toast.error('Invalid or expired reset link. Please request a new one.');
            return;
          }

          if (data.session) {
            console.log('Session established for:', data.session.user?.email);
            setIsValidSession(true);
            setUserEmail(data.session.user?.email || '');
            // Clear the hash from URL for cleaner look
            window.history.replaceState(null, '', window.location.pathname);
            return;
          }
        }

        // Otherwise check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Existing session check:', session?.user?.email);
        
        if (session) {
          setIsValidSession(true);
          setUserEmail(session.user?.email || '');
        } else {
          setIsValidSession(false);
          toast.error('Invalid or expired reset link. Please request a new one.');
        }
      } catch (error) {
        console.error('Session check error:', error);
        setIsValidSession(false);
        toast.error('Unable to verify session');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        throw error;
      }

      setIsSuccess(true);
      toast.success('Password updated successfully!');
      
      // Wait a moment then redirect to auth page
      setTimeout(() => {
        navigate('/auth');
      }, 3000);
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast.error(error.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isValidSession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  // Invalid session state
  if (isValidSession === false) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        {/* Header */}
        <header className="border-b border-gray-200 py-4 px-6">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-primary">
              ShippingQuick
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/auth" className="text-gray-600 hover:text-gray-900 font-medium">
                Login
              </Link>
            </div>
          </div>
        </header>
        
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Link Expired</h1>
            <p className="text-gray-600 mb-6">
              This password reset link has expired or is invalid. Please request a new one.
            </p>
            <Button 
              onClick={() => navigate('/auth')} 
              className="bg-primary hover:bg-primary/90"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        {/* Header */}
        <header className="border-b border-gray-200 py-4 px-6">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-primary">
              ShippingQuick
            </Link>
          </div>
        </header>
        
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Password Updated!</h1>
            <p className="text-gray-600 mb-6">
              Your password has been successfully reset. You can now log in with your new password.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Redirecting you to the login page...
            </p>
            <Button 
              onClick={() => navigate('/auth')} 
              className="bg-primary hover:bg-primary/90"
            >
              Go to Login Now
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-primary">
            ShippingQuick
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/auth" className="text-gray-600 hover:text-gray-900 font-medium">
              Login
            </Link>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Create a new password
          </h1>
          
          {/* Email display */}
          {userEmail && (
            <p className="text-center text-gray-600 mb-6 text-sm">
              Resetting password for: <span className="font-medium">{userEmail}</span>
            </p>
          )}
          
          <form onSubmit={handleResetPassword} className="space-y-4">
            {/* New Password Field */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock className="h-5 w-5" />
              </div>
              <Input
                type={showPassword ? "text" : "password"}
                required
                className="pl-10 pr-10 h-12 border-gray-300 rounded-lg"
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            
            {/* Confirm Password Field */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock className="h-5 w-5" />
              </div>
              <Input
                type={showConfirmPassword ? "text" : "password"}
                required
                className="pl-10 pr-10 h-12 border-gray-300 rounded-lg"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {/* Password Match/Validation Feedback */}
            {password && confirmPassword && (
              <div className={`text-sm ${password === confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
                {password === confirmPassword ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" /> Passwords match
                  </span>
                ) : (
                  'Passwords do not match'
                )}
              </div>
            )}
            
            {/* Submit Button - Styled like Pirateship */}
            <Button
              type="submit"
              disabled={isLoading || password !== confirmPassword || password.length < 6}
              className="w-full h-14 bg-[#d9534f] hover:bg-[#c9302c] text-white font-semibold text-lg rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Updating...
                </>
              ) : (
                'Change Password'
              )}
            </Button>
          </form>

          {/* Footer Links */}
          <div className="mt-8 text-center text-sm text-gray-500 space-x-2">
            <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
            <span>-</span>
            <Link to="/terms" className="text-primary hover:underline">Terms of Use</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
