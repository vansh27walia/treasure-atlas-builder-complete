
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, CheckCircle } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface PaymentProcessorProps {
  amount: number;
  onPaymentComplete: (success: boolean) => void;
}

const PaymentProcessor: React.FC<PaymentProcessorProps> = ({ amount, onPaymentComplete }) => {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  // Format expiry date
  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    
    if (v.length > 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    
    return v;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsProcessing(true);
    
    // Simulate payment processing (in a real app, this would call a payment API)
    setTimeout(() => {
      setIsProcessing(false);
      setIsComplete(true);
      toast.success("Payment processed successfully");
      onPaymentComplete(true);
    }, 2000);
  };

  const validateForm = () => {
    if (cardNumber.replace(/\s/g, '').length < 16) {
      toast.error("Please enter a valid card number");
      return false;
    }
    
    if (expiry.length < 5) {
      toast.error("Please enter a valid expiry date (MM/YY)");
      return false;
    }
    
    if (cvc.length < 3) {
      toast.error("Please enter a valid CVC");
      return false;
    }
    
    if (name.length < 3) {
      toast.error("Please enter the cardholder name");
      return false;
    }
    
    return true;
  };

  return (
    <Card className="p-6 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold">Payment</h3>
        <CreditCard className="h-6 w-6 text-blue-500" />
      </div>
      
      {isComplete ? (
        <div className="text-center py-6">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h4 className="text-lg font-medium">Payment Complete</h4>
          <p className="text-gray-500 mt-2">Your payment was processed successfully</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Label htmlFor="amount">Amount</Label>
            <Input 
              id="amount" 
              value={`$${(amount / 100).toFixed(2)}`}
              disabled
              className="bg-gray-50"
            />
          </div>
          
          <div className="mb-4">
            <Label htmlFor="name">Cardholder Name</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>
          
          <div className="mb-4">
            <Label htmlFor="cardNumber">Card Number</Label>
            <Input 
              id="cardNumber" 
              value={cardNumber} 
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              placeholder="1234 5678 9012 3456" 
              maxLength={19}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <Label htmlFor="expiry">Expiry Date</Label>
              <Input 
                id="expiry" 
                value={expiry} 
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                placeholder="MM/YY" 
                maxLength={5}
                required
              />
            </div>
            <div>
              <Label htmlFor="cvc">CVC</Label>
              <Input 
                id="cvc" 
                value={cvc} 
                onChange={(e) => setCvc(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="123" 
                maxLength={4}
                required
              />
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : `Pay $${(amount / 100).toFixed(2)}`}
          </Button>
        </form>
      )}
    </Card>
  );
};

export default PaymentProcessor;
