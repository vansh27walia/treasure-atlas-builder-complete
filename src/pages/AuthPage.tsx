import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Mail, Key, Loader2, LogIn, User, UserPlus, Lock, AtSign, ArrowLeft } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
interface LoginFormValues {
  email: string;
  password: string;
}
interface SignupFormValues {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}
interface ForgotPasswordFormValues {
  email: string;
}
const AuthPage: React.FC = () => {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'signup' | 'forgot-password'>('login');
  const loginForm = useForm<LoginFormValues>();
  const signupForm = useForm<SignupFormValues>();
  const forgotPasswordForm = useForm<ForgotPasswordFormValues>();

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/" replace />;
  }
  const handleLogin = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password
      });
      if (error) {
        throw error;
      }
      console.log('Login successful:', data);
      toast.success('Logged in successfully');
      navigate('/');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Failed to log in');
    } finally {
      setIsLoading(false);
    }
  };
  const handleSignup = async (values: SignupFormValues) => {
    if (values.password !== values.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setIsLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: values.fullName
          }
        }
      });
      if (error) {
        throw error;
      }
      console.log('Signup successful:', data);
      toast.success('Account created successfully! Please check your email to verify your account.');
      setActiveTab('login');
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };
  const handleForgotPassword = async (values: ForgotPasswordFormValues) => {
    setIsLoading(true);
    try {
      const {
        error
      } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      if (error) {
        throw error;
      }
      toast.success('Password reset email sent. Please check your inbox.');
      setActiveTab('login');
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast.error(error.message || 'Failed to send password reset email');
    } finally {
      setIsLoading(false);
    }
  };
  const handleGoogleLogin = async () => {
    try {
      const {
        data,
        error
      } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      toast.error(error.message || 'Failed to log in with Google');
    }
  };
  return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-center font-extrabold text-slate-950 text-2xl">Welcome to 
ShipQuick
App</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {activeTab === 'login' && 'Sign in to your account'}
            {activeTab === 'signup' && 'Create your account'}
            {activeTab === 'forgot-password' && 'Reset your password'}
          </p>
        </div>
        
        <Card className="mt-8 p-6 shadow-xl border-0">
          {activeTab === 'forgot-password' ? <div className="space-y-4">
              <Button variant="ghost" className="mb-4 p-0 h-auto text-blue-600 hover:text-blue-800" onClick={() => setActiveTab('login')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
              
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Forgot Password</h3>
                <p className="text-sm text-gray-600 mt-2">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>
              
              <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)} className="space-y-4">
                <div>
                  <Label htmlFor="forgotEmail">Email Address</Label>
                  <div className="mt-1 relative">
                    <AtSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input id="forgotEmail" type="email" autoComplete="email" required className="pl-10" placeholder="Enter your email" {...forgotPasswordForm.register('email', {
                  required: true
                })} />
                  </div>
                </div>
                
                <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  {isLoading ? <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Reset Link...
                    </> : <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Reset Link
                    </>}
                </Button>
              </form>
            </div> : <Tabs value={activeTab} onValueChange={value => setActiveTab(value as 'login' | 'signup')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Sign Up
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="mt-6">
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <div className="mt-1 relative">
                      <AtSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input id="email" type="email" autoComplete="email" required className="pl-10" placeholder="Enter your email" {...loginForm.register('email', {
                    required: true
                  })} />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <div className="mt-1 relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input id="password" type="password" autoComplete="current-password" required className="pl-10" placeholder="Enter your password" {...loginForm.register('password', {
                    required: true
                  })} />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Button type="button" variant="link" className="text-sm text-blue-600 hover:text-blue-800" onClick={() => setActiveTab('forgot-password')}>
                      Forgot your password?
                    </Button>
                  </div>
                  
                  <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    {isLoading ? <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </> : <>
                        <LogIn className="mr-2 h-4 w-4" />
                        Sign In
                      </>}
                  </Button>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-500">Or continue with</span>
                    </div>
                  </div>
                  
                  <Button type="button" variant="outline" className="w-full" onClick={handleGoogleLogin}>
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Sign in with Google
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="mt-6">
                <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <div className="mt-1 relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input id="fullName" type="text" autoComplete="name" required className="pl-10" placeholder="Enter your full name" {...signupForm.register('fullName', {
                    required: true
                  })} />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="signupEmail">Email Address</Label>
                    <div className="mt-1 relative">
                      <AtSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input id="signupEmail" type="email" autoComplete="email" required className="pl-10" placeholder="Enter your email" {...signupForm.register('email', {
                    required: true
                  })} />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="signupPassword">Password</Label>
                    <div className="mt-1 relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input id="signupPassword" type="password" autoComplete="new-password" required className="pl-10" placeholder="Create a password" {...signupForm.register('password', {
                    required: true
                  })} />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="mt-1 relative">
                      <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input id="confirmPassword" type="password" autoComplete="new-password" required className="pl-10" placeholder="Confirm your password" {...signupForm.register('confirmPassword', {
                    required: true
                  })} />
                    </div>
                  </div>
                  
                  <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    {isLoading ? <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </> : <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Create Account
                      </>}
                  </Button>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-500">Or continue with</span>
                    </div>
                  </div>
                  
                  <Button type="button" variant="outline" className="w-full" onClick={handleGoogleLogin}>
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Sign up with Google
                  </Button>
                </form>
              </TabsContent>
            </Tabs>}
        </Card>
      </div>
    </div>;
};
export default AuthPage;