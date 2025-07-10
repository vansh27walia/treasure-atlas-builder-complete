
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AddPaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentMethodAdded: () => void;
}

const AddPaymentMethodModal: React.FC<AddPaymentMethodModalProps> = ({
  isOpen,
  onClose,
  onPaymentMethodAdded
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvc: '',
    name: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to add a payment method');
        return;
      }

      // Simulate payment method creation (in real app, use Stripe)
      const { error } = await supabase
        .from('payment_methods')
        .insert({
          user_id: user.id,
          stripe_payment_method_id: `pm_${Date.now()}`, // Simulated ID
          last4: formData.cardNumber.slice(-4),
          brand: 'visa', // Would be determined by card number
          exp_month: parseInt(formData.expiryMonth),
          exp_year: parseInt(formData.expiryYear),
          is_default: false
        });

      if (error) {
        console.error('Error adding payment method:', error);
        toast.error('Failed to add payment method');
        return;
      }

      toast.success('Payment method added successfully');
      onPaymentMethodAdded();
      onClose();
      setFormData({
        cardNumber: '',
        expiryMonth: '',
        expiryYear: '',
        cvc: '',
        name: ''
      });
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast.error('Failed to add payment method');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Add Payment Method
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cardNumber">Card Number</Label>
            <Input
              id="cardNumber"
              type="text"
              placeholder="1234 5678 9012 3456"
              value={formData.cardNumber}
              onChange={(e) => handleInputChange('cardNumber', e.target.value)}
              required
              maxLength={19}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiryMonth">Month</Label>
              <Input
                id="expiryMonth"
                type="text"
                placeholder="MM"
                value={formData.expiryMonth}
                onChange={(e) => handleInputChange('expiryMonth', e.target.value)}
                required
                maxLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryYear">Year</Label>
              <Input
                id="expiryYear"
                type="text"
                placeholder="YYYY"
                value={formData.expiryYear}
                onChange={(e) => handleInputChange('expiryYear', e.target.value)}
                required
                maxLength={4}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cvc">CVC</Label>
            <Input
              id="cvc"
              type="text"
              placeholder="123"
              value={formData.cvc}
              onChange={(e) => handleInputChange('cvc', e.target.value)}
              required
              maxLength={4}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">Cardholder Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Payment Method'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPaymentMethodModal;
