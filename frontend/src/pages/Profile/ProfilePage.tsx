import { useState, FormEvent, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { User, Package, Heart, MapPin, LogOut } from 'lucide-react';
import { api } from '../../api.js';
import { useAuthStore } from '../../store/authStore';
import { useAuth } from '../../context/AuthContext';
import { ProfileSkeleton } from '../../components/UI/LoadingSkeleton';
import toastService from '../../utils/toast';

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const { logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    avatar: user?.avatar || '',
  });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const items = containerRef.current.querySelectorAll('.profile-item');
      gsap.fromTo(items, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.12, ease: 'power3.out' });
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const result = await api.auth.updateProfile(formData);
      updateUser(result.data as any);
      setIsEditing(false);
      toastService.success('Profile updated successfully');
    } catch {
      toastService.error('Failed to update profile');
    }
  };

  const handleLogout = async () => {
    await logout();
    toastService.success('Signed out successfully');
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-twinkle-canvas min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="empty-state">
            <div className="empty-state-icon">
              <User size={24} />
            </div>
            <h3 className="empty-state-title">Please sign in to view your profile</h3>
            <Link to="/login" className="btn-primary mt-6">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="bg-twinkle-canvas min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="font-display text-3xl font-bold text-twinkle-ink mb-8">My Profile</h1>

        <div ref={containerRef} className="space-y-6">
          <div className="profile-item card p-6">
            <div className="flex items-center gap-3 mb-6">
              <User size={18} className="text-twinkle-rose" />
              <h2 className="font-display text-lg font-semibold text-twinkle-ink">Personal Information</h2>
            </div>

            <div className="flex items-center gap-5 mb-6 pb-6 border-b border-twinkle-mist">
              <div className="w-20 h-20 bg-twinkle-rose/15 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-display font-bold text-twinkle-rose">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold text-twinkle-ink">{user?.name}</h3>
                <p className="text-twinkle-ink/50 text-sm">{user?.email}</p>
                <span className="inline-block mt-2 badge badge-plum capitalize">
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
                    className="input-field bg-twinkle-mist/20 text-twinkle-ink/50 cursor-not-allowed"
                  />
                  <p className="helper-text">Email cannot be changed</p>
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
                  <button type="submit" className="btn-primary">Save Changes</button>
                  <button type="button" onClick={() => setIsEditing(false)} className="btn-outline">Cancel</button>
                </div>
              </form>
            ) : (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="text-xs text-twinkle-ink/50 mb-1">Phone</p>
                    <p className="text-twinkle-ink font-medium">{user?.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-twinkle-ink/50 mb-1">Member Since</p>
                    <p className="text-twinkle-ink font-medium">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-LK', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                    </p>
                  </div>
                </div>

                <button onClick={() => setIsEditing(true)} className="btn-primary">
                  Edit Profile
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="profile-item">
              <Link to="/orders" className="card p-5 flex items-center gap-4 hover:shadow-md transition-shadow block min-h-[44px]">
                <div className="w-12 h-12 rounded-xl bg-twinkle-sage/15 flex items-center justify-center flex-shrink-0">
                  <Package size={20} className="text-twinkle-sage" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-twinkle-ink">My Orders</h3>
                  <p className="text-xs text-twinkle-ink/50">Track your card orders</p>
                </div>
              </Link>
            </div>

            <div className="profile-item">
              <Link to="/wishlist" className="card p-5 flex items-center gap-4 hover:shadow-md transition-shadow block min-h-[44px]">
                <div className="w-12 h-12 rounded-xl bg-twinkle-rose/15 flex items-center justify-center flex-shrink-0">
                  <Heart size={20} className="text-twinkle-rose" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-twinkle-ink">Wishlist</h3>
                  <p className="text-xs text-twinkle-ink/50">Cards you love</p>
                </div>
              </Link>
            </div>

            <div className="profile-item">
              <Link to="/addresses" className="card p-5 flex items-center gap-4 hover:shadow-md transition-shadow block min-h-[44px]">
                <div className="w-12 h-12 rounded-xl bg-twinkle-mist/30 flex items-center justify-center flex-shrink-0">
                  <MapPin size={20} className="text-twinkle-ink/50" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-twinkle-ink">Addresses</h3>
                  <p className="text-xs text-twinkle-ink/50">Manage delivery addresses</p>
                </div>
              </Link>
            </div>

            <div className="profile-item">
              <button
                onClick={handleLogout}
                className="card p-5 flex items-center gap-4 hover:shadow-md transition-shadow w-full text-left min-h-[44px]"
              >
                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                  <LogOut size={20} className="text-red-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-twinkle-ink">Sign Out</h3>
                  <p className="text-xs text-twinkle-ink/50">Log out of your account</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}