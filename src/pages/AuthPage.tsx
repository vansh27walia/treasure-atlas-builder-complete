import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Mail, Loader2, LogIn, User, UserPlus, Lock, AtSign, ArrowLeft, Phone, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

interface LoginFormValues {
  email: string;
  password: string;
}

interface SignupFormValues {
  fullName: string;
  email: string;
  countryCode: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
}

interface ForgotPasswordFormValues {
  email: string;
}

// Country codes with dial codes
const COUNTRY_CODES = [
  { code: 'US', dial: '+1', name: 'United States' },
  { code: 'CA', dial: '+1', name: 'Canada' },
  { code: 'GB', dial: '+44', name: 'United Kingdom' },
  { code: 'AU', dial: '+61', name: 'Australia' },
  { code: 'DE', dial: '+49', name: 'Germany' },
  { code: 'FR', dial: '+33', name: 'France' },
  { code: 'IN', dial: '+91', name: 'India' },
  { code: 'CN', dial: '+86', name: 'China' },
  { code: 'JP', dial: '+81', name: 'Japan' },
  { code: 'BR', dial: '+55', name: 'Brazil' },
  { code: 'MX', dial: '+52', name: 'Mexico' },
  { code: 'ES', dial: '+34', name: 'Spain' },
  { code: 'IT', dial: '+39', name: 'Italy' },
  { code: 'NL', dial: '+31', name: 'Netherlands' },
  { code: 'AE', dial: '+971', name: 'UAE' },
  { code: 'SA', dial: '+966', name: 'Saudi Arabia' },
  { code: 'SG', dial: '+65', name: 'Singapore' },
  { code: 'HK', dial: '+852', name: 'Hong Kong' },
  { code: 'KR', dial: '+82', name: 'South Korea' },
  { code: 'PH', dial: '+63', name: 'Philippines' },
  { code: 'TH', dial: '+66', name: 'Thailand' },
  { code: 'MY', dial: '+60', name: 'Malaysia' },
  { code: 'ID', dial: '+62', name: 'Indonesia' },
  { code: 'VN', dial: '+84', name: 'Vietnam' },
  { code: 'PK', dial: '+92', name: 'Pakistan' },
  { code: 'BD', dial: '+880', name: 'Bangladesh' },
  { code: 'NG', dial: '+234', name: 'Nigeria' },
  { code: 'ZA', dial: '+27', name: 'South Africa' },
  { code: 'EG', dial: '+20', name: 'Egypt' },
  { code: 'TR', dial: '+90', name: 'Turkey' },
  { code: 'RU', dial: '+7', name: 'Russia' },
  { code: 'PL', dial: '+48', name: 'Poland' },
  { code: 'UA', dial: '+380', name: 'Ukraine' },
  { code: 'AR', dial: '+54', name: 'Argentina' },
  { code: 'CL', dial: '+56', name: 'Chile' },
  { code: 'CO', dial: '+57', name: 'Colombia' },
  { code: 'PE', dial: '+51', name: 'Peru' },
  { code: 'NZ', dial: '+64', name: 'New Zealand' },
  { code: 'IE', dial: '+353', name: 'Ireland' },
  { code: 'SE', dial: '+46', name: 'Sweden' },
  { code: 'NO', dial: '+47', name: 'Norway' },
  { code: 'DK', dial: '+45', name: 'Denmark' },
  { code: 'FI', dial: '+358', name: 'Finland' },
  { code: 'CH', dial: '+41', name: 'Switzerland' },
  { code: 'AT', dial: '+43', name: 'Austria' },
  { code: 'BE', dial: '+32', name: 'Belgium' },
  { code: 'PT', dial: '+351', name: 'Portugal' },
  { code: 'GR', dial: '+30', name: 'Greece' },
  { code: 'IL', dial: '+972', name: 'Israel' },
];

const AuthPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'signup' | 'forgot-password' | 'verify-otp'>('login');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // OTP verification state
  const [otpValue, setOtpValue] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingPhoneNumber, setPendingPhoneNumber] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const loginForm = useForm<LoginFormValues>();
  const signupForm = useForm<SignupFormValues>({
    defaultValues: {
      countryCode: '+1'
    }
  });
  const forgotPasswordForm = useForm<ForgotPasswordFormValues>();

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/" replace />;
  }

  // Resend OTP cooldown timer
  React.useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleLogin = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
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
      // Get country code from form (with fallback)
      const countryCode = (values.countryCode || '+1').startsWith('+') 
        ? (values.countryCode || '+1') 
        : `+${values.countryCode || '1'}`;

      // Combine country code and phone number properly
      const fullPhoneNumber = values.phoneNumber 
        ? `${countryCode}${values.phoneNumber.replace(/[^\d]/g, '')}` 
        : null;

      // Use signUp with OTP type for email verification
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName,
            phone_number: fullPhoneNumber
          }
        }
      });
      
      if (error) {
        if (error.message?.includes('already registered') || error.message?.includes('already exists')) {
          toast.error('This email is already registered. Please sign in instead.');
          setActiveTab('login');
          return;
        }
        throw error;
      }
      
      // Store pending data for OTP verification
      setPendingEmail(values.email);
      setPendingPhoneNumber(fullPhoneNumber);
      
      // If user needs email confirmation, switch to OTP view
      if (data?.user && !data.session) {
        toast.success('Account created! Please check your email for the verification code.');
        setActiveTab('verify-otp');
        setResendCooldown(60); // 60 second cooldown
      } else if (data?.session) {
        // Auto-confirmed, save phone and go to dashboard
        if (data.user && fullPhoneNumber) {
          await supabase.from('user_profiles').upsert({
            id: data.user.id,
            phone_number: fullPhoneNumber
          }, { onConflict: 'id' });
        }
        toast.success('Account created and logged in successfully!');
        navigate('/');
      }
      
      console.log('Signup successful:', data);
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpValue.length !== 6) {
      toast.error('Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: pendingEmail,
        token: otpValue,
        type: 'email'
      });

      if (error) {
        throw error;
      }

      // Save phone number to user_profiles after successful verification
      if (data.user && pendingPhoneNumber) {
        await supabase.from('user_profiles').upsert({
          id: data.user.id,
          phone_number: pendingPhoneNumber
        }, { onConflict: 'id' });
      }

      toast.success('Email verified successfully! Welcome aboard!');
      navigate('/');
    } catch (error: any) {
      console.error('OTP verification error:', error);
      toast.error(error.message || 'Invalid or expired verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: pendingEmail
      });

      if (error) {
        throw error;
      }

      toast.success('Verification code resent! Check your email.');
      setResendCooldown(60);
      setOtpValue('');
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      toast.error(error.message || 'Failed to resend verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (values: ForgotPasswordFormValues) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: 'https://app.shippingquick.io/reset-password'
      });

      if (error) {
        console.error('Password reset error:', error);
        throw error;
      }

      toast.success('If an account exists with this email, you will receive a password reset link.');
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
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://app.shippingquick.io/'
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-center font-extrabold text-slate-950 text-2xl">Welcome to ShippingQuick.io</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {activeTab === 'login' && 'Sign in to your account'}
            {activeTab === 'signup' && 'Create your account'}
            {activeTab === 'forgot-password' && 'Reset your password'}
            {activeTab === 'verify-otp' && 'Verify your email'}
          </p>
        </div>
        
        <Card className="mt-8 p-6 shadow-xl border-0">
          {/* OTP Verification View */}
          {activeTab === 'verify-otp' && (
            <div className="space-y-6">
              <Button 
                variant="ghost" 
                className="mb-4 p-0 h-auto text-blue-600 hover:text-blue-800" 
                onClick={() => {
                  setActiveTab('signup');
                  setOtpValue('');
                }}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sign Up
              </Button>
              
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Mail className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Check your email</h3>
                <p className="text-sm text-gray-600 mt-2">
                  We sent a verification code to
                </p>
                <p className="text-sm font-medium text-gray-900 mt-1">{pendingEmail}</p>
              </div>
              
              <div className="flex flex-col items-center space-y-4">
                <InputOTP 
                  maxLength={6} 
                  value={otpValue} 
                  onChange={setOtpValue}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
                
                <Button 
                  onClick={handleVerifyOTP} 
                  disabled={isLoading || otpValue.length !== 6}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify Email'
                  )}
                </Button>
                
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Didn't receive the code?
                  </p>
                  <Button 
                    variant="link" 
                    className="text-blue-600 hover:text-blue-800 p-0 h-auto"
                    onClick={handleResendOTP}
                    disabled={resendCooldown > 0 || isLoading}
                  >
                    <RefreshCw className={`mr-1 h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                    {resendCooldown > 0 
                      ? `Resend in ${resendCooldown}s` 
                      : 'Resend Code'
                    }
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Forgot Password View */}
          {activeTab === 'forgot-password' && (
            <div className="space-y-4">
              <Button 
                variant="ghost" 
                className="mb-4 p-0 h-auto text-blue-600 hover:text-blue-800" 
                onClick={() => setActiveTab('login')}
              >
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
                    <Input 
                      id="forgotEmail" 
                      type="email" 
                      autoComplete="email" 
                      required 
                      className="pl-10" 
                      placeholder="Enter your email" 
                      {...forgotPasswordForm.register('email', { required: true })} 
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Reset Link...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Reset Link
                    </>
                  )}
                </Button>
              </form>
            </div>
          )}

          {/* Login/Signup Tabs */}
          {(activeTab === 'login' || activeTab === 'signup') && (
            <Tabs value={activeTab} onValueChange={value => setActiveTab(value as 'login' | 'signup')}>
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
                      <Input 
                        id="email" 
                        type="email" 
                        autoComplete="email" 
                        required 
                        className="pl-10" 
                        placeholder="Enter your email" 
                        {...loginForm.register('email', { required: true })} 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <div className="mt-1 relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input 
                        id="password" 
                        type={showLoginPassword ? "text" : "password"} 
                        autoComplete="current-password" 
                        required 
                        className="pl-10 pr-10" 
                        placeholder="Enter your password" 
                        {...loginForm.register('password', { required: true })} 
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Button 
                      type="button" 
                      variant="link" 
                      className="text-sm text-blue-600 hover:text-blue-800" 
                      onClick={() => setActiveTab('forgot-password')}
                    >
                      Forgot your password?
                    </Button>
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={isLoading} 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        <LogIn className="mr-2 h-4 w-4" />
                        Sign In
                      </>
                    )}
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
                      <Input 
                        id="fullName" 
                        type="text" 
                        autoComplete="name" 
                        required 
                        className="pl-10" 
                        placeholder="Enter your full name" 
                        {...signupForm.register('fullName', { required: true })} 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="signupEmail">Email Address</Label>
                    <div className="mt-1 relative">
                      <AtSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input 
                        id="signupEmail" 
                        type="email" 
                        autoComplete="email" 
                        required 
                        className="pl-10" 
                        placeholder="Enter your email" 
                        {...signupForm.register('email', { required: true })} 
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <div className="mt-1 flex gap-2">
                      <Select 
                        value={signupForm.watch('countryCode') || '+1'}
                        onValueChange={(value) => signupForm.setValue('countryCode', value)}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="+1" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {COUNTRY_CODES.map((country) => (
                            <SelectItem key={country.code} value={country.dial}>
                              {country.dial} ({country.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="relative flex-1">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input 
                          id="phoneNumber" 
                          type="tel" 
                          autoComplete="tel" 
                          className="pl-10" 
                          placeholder="Phone number" 
                          {...signupForm.register('phoneNumber')} 
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="signupPassword">Password</Label>
                    <div className="mt-1 relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input 
                        id="signupPassword" 
                        type={showSignupPassword ? "text" : "password"} 
                        autoComplete="new-password" 
                        required 
                        className="pl-10 pr-10" 
                        placeholder="Create a password" 
                        {...signupForm.register('password', { required: true })} 
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="mt-1 relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input 
                        id="confirmPassword" 
                        type={showConfirmPassword ? "text" : "password"} 
                        autoComplete="new-password" 
                        required 
                        className="pl-10 pr-10" 
                        placeholder="Confirm your password" 
                        {...signupForm.register('confirmPassword', { required: true })} 
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={isLoading} 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Create Account
                      </>
                    )}
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
            </Tabs>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;
