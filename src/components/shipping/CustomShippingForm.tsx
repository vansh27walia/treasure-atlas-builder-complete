
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface CustomFormData {
  phone?: string;
  email?: string;
  taxId?: string;
  additionalNotes?: string;
  [key: string]: any;
}

interface CustomShippingFormProps {
  onSubmit: (customData: CustomFormData) => void;
  initialData?: CustomFormData;
  required?: string[];
  optional?: string[];
}

const CustomShippingForm: React.FC<CustomShippingFormProps> = ({
  onSubmit,
  initialData = {},
  required = ['phone'],
  optional = ['email']
}) => {
  const [formData, setFormData] = useState<CustomFormData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    required.forEach(field => {
      if (!formData[field] || formData[field].trim() === '') {
        newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      }
    });

    // Validate phone format if provided
    if (formData.phone && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Validate email format if provided
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const renderField = (fieldName: string, isRequired: boolean = false) => {
    const fieldLabel = fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/([A-Z])/g, ' $1');
    
    return (
      <div key={fieldName} className="space-y-2">
        <Label htmlFor={fieldName}>
          {fieldLabel} {isRequired && <span className="text-red-500">*</span>}
        </Label>
        <Input
          id={fieldName}
          type={fieldName === 'email' ? 'email' : fieldName === 'phone' ? 'tel' : 'text'}
          value={formData[fieldName] || ''}
          onChange={(e) => handleInputChange(fieldName, e.target.value)}
          placeholder={`Enter ${fieldLabel.toLowerCase()}`}
          className={errors[fieldName] ? 'border-red-500' : ''}
        />
        {errors[fieldName] && (
          <p className="text-sm text-red-500">{errors[fieldName]}</p>
        )}
      </div>
    );
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Required fields */}
        {required.map(field => renderField(field, true))}
        
        {/* Optional fields */}
        {optional.map(field => renderField(field, false))}
        
        <Button type="submit" className="w-full">
          Continue with Shipping
        </Button>
      </form>
    </Card>
  );
};

export default CustomShippingForm;
