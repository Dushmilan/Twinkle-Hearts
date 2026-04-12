import { useState, FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ProfileSkeleton } from '../../components/UI/LoadingSkeleton';
import toastService from '../../utils/toast';

export default function ProfilePage() {
  const { user, updateUser, isAuthenticated, isLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    avatar: user?.avatar || '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    updateUser(formData);
    setIsEditing(false);
    toastService.success('Profile updated successfully');
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="empty-state">
          <h3 className="empty-state-title">Please log in to view your profile</h3>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

      <div className="card p-6">
        {/* Avatar & Name */}
        <div className="flex items-center gap-5 mb-8 pb-6 border-b border-cream-100">
          <div className="w-20 h-20 bg-coral-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-display font-bold text-coral-600">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold text-gray-900">{user?.name}</h2>
            <p className="text-gray-500">{user?.email}</p>
            <span className="inline-block mt-2 badge badge-coral capitalize">
              {user?.role?.toLowerCase() || 'customer'}
            </span>
          </div>
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label-text">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="label-text">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="input-field bg-cream-100 text-gray-500 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-400">Email cannot be changed</p>
            </div>

            <div>
              <label className="label-text">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-field"
                placeholder="+94 7X XXX XXXX"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary">
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Phone</p>
                <p className="text-gray-900 font-medium">{user?.phone || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Member Since</p>
                <p className="text-gray-900 font-medium">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-LK', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsEditing(true)}
                className="btn-primary"
              >
                Edit Profile
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
