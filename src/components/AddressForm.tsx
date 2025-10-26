import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { useAddress, Address } from './AddressContext';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface AddressFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const AddressForm: React.FC<AddressFormProps> = ({ onSuccess, onCancel }) => {
  const { addAddress } = useAddress();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState<Omit<Address, 'id' | 'email' | 'time' | 'line2'> & { line2?: string }>({
    name: '',
    phone: '',
    line1: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    type: 'home',
    isDefault: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Basic validation
      if (!formData.name || !formData.phone || !formData.postalCode || !formData.line1 || !formData.city || !formData.state) {
        throw new Error('Please fill in all required fields');
      }
      
      // Add the new address
      const newAddress: Omit<Address, 'id'> = {
        ...formData,
        line2: formData.line2 || '',
        email: user?.email || '',
        time: new Date().toISOString()
      } as Address;
      
      await addAddress(newAddress);
      
      showToast('Address added successfully', 'success');
      onSuccess();
    } catch (error) {
      console.error('Error adding address:', error);
      showToast(error instanceof Error ? error.message : 'Failed to add address', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">Full Name *</label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="phone" className="text-sm font-medium">Mobile Number *</label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="postalCode" className="text-sm font-medium">Pincode *</label>
          <Input
            id="postalCode"
            name="postalCode"
            value={formData.postalCode}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="country" className="text-sm font-medium">Locality</label>
          <Input
            id="country"
            name="country"
            value={formData.country}
            onChange={handleChange}
          />
        </div>
        
        <div className="md:col-span-2 space-y-2">
          <label htmlFor="line1" className="text-sm font-medium">Address *</label>
          <Textarea
            id="line1"
            name="line1"
            value={formData.line1}
            onChange={handleChange}
            required
            rows={3}
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="city" className="text-sm font-medium">City/District/Town *</label>
          <Input
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="state" className="text-sm font-medium">State *</label>
          <Input
            id="state"
            name="state"
            value={formData.state}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="line2" className="text-sm font-medium">Alternate Phone (Optional)</label>
          <Input
            id="line2"
            name="line2"
            value={formData.line2 || ''}
            onChange={handleChange}
            placeholder="Apartment, suite, etc. (Optional)"
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="type" className="text-sm font-medium">Address Type</label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
          >
            <option value="home">Home</option>
            <option value="work">Work</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isDefault"
            name="isDefault"
            checked={formData.isDefault}
            onChange={handleChange}
            className="h-4 w-4 text-primary"
          />
          <label htmlFor="isDefault" className="text-sm font-medium">Make this my default address</label>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save Address'}
        </Button>
      </div>
    </form>
  );
};

export default AddressForm;
