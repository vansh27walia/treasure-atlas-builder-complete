import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Loader2, CheckCircle, Mail, ArrowLeft, ShieldCheck, Eye, EyeOff } from 'lucide-react';
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
    // Check if this is a valid password reset session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Reset password session check:', session?.user?.email);
        
        if (session) {
          setIsValidSession(true);
          setUserEmail(session.user?.email || '');
        } else {
          setIsValidSession(false);
          toast.error('Invalid or expired reset link. Please request a new one.');
          setTimeout(() => navigate('/auth'), 2000);
        }
      } catch (error) {
        console.error('Session check error:', error);
        setIsValidSession(false);
        toast.error('Unable to verify session');
        setTimeout(() => navigate('/auth'), 2000);
      }
    };

    checkSession();
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

    if (password.length < 8) {
      toast.warning('Consider using a stronger password (8+ characters recommended)');
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Verifying reset link...</h2>
          <p className="text-gray-600 mt-2">Please wait while we verify your session</p>
        </div>
      </div>
    );
  }

  // Invalid session state
  if (isValidSession === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
        <Card className="max-w-md w-full p-8 text-center shadow-xl border-0">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Link Expired</h2>
          <p className="text-gray-600 mb-6">
            This password reset link has expired or is invalid. Please request a new one.
          </p>
          <Button 
            onClick={() => navigate('/auth')} 
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Button>
        </Card>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <Card className="max-w-md w-full p-8 text-center shadow-xl border-0">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Password Updated! 🎉</h2>
          <p className="text-gray-600 mb-6">
            Your password has been successfully reset. You can now log in with your new password.
          </p>
          <div className="bg-green-50 p-4 rounded-lg mb-6 border border-green-200">
            <p className="text-green-700 text-sm">
              Redirecting you to the login page in a few seconds...
            </p>
          </div>
          <Button 
            onClick={() => navigate('/auth')} 
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            Go to Login Now
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create New Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Choose a strong password for your account
          </p>
        </div>
        
        <Card className="mt-8 p-8 shadow-xl border-0">
          {/* User Email Display */}
          {userEmail && (
            <div className="bg-indigo-50 p-4 rounded-lg mb-6 border border-indigo-200">
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-indigo-600 mr-3" />
                <div>
                  <p className="text-xs text-indigo-600 font-medium uppercase tracking-wide">Resetting password for</p>
                  <p className="text-sm font-semibold text-indigo-900">{userEmail}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleResetPassword} className="space-y-6">
            {/* New Password Field */}
            <div>
              <Label htmlFor="password" className="text-gray-700 font-medium">New Password</Label>
              <div className="mt-2 relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="pl-10 pr-10 h-12 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">Minimum 6 characters required</p>
            </div>
            
            {/* Confirm Password Field */}
            <div>
              <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">Confirm New Password</Label>
              <div className="mt-2 relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  className="pl-10 pr-10 h-12 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Password Match Indicator */}
            {confirmPassword && (
              <div className={`p-3 rounded-lg ${password === confirmPassword ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <p className={`text-sm flex items-center ${password === confirmPassword ? 'text-green-700' : 'text-red-700'}`}>
                  {password === confirmPassword ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Passwords match
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Passwords do not match
                    </>
                  )}
                </p>
              </div>
            )}
            
            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || password !== confirmPassword || password.length < 6}
              className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Updating Password...
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-2 h-5 w-5" />
                  Update Password
                </>
              )}
            </Button>

            {/* Back to Login Link */}
            <div className="text-center pt-4">
              <Button 
                type="button"
                variant="ghost" 
                onClick={() => navigate('/auth')}
                className="text-indigo-600 hover:text-indigo-800"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
            </div>
          </form>
        </Card>

        {/* Security Tips */}
        <div className="bg-white/60 backdrop-blur-sm p-4 rounded-lg border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">🔒 Password Security Tips</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Use a mix of letters, numbers, and symbols</li>
            <li>• Avoid using personal information</li>
            <li>• Don't reuse passwords from other accounts</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
