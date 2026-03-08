import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronLeft, ChevronRight, Globe, Package, Phone, Truck, Mail, MapPin, Ruler } from 'lucide-react';
import AddressAutoComplete from '@/components/shipping/AddressAutoComplete';

export interface ReviewableOrder {
  order_id: string;
  customer_name: string;
  to_street1: string;
  to_street2: string;
  to_city: string;
  to_state: string;
  to_zip: string;
  to_country: string;
  phone: string;
  email: string;
  weight: number;
  length: number;
  width: number;
  height: number;
  line_items: string;
  approved: boolean;
  shopify_order_id?: string;
  shop?: string;
}

interface ShopifyOrderReviewModalProps {
  open: boolean;
  onClose: () => void;
  orders: ReviewableOrder[];
  onConfirmAll: (orders: ReviewableOrder[]) => void;
}

const ShopifyOrderReviewModal: React.FC<ShopifyOrderReviewModalProps> = ({
  open,
  onClose,
  orders: initialOrders,
  onConfirmAll,
}) => {
  const [orders, setOrders] = useState<ReviewableOrder[]>(initialOrders);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [weightUnit, setWeightUnit] = useState<'lb' | 'oz' | 'kg'>('lb');

  React.useEffect(() => {
    if (open) {
      setOrders(initialOrders.map(o => ({ ...o, approved: false })));
      setCurrentIndex(0);
    }
  }, [open, initialOrders]);

  const current = orders[currentIndex];
  const approvedCount = orders.filter(o => o.approved).length;
  const allApproved = approvedCount === orders.length;
  const progressPercent = orders.length > 0 ? (approvedCount / orders.length) * 100 : 0;

  const updateField = useCallback((field: keyof ReviewableOrder, value: string | number) => {
    setOrders(prev => prev.map((o, i) => i === currentIndex ? { ...o, [field]: value } : o));
  }, [currentIndex]);

  const handleApprove = () => {
    setOrders(prev => prev.map((o, i) => i === currentIndex ? { ...o, approved: true } : o));
    const nextUnapproved = orders.findIndex((o, i) => i > currentIndex && !o.approved);
    if (nextUnapproved !== -1) {
      setCurrentIndex(nextUnapproved);
    } else if (currentIndex < orders.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleConfirmAll = () => {
    onConfirmAll(orders);
  };

  if (!current) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Review Orders ({currentIndex + 1} / {orders.length})
          </DialogTitle>
          <DialogDescription>
            Review and edit recipient address and package dimensions for each order before shipping.
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{approvedCount} of {orders.length} approved</span>
            <span className="font-medium">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-3" />
        </div>

        {/* Order tabs/chips */}
        <div className="flex gap-1.5 flex-wrap">
          {orders.map((o, i) => (
            <button
              key={o.order_id}
              onClick={() => setCurrentIndex(i)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${
                i === currentIndex
                  ? 'bg-primary text-primary-foreground border-primary'
                  : o.approved
                    ? 'bg-green-100 text-green-800 border-green-300'
                    : 'bg-muted text-muted-foreground border-border hover:bg-accent'
              }`}
            >
              {o.approved && <Check className="inline h-3 w-3 mr-0.5" />}
              #{o.order_id}
            </button>
          ))}
        </div>

        {/* ── ADDRESS SECTION (matches FreshEditModal layout) ── */}
        <div className="space-y-6 mt-2">
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <MapPin className="h-4 w-4" /> Recipient Address
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Recipient Name</Label>
                <Input
                  value={current.customer_name}
                  onChange={(e) => updateField('customer_name', e.target.value)}
                  placeholder="Customer name"
                />
              </div>
              <div>
                <Label className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> Phone Number
                </Label>
                <Input
                  value={current.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="Phone number"
                />
              </div>

              {/* Google Autocomplete - full width, on top */}
              <div className="md:col-span-2">
                <Label>Address (Google Autocomplete)</Label>
                <AddressAutoComplete
                  onChange={(v) => updateField('to_street1', v)}
                  onAddressSelected={() => {}}
                  onFullAddressPopulated={(addr) => {
                    setOrders(prev => prev.map((o, i) => i === currentIndex ? {
                      ...o,
                      to_street1: addr.street1 || addr.street || '',
                      to_city: addr.city || '',
                      to_state: addr.state || '',
                      to_zip: addr.zip || '',
                      to_country: addr.country || 'US',
                    } : o));
                  }}
                  placeholder="Start typing address..."
                />
                {current.to_street1 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Current: {current.to_street1}
                  </p>
                )}
              </div>

              <div>
                <Label>Apartment / Suite</Label>
                <Input
                  value={current.to_street2}
                  onChange={(e) => updateField('to_street2', e.target.value)}
                  placeholder="Apt, Suite, etc. (optional)"
                />
              </div>
              <div>
                <Label>City</Label>
                <Input value={current.to_city} onChange={(e) => updateField('to_city', e.target.value)} placeholder="City" />
              </div>
              <div>
                <Label>State</Label>
                <Input value={current.to_state} onChange={(e) => updateField('to_state', e.target.value)} placeholder="State code (e.g., CA)" />
              </div>
              <div>
                <Label>Zip Code</Label>
                <Input value={current.to_zip} onChange={(e) => updateField('to_zip', e.target.value)} placeholder="ZIP Code" />
              </div>
              <div>
                <Label className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> Country</Label>
                <Select value={current.to_country} onValueChange={(v) => updateField('to_country', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="CA">Canada</SelectItem>
                    <SelectItem value="MX">Mexico</SelectItem>
                    <SelectItem value="GB">United Kingdom</SelectItem>
                    <SelectItem value="AU">Australia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Email</Label>
                <Input value={current.email} onChange={(e) => updateField('email', e.target.value)} placeholder="Email address" />
              </div>
            </div>
          </div>

          {/* ── PACKAGE DIMENSIONS SECTION (separate, like FreshEditModal) ── */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Ruler className="h-4 w-4" /> Package Dimensions
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <Label>Length (in)</Label>
                <Input type="number" value={current.length} onChange={(e) => updateField('length', Number(e.target.value))} step="0.1" min="0.1" />
              </div>
              <div>
                <Label>Width (in)</Label>
                <Input type="number" value={current.width} onChange={(e) => updateField('width', Number(e.target.value))} step="0.1" min="0.1" />
              </div>
              <div>
                <Label>Height (in)</Label>
                <Input type="number" value={current.height} onChange={(e) => updateField('height', Number(e.target.value))} step="0.1" min="0.1" />
              </div>
              <div>
                <Label>Weight</Label>
                <Input
                  type="number"
                  value={current.weight}
                  onChange={(e) => updateField('weight', Number(e.target.value))}
                  step="0.01"
                  min="0.01"
                  className="text-base font-semibold"
                />
              </div>
              <div>
                <Label>Unit</Label>
                <Select value={weightUnit} onValueChange={(v) => setWeightUnit(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lb">Pounds (lb)</SelectItem>
                    <SelectItem value="oz">Ounces (oz)</SelectItem>
                    <SelectItem value="kg">Kilograms (kg)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <Label>Line Items</Label>
            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md mt-1">{current.line_items || 'No items'}</p>
          </div>

          <div>
            <Badge variant={current.approved ? 'default' : 'secondary'} className={current.approved ? 'bg-green-600' : ''}>
              {current.approved ? '✅ Approved' : '⏳ Pending Review'}
            </Badge>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentIndex(Math.min(orders.length - 1, currentIndex + 1))} disabled={currentIndex === orders.length - 1}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <div className="flex gap-2">
            {!current.approved && (
              <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
                <Check className="h-4 w-4 mr-1" /> Approve Order
              </Button>
            )}
            {allApproved && (
              <Button onClick={handleConfirmAll}>
                <Truck className="h-4 w-4 mr-1" /> Confirm & Fetch Rates ({orders.length})
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShopifyOrderReviewModal;
