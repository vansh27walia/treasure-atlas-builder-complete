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
import { MapPin, CreditCard, Truck, User, ChevronLeft, Lock, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type SettingsSection = 'menu' | 'pickup-addresses' | 'payment-methods' | 'shipping' | 'account';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState<SettingsSection>('menu');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

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

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

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
    } catch (error: any) {
      toast.error(error.message || 'Failed to update email');
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const menuItems = [
    {
      id: 'pickup-addresses' as SettingsSection,
      icon: MapPin,
      title: 'Pickup Addresses',
      description: 'Manage your saved pickup locations for shipping labels and pickups'
    },
    {
      id: 'payment-methods' as SettingsSection,
      icon: CreditCard,
      title: 'Payment Methods',
      description: 'Add, remove, or update your credit cards and payment options'
    },
    {
      id: 'shipping' as SettingsSection,
      icon: Truck,
      title: 'Shipping Preferences',
      description: 'Set default carriers, service levels, and notification preferences'
    },
    {
      id: 'account' as SettingsSection,
      icon: User,
      title: 'Account Settings',
      description: 'Update your email address, password, and security settings'
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
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">Shipping Preferences</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Preferred Carriers</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['USPS', 'UPS', 'FedEx', 'DHL'].map((carrier) => (
                    <label key={carrier} className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                      <Checkbox id={carrier} />
                      <span className="text-sm font-medium">{carrier}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Default Service Level</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {['Ground', 'Express', 'Overnight'].map((service) => (
                    <label key={service} className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                      <input type="radio" name="service-level" value={service} />
                      <span className="text-sm font-medium">{service}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Default Package Type</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['Parcel', 'Flat Rate Box', 'Envelope', 'Custom'].map((type) => (
                    <label key={type} className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                      <input type="radio" name="package-type" value={type} />
                      <span className="text-sm">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Insurance Preferences</h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <Checkbox id="auto-insurance" />
                    <span className="text-sm">Automatically add insurance for shipments over $100</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <Checkbox id="signature-confirmation" />
                    <span className="text-sm">Require signature confirmation by default</span>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Notification Preferences</h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <Checkbox id="email-tracking" />
                    <span className="text-sm">Send tracking emails to recipients</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <Checkbox id="delivery-alerts" />
                    <span className="text-sm">Receive delivery confirmation alerts</span>
                  </label>
                </div>
              </div>

              <Button className="w-full md:w-auto">
                Save Shipping Preferences
              </Button>
            </div>
          </Card>
        );
      
      case 'account':
        return (
          <div className="space-y-6">
            {/* Change Email */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Mail className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">Change Email Address</h2>
              </div>
              <p className="text-muted-foreground text-sm mb-4">
                Current email: <span className="font-medium text-foreground">{user?.email}</span>
              </p>
              <form onSubmit={handleEmailChange} className="space-y-4">
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
                <Button type="submit" disabled={isUpdatingEmail}>
                  {isUpdatingEmail ? 'Sending verification...' : 'Update Email'}
                </Button>
              </form>
            </Card>

            {/* Change Password */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">Change Password</h2>
              </div>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="mt-1"
                  />
                </div>
                <Button type="submit" disabled={isUpdatingPassword}>
                  {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                </Button>
              </form>
            </Card>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {activeSection === 'menu' ? (
        <>
          <h1 className="text-3xl font-bold mb-6">Settings</h1>
          <div className="space-y-4">
            {menuItems.map((item) => (
              <Card
                key={item.id}
                className="p-6 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setActiveSection(item.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{item.title}</h3>
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
            className="mb-4 -ml-2"
            onClick={() => setActiveSection('menu')}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Settings
          </Button>
          <h1 className="text-3xl font-bold mb-6">
            {menuItems.find(item => item.id === activeSection)?.title}
          </h1>
          {renderContent()}
        </>
      )}

      <ShipAIChatbot />
    </div>
  );
};

export default SettingsPage;
