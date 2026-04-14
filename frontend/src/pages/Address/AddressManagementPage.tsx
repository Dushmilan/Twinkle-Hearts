import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import toastService from '../../utils/toast';

interface Address {
  id: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
}

export default function AddressManagementPage() {
  const { tokens } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    label: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'LK',
    isDefault: false,
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users/addresses`, {
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch addresses');
      }

      const data = await response.json();
      setAddresses(data.data.addresses || []);
    } catch (error) {
      toastService.error('Failed to load addresses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const loadingToast = toastService.loading(editingId ? 'Updating address...' : 'Saving address...');

    try {
      const url = editingId
        ? `${API_URL}/api/users/addresses/${editingId}`
        : `${API_URL}/api/users/addresses`;

      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save address');
      }

      toastService.dismiss(loadingToast);
      toastService.success(editingId ? 'Address updated' : 'Address saved');
      fetchAddresses();
      setIsAdding(false);
      setEditingId(null);
      setFormData({
        label: '',
        phone: '',
        street: '',
        city: '',
        state: '',
        zip: '',
        country: 'LK',
        isDefault: false,
      });
    } catch (error) {
      toastService.dismiss(loadingToast);
      toastService.error('Failed to save address');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    const loadingToast = toastService.loading('Deleting address...');

    try {
      const response = await fetch(`${API_URL}/api/users/addresses/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete address');
      }

      toastService.dismiss(loadingToast);
      toastService.success('Address deleted');
      fetchAddresses();
    } catch (error) {
      toastService.dismiss(loadingToast);
      toastService.error('Failed to delete address');
    }
  };

  const handleEdit = (address: Address) => {
    setFormData({
      label: address.name,
      phone: address.phone,
      street: address.street,
      city: address.city,
      state: address.state,
      zip: address.zipCode,
      country: 'LK',
      isDefault: address.isDefault,
    });
    setEditingId(address.id);
    setIsAdding(true);
  };

  const handleSetDefault = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/api/users/addresses/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isDefault: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to set default address');
      }

      toastService.success('Default address updated');
      fetchAddresses();
    } catch (error) {
      toastService.error('Failed to set default address');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900">My Addresses</h1>
          <p className="text-gray-500 mt-1">Manage your delivery addresses</p>
        </div>
        <button
          onClick={() => {
            setIsAdding(!isAdding);
            setEditingId(null);
            setFormData({
              label: '',
              phone: '',
              street: '',
              city: '',
              state: '',
              zip: '',
              country: 'LK',
              isDefault: false,
            });
          }}
          className="btn-primary"
        >
          {isAdding ? 'Cancel' : '+ Add Address'}
        </button>
      </div>

      {isAdding && (
        <div className="card p-6 mb-8">
          <h2 className="font-display text-xl font-semibold text-gray-900 mb-6">
            {editingId ? 'Edit Address' : 'Add New Address'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-text">Address Label (e.g., Home, Office)</label>
                <input
                  type="text"
                  required
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="input-field"
                  placeholder="Home"
                />
              </div>
              <div>
                <label className="label-text">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input-field"
                  placeholder="+94 7X XXX XXXX"
                />
              </div>
            </div>

            <div>
              <label className="label-text">Street Address</label>
              <input
                type="text"
                required
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                className="input-field"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label-text">City</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label-text">State</label>
                <input
                  type="text"
                  required
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label-text">ZIP Code</label>
                <input
                  type="text"
                  required
                  value={formData.zip}
                  onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="label-text">Country</label>
              <select
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="input-field"
              >
                <option value="LK">Sri Lanka</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="w-4 h-4 text-coral-500 border-gray-300 rounded focus:ring-coral-400"
              />
              <label htmlFor="isDefault" className="text-sm text-gray-700">
                Set as default address
              </label>
            </div>

            <div className="flex gap-3">
              <button type="submit" className="btn-primary">
                {editingId ? 'Update' : 'Save'} Address
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setEditingId(null);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-coral-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-500 mt-4">Loading addresses...</p>
        </div>
      ) : addresses.length === 0 ? (
        <div className="card">
          <div className="empty-state py-12">
            <p className="text-gray-500">No addresses saved yet</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`card p-6 relative ${
                address.isDefault ? 'ring-2 ring-coral-300 shadow-glow' : ''
              }`}
            >
              {address.isDefault && (
                <span className="absolute top-4 right-4 badge badge-coral text-xs">
                  Default
                </span>
              )}
              <h3 className="font-display font-semibold text-gray-900 mb-2">{address.name}</h3>
              <p className="text-sm text-gray-600 mb-1">{address.phone}</p>
              <p className="text-sm text-gray-600 mb-1">{address.street}</p>
              <p className="text-sm text-gray-600">
                {address.city}, {address.state} {address.zipCode}
              </p>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => handleEdit(address)}
                  className="text-sm text-coral-600 hover:text-coral-700 font-medium transition-colors"
                >
                  Edit
                </button>
                {!address.isDefault && (
                  <>
                    <button
                      onClick={() => handleSetDefault(address.id)}
                      className="text-sm text-gray-600 hover:text-gray-700 font-medium transition-colors"
                    >
                      Set Default
                    </button>
                    <button
                      onClick={() => handleDelete(address.id)}
                      className="text-sm text-red-500 hover:text-red-600 font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
