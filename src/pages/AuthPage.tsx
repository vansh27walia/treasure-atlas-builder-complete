
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Mail, Key, Loader2, LogIn, User, UserPlus, Lock, AtSign } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';

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

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  
  const loginForm = useForm<LoginFormValues>();
  const signupForm = useForm<SignupFormValues>();
  
  const handleLogin = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      
      if (error) {
        throw error;
      }
      
      toast.success('Logged in successfully');
      navigate('/dashboard');
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
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName,
          },
        },
      });
      
      if (error) {
        throw error;
      }
      
      toast.success('Account created successfully! Please check your email to verify your account.');
      setActiveTab('login');
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoogleLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      
      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      toast.error(error.message || 'Failed to log in with Google');
    }
  };
  
  const handleForgotPassword = async () => {
    const email = loginForm.getValues('email');
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        throw error;
      }
      
      toast.success('Password reset email sent. Please check your inbox.');
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast.error(error.message || 'Failed to send password reset email');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto max-w-md py-12">
      <div className="flex justify-center mb-8">
        <h1 className="text-3xl font-bold text-center">Welcome to Shipping App</h1>
      </div>
      
      <Card className="border-2 border-gray-200 shadow-sm p-6">
        <Tabs defaultValue={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'signup')}>
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="login" className="font-medium">
              <LogIn className="mr-2 h-4 w-4" />
              Log In
            </TabsTrigger>
            <TabsTrigger value="signup" className="font-medium">
              <UserPlus className="mr-2 h-4 w-4" />
              Sign Up
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <div>
                <Label htmlFor="email" className="flex items-center">
                  <AtSign className="mr-2 h-4 w-4 text-gray-500" />
                  Email
                </Label>
                <Input 
                  id="email" 
                  type="email" 
                  autoComplete="email"
                  placeholder="youremail@example.com" 
                  {...loginForm.register('email', { required: true })}
                />
              </div>
              
              <div>
                <Label htmlFor="password" className="flex items-center">
                  <Lock className="mr-2 h-4 w-4 text-gray-500" />
                  Password
                </Label>
                <Input 
                  id="password" 
                  type="password" 
                  autoComplete="current-password"
                  placeholder="••••••••" 
                  {...loginForm.register('password', { required: true })}
                />
              </div>
              
              <div className="flex justify-end">
                <Button 
                  type="button" 
                  variant="link" 
                  size="sm"
                  className="text-blue-600"
                  onClick={handleForgotPassword}
                >
                  Forgot password?
                </Button>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Log In
                  </>
                )}
              </Button>
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or continue with</span>
                </div>
              </div>
              
              <Button 
                type="button" 
                variant="outline" 
                className="w-full"
                onClick={handleGoogleLogin}
              >
                <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                  <path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" fill="#4285f4" />
                </svg>
                Sign in with Google
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="signup">
            <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
              <div>
                <Label htmlFor="fullName" className="flex items-center">
                  <User className="mr-2 h-4 w-4 text-gray-500" />
                  Full Name
                </Label>
                <Input 
                  id="fullName" 
                  type="text"
                  autoComplete="name"
                  placeholder="John Doe" 
                  {...signupForm.register('fullName', { required: true })}
                />
              </div>
              
              <div>
                <Label htmlFor="signupEmail" className="flex items-center">
                  <AtSign className="mr-2 h-4 w-4 text-gray-500" />
                  Email
                </Label>
                <Input 
                  id="signupEmail" 
                  type="email"
                  autoComplete="email"
                  placeholder="youremail@example.com" 
                  {...signupForm.register('email', { required: true })}
                />
              </div>
              
              <div>
                <Label htmlFor="signupPassword" className="flex items-center">
                  <Lock className="mr-2 h-4 w-4 text-gray-500" />
                  Password
                </Label>
                <Input 
                  id="signupPassword" 
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••" 
                  {...signupForm.register('password', { required: true })}
                />
              </div>
              
              <div>
                <Label htmlFor="confirmPassword" className="flex items-center">
                  <Key className="mr-2 h-4 w-4 text-gray-500" />
                  Confirm Password
                </Label>
                <Input 
                  id="confirmPassword" 
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••" 
                  {...signupForm.register('confirmPassword', { required: true })}
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create Account
                  </>
                )}
              </Button>
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or continue with</span>
                </div>
              </div>
              
              <Button 
                type="button" 
                variant="outline" 
                className="w-full"
                onClick={handleGoogleLogin}
              >
                <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                  <path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" fill="#4285f4" />
                </svg>
                Sign up with Google
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default AuthPage;
