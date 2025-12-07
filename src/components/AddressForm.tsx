import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { useAddress, Address } from './AddressContext';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { MapPin } from 'lucide-react';

interface AddressFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const AddressForm: React.FC<AddressFormProps> = ({ onSuccess, onCancel }) => {
  const { addAddress } = useAddress();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<Omit<Address, 'id' | 'email' | 'time'>>({
    name: user?.name || '',
    phone: user?.phone || '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    type: 'home',
    isDefault: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);

  // Update form if user data loads late
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: prev.name ? prev.name : (user.name || ''),
        phone: prev.phone ? prev.phone : (user.phone || '')
      }));
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDetectLocation = () => {
    if (!("geolocation" in navigator)) {
      showToast("Geolocation not supported", "error");
      return;
    }

    setIsDetecting(true);
    showToast("Detecting location...", "info");

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      let success = false;

      // 1. Try Google Maps First
      try {
        const apiKey = (import.meta as any).env.VITE_FIREBASE_API_KEY;
        if (apiKey) {
          const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`);
          const data = await res.json();

          if (data.status === 'OK' && data.results && data.results.length > 0) {
            const result = data.results[0];
            let city = '';
            let state = '';
            let postalCode = '';
            let country = 'India';
            let route = '';
            let street_number = '';
            let sublocality = '';
            let neighborhood = '';

            result.address_components.forEach((c: any) => {
              if (c.types.includes('locality')) city = c.long_name;
              if (c.types.includes('administrative_area_level_1')) state = c.long_name;
              if (c.types.includes('postal_code')) postalCode = c.long_name;
              if (c.types.includes('country')) country = c.long_name;
              if (c.types.includes('route')) route = c.long_name;
              if (c.types.includes('street_number')) street_number = c.long_name;
              if (c.types.includes('sublocality')) sublocality = c.long_name;
              if (c.types.includes('neighborhood')) neighborhood = c.long_name;
            });

            if (!city) {
              result.address_components.forEach((c: any) => {
                if (c.types.includes('administrative_area_level_2')) city = c.long_name;
              });
            }

            const line1 = [street_number, route, sublocality, neighborhood].filter(Boolean).join(', ');

            setFormData(prev => ({
              ...prev,
              line1: line1 || prev.line1,
              city: city || prev.city,
              state: state || prev.state,
              postalCode: postalCode || prev.postalCode,
              country: country || prev.country
            }));
            showToast("Location detected (Google)!", "success");
            success = true;
          }
        }
      } catch (err) {
        console.warn("Google Maps Geocoding failed, trying OpenStreetMap...", err);
      }

      // 2. Fallback to OpenStreetMap (Nominatim)
      if (!success) {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();

          if (data && data.address) {
            const addr = data.address;
            const city = addr.city || addr.town || addr.village || addr.county || '';
            const state = addr.state || '';
            const postalCode = addr.postcode || '';
            const country = addr.country || 'India';

            // Construct line1 from available details
            const line1Parts = [
              addr.road,
              addr.house_number,
              addr.suburb,
              addr.neighbourhood,
              addr.residential
            ].filter(Boolean);

            const line1 = line1Parts.join(', ');

            setFormData(prev => ({
              ...prev,
              line1: line1 || prev.line1,
              city: city || prev.city,
              state: state || prev.state,
              postalCode: postalCode || prev.postalCode,
              country: country === 'India' ? 'India' : country // simple check
            }));

            showToast("Location detected!", "success");
          } else {
            showToast("Location not found on map", "error");
          }
        } catch (err) {
          console.error("OSM Geocoding failed:", err);
          showToast("Failed to detect location", "error");
        }
      }

      setIsDetecting(false);

    }, (err) => {
      console.error(err);
      showToast("Location permission denied", "error");
      setIsDetecting(false);
    });
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
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-end mb-1">
          <label htmlFor="line1" className="text-sm font-medium">Address Line 1 *</label>
          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={isDetecting}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <MapPin className="w-3 h-3" />
            {isDetecting ? 'Detecting...' : 'Detect Location'}
          </button>
        </div>
        <Textarea
          id="line1"
          name="line1"
          value={formData.line1}
          onChange={handleChange}
          required
          rows={3}
          placeholder="House No., Building, Street, Area"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="line2" className="text-sm font-medium">Address Line 2 (Optional)</label>
        <Input
          id="line2"
          name="line2"
          value={formData.line2 || ''}
          onChange={handleChange}
          placeholder="Landmark, Near..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label htmlFor="city" className="text-sm font-medium">City *</label>
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
          <label htmlFor="postalCode" className="text-sm font-medium">Pincode *</label>
          <Input
            id="postalCode"
            name="postalCode"
            value={formData.postalCode}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="country" className="text-sm font-medium">Country *</label>
          <select
            id="country"
            name="country"
            value={formData.country}
            onChange={handleChange}
            className="w-full h-10 px-3 py-2 text-sm border bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            required
          >
            <option value="India">India</option>
            <option value="United States">United States</option>
            <option value="United Kingdom">United Kingdom</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="type" className="text-sm font-medium">Address Type</label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full h-10 px-3 py-2 text-sm border bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="home">Home</option>
            <option value="work">Work</option>
            <option value="other">Other</option>
          </select>
        </div>
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
