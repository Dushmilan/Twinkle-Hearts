import { useState, useEffect } from 'react';
import { api } from '../../api.js';
import toastService from '../../utils/toast';

interface Address {
  id: string;
  label: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  isDefault: boolean;
}

export default function AddressManagementPage() {
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

  const COUNTRY_CODE = '+94';
  const PHONE_PLACEHOLDER = '7X XXX XXXX';

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const data = await api.addresses.list();
      setAddresses(data);
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
      const fullPhone = `${COUNTRY_CODE}${formData.phone.replace(/\s/g, '')}`;
      const dataToSend = { ...formData, phone: fullPhone };

      if (editingId) {
        await api.addresses.update(editingId, dataToSend);
      } else {
        await api.addresses.create(dataToSend);
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
      await api.addresses.delete(id);
      toastService.dismiss(loadingToast);
      toastService.success('Address deleted');
      fetchAddresses();
    } catch (error) {
      toastService.dismiss(loadingToast);
      toastService.error('Failed to delete address');
    }
  };

  const handleEdit = (address: Address) => {
    const localPhone = address.phone.startsWith(COUNTRY_CODE) 
      ? address.phone.slice(COUNTRY_CODE.length) 
      : address.phone;

    setFormData({
      label: address.label,
      phone: localPhone,
      street: address.street,
      city: address.city,
      state: address.state,
      zip: address.zip,
      country: 'LK',
      isDefault: address.isDefault,
    });
    setEditingId(address.id);
    setIsAdding(true);
  };

  const handleSetDefault = async (id: string) => {
    try {
      await api.addresses.update(id, { isDefault: true });
      toastService.success('Default address updated');
      fetchAddresses();
    } catch (error) {
      toastService.error('Failed to set default address');
    }
  };

  return (
    <div className="bg-twinkle-canvas min-h-screen">
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-twinkle-ink">My Addresses</h1>
          <p className="text-twinkle-ink/70 mt-1">Manage your delivery addresses</p>
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
          <h2 className="font-display text-xl font-semibold text-twinkle-ink mb-6">
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
                <div className="flex gap-2">
                  <div className="input-field text-twinkle-ink/70 w-20 text-center font-medium" aria-label="Country code">
                    {COUNTRY_CODE}
                  </div>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input-field flex-1"
                    placeholder={PHONE_PLACEHOLDER}
                  />
                </div>
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
                className="w-4 h-4 text-twinkle-blush border-twinkle-mist rounded focus:ring-twinkle-blush"
              />
              <label htmlFor="isDefault" className="text-sm text-twinkle-ink/70">
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
                className="btn-outline"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-twinkle-ink border-t-transparent rounded-full mx-auto" />
          <p className="text-twinkle-ink/50 mt-4">Loading addresses...</p>
        </div>
      ) : addresses.length === 0 ? (
        <div className="card">
          <div className="empty-state py-12">
            <p className="text-twinkle-ink/50">No addresses saved yet</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`card p-6 relative ${
                address.isDefault ? 'ring-2 ring-twinkle-blush shadow-lg' : ''
              }`}
            >
              {address.isDefault && (
                <span className="absolute top-4 right-4 badge badge-plum text-xs">
                  Default
                </span>
              )}
              <h3 className="font-display font-semibold text-twinkle-ink mb-2">{address.label}</h3>
              <p className="text-sm text-twinkle-ink/50 mb-1">{address.phone}</p>
              <p className="text-sm text-twinkle-ink/50 mb-1">{address.street}</p>
              <p className="text-sm text-twinkle-ink/50">
                {address.city}, {address.state} {address.zip}
              </p>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => handleEdit(address)}
                  className="text-sm text-twinkle-ink hover:text-twinkle-blush font-medium transition-colors"
                >
                  Edit
                </button>
                {!address.isDefault && (
                  <>
                    <button
                      onClick={() => handleSetDefault(address.id)}
                      className="text-sm text-gray-400 hover:text-gray-300 font-medium transition-colors"
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
    </div>
  );
}