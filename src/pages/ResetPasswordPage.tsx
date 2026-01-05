import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Loader2, CheckCircle, ArrowLeft, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

type PageState = 'loading' | 'valid' | 'invalid' | 'success';

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const processRecoveryToken = async () => {
      try {
        // 1) PKCE flow (most common now): ?code=...
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get('code');
        const errorDescription = searchParams.get('error_description');

        if (errorDescription) {
          setErrorMessage(decodeURIComponent(errorDescription));
          setPageState('invalid');
          return;
        }

        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            setErrorMessage(error.message || 'The recovery link is invalid or has expired.');
            setPageState('invalid');
            return;
          }

          if (data.session?.user) {
            setUserEmail(data.session.user.email || '');
            setPageState('valid');
            window.history.replaceState(null, '', window.location.pathname);
            return;
          }
        }

        // 2) Legacy/implicit flow: #access_token=...&refresh_token=...&type=recovery
        const hashFragment = window.location.hash.substring(1);
        if (hashFragment) {
          const params = new URLSearchParams(hashFragment);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          const type = params.get('type');
          const hashError = params.get('error_description');

          if (hashError) {
            setErrorMessage(decodeURIComponent(hashError));
            setPageState('invalid');
            return;
          }

          if (accessToken && type === 'recovery') {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || ''
            });

            if (error) {
              setErrorMessage(error.message || 'The recovery link is invalid or has expired.');
              setPageState('invalid');
              return;
            }

            if (data.session?.user) {
              setUserEmail(data.session.user.email || '');
              setPageState('valid');
              window.history.replaceState(null, '', window.location.pathname);
              return;
            }
          }
        }

        // 3) Fallback: existing session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUserEmail(session.user.email || '');
          setPageState('valid');
          return;
        }

        setErrorMessage('No valid recovery session found. Please request a new password reset link.');
        setPageState('invalid');
      } catch (error) {
        console.error('Error processing recovery token:', error);
        setErrorMessage('An error occurred while processing the recovery link.');
        setPageState('invalid');
      }
    };

    // Also listen for auth state changes (PASSWORD_RECOVERY event)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session?.user) {
        setUserEmail(session.user.email || '');
        setPageState('valid');
      }
    });

    processRecoveryToken();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords match
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Validate password length
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Updating password...');
      
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('Password update error:', error);
        throw error;
      }

      console.log('Password updated successfully');
      setPageState('success');
      toast.success('Password updated successfully!');
      
      // Sign out and redirect to login after success
      await supabase.auth.signOut();
      
      setTimeout(() => {
        navigate('/auth');
      }, 3000);

    } catch (error: any) {
      console.error('Password reset error:', error);
      toast.error(error.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Verifying your reset link...</p>
        </div>
      </div>
    );
  }

  // Invalid/expired link state
  if (pageState === 'invalid') {
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
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Link Expired or Invalid</h1>
            <p className="text-gray-600 mb-6">
              {errorMessage || 'This password reset link has expired or is invalid. Please request a new one.'}
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => navigate('/auth')} 
                className="w-full bg-primary hover:bg-primary/90"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
              <p className="text-sm text-gray-500">
                Need a new reset link? Go to login and click "Forgot your password?"
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (pageState === 'success') {
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
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Password Changed!</h1>
            <p className="text-gray-600 mb-6">
              Your password has been successfully updated. You can now log in with your new password.
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

  // Valid session - show password reset form
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
          
          {/* Email (pre-filled) */}
          {userEmail && (
            <div className="mb-6">
              <Input value={userEmail} readOnly disabled className="h-12" />
            </div>
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
                minLength={6}
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
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {/* Password validation feedback */}
            {password && (
              <div className="space-y-1 text-sm">
                <div className={password.length >= 6 ? 'text-green-600' : 'text-gray-500'}>
                  {password.length >= 6 ? '✓' : '○'} At least 6 characters
                </div>
                {confirmPassword && (
                  <div className={password === confirmPassword ? 'text-green-600' : 'text-red-600'}>
                    {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </div>
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
                  Updating Password...
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
