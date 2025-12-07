import React, { useState, useEffect } from 'react';
import { useAddress } from '../../components/AddressContext';
import { useAuth } from '../../components/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { FiEdit2, FiTrash2, FiPlus, FiChevronLeft } from 'react-icons/fi';
import { toast } from 'react-toastify';

interface AddressFormData {
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  type: 'home' | 'work' | 'other';
}

const Addresses: React.FC = () => {
  const { addresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } = useAddress();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AddressFormData>({
    name: user?.name || '',
    phone: user?.phone || '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    isDefault: false,
    type: 'home',
  });

  const navigate = useNavigate();
  const { shop } = useParams<{ shop?: string }>();
  const go = (path: string) => navigate(shop ? `/${shop}${path}` : path);

  // Update default form data when user loads (only if not editing and form is closed or fresh)
  useEffect(() => {
    if (user && !editingId) {
      setFormData(prev => ({
        ...prev,
        name: prev.name ? prev.name : (user.name || ''),
        phone: prev.phone ? prev.phone : (user.phone || '')
      }));
    }
  }, [user, editingId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const addressData = {
        ...formData,
        country: formData.country || 'India'
      };

      if (editingId) {
        await updateAddress(editingId, addressData);
        toast.success('Address updated successfully');
      } else {
        await addAddress(addressData);
        toast.success('Address added successfully');
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({
        name: user?.name || '',
        phone: user?.phone || '',
        line1: '',
        line2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
        isDefault: addresses.length === 0,
        type: 'home',
      });
    } catch (error) {
      toast.error('Failed to save address');
      console.error('Error saving address:', error);
    }
  };

  const handleEdit = (id: string) => {
    const address = addresses.find(addr => addr.id === id);
    if (address) {
      setFormData({
        name: address.name,
        phone: address.phone,
        line1: address.line1,
        line2: address.line2 || '',
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country || 'India',
        isDefault: address.isDefault,
        type: address.type as 'home' | 'work' | 'other',
      });
      setEditingId(id);
      setShowForm(true);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        await deleteAddress(id);
        toast.success('Address deleted successfully');
      } catch (error) {
        toast.error('Failed to delete address');
        console.error('Error deleting address:', error);
      }
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultAddress(id);
      toast.success('Default address updated');
    } catch (error) {
      toast.error('Failed to set default address');
      console.error('Error setting default address:', error);
    }
  };

  const handleDetectLocation = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Geolocation not supported");
      return;
    }

    const toastId = toast.loading("Detecting location...");

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      let success = false;

      // 1. Try Google Maps First
      try {
        const apiKey = (import.meta as any).env.VITE_FIREBASE_API_KEY;
        if (apiKey) {
          const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`);
          const data = await res.json();
          console.log("Geocoding API response:", data);

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
              country: country || 'India',
            }));
            toast.update(toastId, { render: "Location detected (Google)!", type: "success", isLoading: false, autoClose: 2000 });
            success = true;
          }
        }
      } catch (err) {
        console.warn("Google failure", err);
      }

      // 2. Fallback to OpenStreetMap
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
              country: country === 'India' ? 'India' : country
            }));
            toast.update(toastId, { render: "Location detected!", type: "success", isLoading: false, autoClose: 2000 });
          } else {
            toast.update(toastId, { render: "Location not found", type: "error", isLoading: false, autoClose: 3000 });
          }
        } catch (err) {
          console.error(err);
          toast.update(toastId, { render: "Failed to detect location", type: "error", isLoading: false, autoClose: 3000 });
        }
      }

    }, (err) => {
      console.error(err);
      toast.update(toastId, { render: "Permission denied", type: "error", isLoading: false, autoClose: 3000 });
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <button
            onClick={() => go('/profile')}
            className="mr-4 p-2 rounded-full hover:bg-gray-100"
          >
            <FiChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Manage Addresses</h1>
        </div>

        <div className="mb-6">
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({
                name: user?.name || '',
                phone: user?.phone || '',
                line1: '',
                line2: '',
                city: '',
                state: '',
                postalCode: '',
                country: 'India',
                isDefault: addresses.length === 0,
                type: 'home',
              });
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
          >
            <FiPlus /> Add New Address
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                {editingId ? 'Edit Address' : 'Add New Address'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-between items-end mb-2">
                <label className="block text-sm font-medium text-gray-700">Address Line 1 *</label>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-1"
                >
                  <FiPlus className="w-3 h-3" /> Detect Location
                </button>
              </div>
              <div>
                <input
                  type="text"
                  name="line1"
                  value={formData.line1}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                  placeholder="House No., Building, Street, Area"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2 (Optional)</label>
                <input
                  type="text"
                  name="line2"
                  value={formData.line2}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                  placeholder="Landmark, Near..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                    required
                  >
                    <option value="India">India</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Type</label>
                  <select
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
              </div>

              <div className="flex items-center pt-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  name="isDefault"
                  checked={formData.isDefault}
                  onChange={handleChange}
                  className="h-4 w-4 text-green-500 focus:ring-green-600 border-gray-300 rounded"
                />
                <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-700">
                  Set as default address
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  {editingId ? 'Update Address' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {addresses.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500 mb-4">You haven't added any addresses yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((address, index) => {
                const effectiveId = address.id || (address as any)._id;
                if (!effectiveId) {
                  return null;
                }
                return (
                  <div
                    key={effectiveId || index}
                    className={`bg-white rounded-lg shadow-md p-6 relative ${address.isDefault ? 'border-2 border-green-500' : 'border border-gray-200'
                      }`}
                  >
                    {address.isDefault && (
                      <span className="absolute top-2 right-2 bg-blue-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        Default
                      </span>
                    )}

                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">
                        {address.name}
                        <span className="ml-2 text-sm text-gray-500 capitalize">({address.type})</span>
                      </h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(effectiveId)}
                          className="text-gray-500 hover:text-blue-600"
                          title="Edit"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={() => handleDelete(effectiveId)}
                          className="text-gray-500 hover:text-red-600"
                          title="Delete"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>

                    <p className="text-sm text-gray-700">
                      {address.line1}
                      {address.line2 && <>, {address.line2}</>}
                    </p>
                    <p className="text-sm text-gray-700">
                      {address.city}, {address.state} {address.postalCode}
                    </p>
                    <p className="text-sm text-gray-700">{address.country}</p>
                    <p className="text-sm text-gray-700">Phone: {address.phone}</p>

                    {!address.isDefault && (
                      <button
                        onClick={() => handleSetDefault(address.id)}
                        className="mt-3 text-sm text-green-600 hover:text-green-800"
                      >
                        Set as default
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Addresses;
