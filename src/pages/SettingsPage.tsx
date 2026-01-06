import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PickupAddressSettings from '@/components/settings/PickupAddressSettings';
import PaymentMethodManager from '@/components/payment/PaymentMethodManager';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import ShipAIChatbot from '@/components/shipping/ShipAIChatbot';
import { MapPin, CreditCard, Truck, User, ChevronLeft, Lock, Mail, Edit2, Send, Shield, Bell } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type SettingsSection = 'menu' | 'pickup-addresses' | 'payment-methods' | 'shipping' | 'account';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState<SettingsSection>('menu');
  const [newEmail, setNewEmail] = useState('');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [isSendingPasswordReset, setIsSendingPasswordReset] = useState(false);

  // Handle Stripe success callback
  useEffect(() => {
    const handleStripeCallback = async () => {
      const sessionId = searchParams.get('session_id');
      const isSetup = searchParams.get('setup') === 'true';
      const canceled = searchParams.get('canceled') === 'true';

      if (sessionId && isSetup) {
        setActiveSection('payment-methods');
        
        try {
          const { data, error } = await supabase.functions.invoke('handle-checkout-success', {
            body: { session_id: sessionId }
          });

          if (error) {
            console.error('Error processing checkout success:', error);
            toast.error('Failed to save payment method. Please try again.');
          } else {
            toast.success('Payment method added successfully!');
          }
        } catch (error) {
          console.error('Error calling handle-checkout-success:', error);
          toast.error('Failed to save payment method. Please try again.');
        }
        
        window.history.replaceState({}, document.title, '/settings');
      } else if (canceled) {
        toast.error('Payment setup was canceled');
        setActiveSection('payment-methods');
        window.history.replaceState({}, document.title, '/settings');
      }
    };

    handleStripeCallback();
  }, [searchParams]);

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEmail) {
      toast.error('Please enter a new email address');
      return;
    }

    setIsUpdatingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) throw error;

      toast.success('Verification email sent to your new address. Please check your inbox.');
      setNewEmail('');
      setIsEditingEmail(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update email');
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleSendPasswordReset = async () => {
    if (!user?.email) {
      toast.error('No email address found');
      return;
    }

    setIsSendingPasswordReset(true);
    try {
      const { error } = await supabase.functions.invoke('request-password-reset', {
        body: { email: user.email }
      });

      if (error) throw error;

      toast.success('Password reset link sent to your email!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send password reset email');
    } finally {
      setIsSendingPasswordReset(false);
    }
  };

  const menuItems = [
    {
      id: 'pickup-addresses' as SettingsSection,
      icon: MapPin,
      title: 'Pickup Addresses',
      description: 'Manage your saved pickup locations for shipping labels and pickups',
      color: 'bg-blue-500/10 text-blue-600'
    },
    {
      id: 'payment-methods' as SettingsSection,
      icon: CreditCard,
      title: 'Payment Methods',
      description: 'Add, remove, or update your credit cards and payment options',
      color: 'bg-green-500/10 text-green-600'
    },
    {
      id: 'shipping' as SettingsSection,
      icon: Truck,
      title: 'Shipping Preferences',
      description: 'Set default carriers, service levels, and notification preferences',
      color: 'bg-purple-500/10 text-purple-600'
    },
    {
      id: 'account' as SettingsSection,
      icon: User,
      title: 'Account Settings',
      description: 'Update your email address, password, and security settings',
      color: 'bg-orange-500/10 text-orange-600'
    }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'pickup-addresses':
        return <PickupAddressSettings />;
      
      case 'payment-methods':
        return <PaymentMethodManager />;
      
      case 'shipping':
        return (
          <Card className="p-6 shadow-lg border-0 bg-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Truck className="h-5 w-5 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold">Shipping Preferences</h2>
            </div>
            
            <div className="space-y-8">
              <div className="p-4 rounded-lg bg-muted/30">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  Preferred Carriers
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['USPS', 'UPS', 'FedEx', 'DHL'].map((carrier) => (
                    <label key={carrier} className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-background transition-colors bg-card">
                      <Checkbox id={carrier} />
                      <span className="text-sm font-medium">{carrier}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/30">
                <h3 className="text-lg font-semibold mb-4">Default Service Level</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {['Ground', 'Express', 'Overnight'].map((service) => (
                    <label key={service} className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-background transition-colors bg-card">
                      <input type="radio" name="service-level" value={service} className="accent-primary" />
                      <span className="text-sm font-medium">{service}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/30">
                <h3 className="text-lg font-semibold mb-4">Default Package Type</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['Parcel', 'Flat Rate Box', 'Envelope', 'Custom'].map((type) => (
                    <label key={type} className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-background transition-colors bg-card">
                      <input type="radio" name="package-type" value={type} className="accent-primary" />
                      <span className="text-sm">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/30">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  Insurance & Security
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-background transition-colors bg-card">
                    <Checkbox id="auto-insurance" />
                    <span className="text-sm">Automatically add insurance for shipments over $100</span>
                  </label>
                  <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-background transition-colors bg-card">
                    <Checkbox id="signature-confirmation" />
                    <span className="text-sm">Require signature confirmation by default</span>
                  </label>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/30">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  Notifications
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-background transition-colors bg-card">
                    <Checkbox id="email-tracking" />
                    <span className="text-sm">Send tracking emails to recipients</span>
                  </label>
                  <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-background transition-colors bg-card">
                    <Checkbox id="delivery-alerts" />
                    <span className="text-sm">Receive delivery confirmation alerts</span>
                  </label>
                </div>
              </div>

              <Button className="w-full md:w-auto" size="lg">
                Save Shipping Preferences
              </Button>
            </div>
          </Card>
        );
      
      case 'account':
        return (
          <div className="space-y-6">
            {/* Email Section */}
            <Card className="p-6 shadow-lg border-0">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Email Address</h2>
                  <p className="text-sm text-muted-foreground">Manage your account email</p>
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Current Email</p>
                    <p className="font-medium text-lg">{user?.email}</p>
                  </div>
                  {!isEditingEmail && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsEditingEmail(true)}
                      className="gap-2"
                    >
                      <Edit2 className="h-4 w-4" />
                      Change
                    </Button>
                  )}
                </div>
                
                {isEditingEmail && (
                  <form onSubmit={handleEmailChange} className="mt-4 pt-4 border-t space-y-4">
                    <div>
                      <Label htmlFor="new-email">New Email Address</Label>
                      <Input
                        id="new-email"
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="Enter new email address"
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={isUpdatingEmail} size="sm">
                        {isUpdatingEmail ? 'Sending...' : 'Update Email'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setIsEditingEmail(false);
                          setNewEmail('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      A verification link will be sent to your new email address.
                    </p>
                  </form>
                )}
              </div>
            </Card>

            {/* Password Section */}
            <Card className="p-6 shadow-lg border-0">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Lock className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Password</h2>
                  <p className="text-sm text-muted-foreground">Secure your account with a strong password</p>
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Password</p>
                    <p className="font-medium">••••••••••••</p>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={handleSendPasswordReset}
                    disabled={isSendingPasswordReset}
                    className="gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {isSendingPasswordReset ? 'Sending...' : 'Change Password'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Click to receive a password reset link at {user?.email}
                </p>
              </div>
            </Card>

            {/* Security Info */}
            <Card className="p-6 shadow-lg border-0 bg-gradient-to-br from-primary/5 to-primary/10">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Account Security</h3>
                  <p className="text-sm text-muted-foreground">
                    Your account is protected with industry-standard encryption. We recommend using a strong, unique password and keeping your email up to date.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {activeSection === 'menu' ? (
        <>
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Settings</h1>
            <p className="text-muted-foreground">Manage your account preferences and configurations</p>
          </div>
          <div className="space-y-4">
            {menuItems.map((item) => (
              <Card
                key={item.id}
                className="p-6 cursor-pointer hover:shadow-lg transition-all duration-200 border-0 shadow-md hover:scale-[1.01]"
                onClick={() => setActiveSection(item.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${item.color}`}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-0.5">{item.title}</h3>
                    <p className="text-muted-foreground text-sm">{item.description}</p>
                  </div>
                  <ChevronLeft className="h-5 w-5 text-muted-foreground rotate-180" />
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <>
          <Button
            variant="ghost"
            className="mb-6 -ml-2 hover:bg-muted/50"
            onClick={() => setActiveSection('menu')}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Settings
          </Button>
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">
              {menuItems.find(item => item.id === activeSection)?.title}
            </h1>
            <p className="text-muted-foreground">
              {menuItems.find(item => item.id === activeSection)?.description}
            </p>
          </div>
          {renderContent()}
        </>
      )}

      <ShipAIChatbot />
    </div>
  );
};

export default SettingsPage;
