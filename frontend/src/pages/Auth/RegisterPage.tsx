import { useState, FormEvent, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Gift, Sparkle } from 'lucide-react';
import gsap from 'gsap';
import { useAuth } from '../../context/AuthContext';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const COUNTRY_CODE = '+94';
  const PHONE_PLACEHOLDER = '7X XXX XXXX';

  useEffect(() => {
    if (heroRef.current) {
      gsap.fromTo(heroRef.current, { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.7, ease: 'power3.out' });
    }
    if (formRef.current) {
      gsap.fromTo(formRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', delay: 0.2 });
    }
    const floaters = heroRef.current?.querySelectorAll('.floating-card');
    if (floaters) {
      gsap.to(floaters, { y: -12, duration: 3, ease: 'sine.inOut', yoyo: true, repeat: -1, stagger: 1 });
    }
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9]{9,10}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(formData.password)) {
      newErrors.password = 'Must include uppercase, lowercase, number, and special character';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[@$!%*?&]/.test(password)) strength++;
    return strength;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const fullPhone = `${COUNTRY_CODE}${formData.phone.replace(/\s/g, '')}`;
      await register(formData.email, formData.password, formData.name, fullPhone);
      navigate('/', { replace: true });
    } catch {
      // Error handled by AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }

    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return 'bg-red-400';
    if (passwordStrength <= 3) return 'bg-amber-400';
    return 'bg-emerald-500';
  };

  const getPasswordStrengthLabel = () => {
    if (passwordStrength <= 2) return 'Weak';
    if (passwordStrength <= 3) return 'Fair';
    return 'Strong';
  };

  return (
    <div className="min-h-screen flex bg-twinkle-canvas">
      <div ref={heroRef} className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-twinkle-rose/10 via-twinkle-canvas to-twinkle-sage/20 relative overflow-hidden items-center justify-center p-12">
        <div className="floating-card absolute top-24 right-16 w-20 h-28 bg-white rounded-2xl border border-twinkle-mist shadow-lg flex flex-col items-center justify-center p-3 -rotate-6">
          <Heart size={20} className="text-twinkle-rose mb-2" />
          <span className="text-[10px] font-display text-twinkle-ink/60 text-center leading-tight">With Love</span>
        </div>

        <div className="floating-card absolute bottom-28 left-20 w-18 h-24 bg-white rounded-2xl border border-twinkle-mist shadow-lg flex flex-col items-center justify-center p-3 rotate-4">
          <Gift size={18} className="text-twinkle-sage mb-2" />
          <span className="text-[10px] font-display text-twinkle-ink/60 text-center leading-tight">Celebration</span>
        </div>

        <div className="floating-card absolute top-36 left-32 w-16 h-22 bg-white rounded-2xl border border-twinkle-mist shadow-lg flex flex-col items-center justify-center p-2 -rotate-12">
          <Sparkle size={16} className="text-twinkle-mist mb-1" />
          <span className="text-[9px] font-display text-twinkle-ink/60 text-center leading-tight">Joy</span>
        </div>

        <div className="relative z-10 max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-twinkle-rose/15 flex items-center justify-center mx-auto mb-6">
            <Heart size={28} className="text-twinkle-rose" />
          </div>
          <h2 className="font-display text-3xl font-bold text-twinkle-ink mb-4">
            Join TwinkleHearts
          </h2>
          <p className="text-twinkle-ink/60 leading-relaxed mb-6">
            Create an account to save your favorite cards, track orders, and send love that truly arrives.
          </p>
          <div className="flex items-center justify-center gap-6 text-xs text-twinkle-ink/40">
            <span className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-twinkle-mist" />
              Save favorites
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-twinkle-mist" />
              Track orders
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md w-full">
          <div className="text-center mb-8 lg:hidden">
            <Link to="/" className="inline-flex items-center gap-2">
              <Heart size={28} className="text-twinkle-rose" />
              <span className="text-2xl font-display font-semibold text-twinkle-ink">
                Twinkle<span className="text-twinkle-rose">Hearts</span>
              </span>
            </Link>
          </div>

          <div ref={formRef} className="card rounded-2xl p-8">
            <div className="text-center mb-8">
              <h1 className="font-display text-2xl font-bold text-twinkle-ink">Create Account</h1>
              <p className="text-twinkle-ink/50 mt-1">Join our family today</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className="label-text">Full Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`input-field ${errors.name ? 'input-field-error' : ''}`}
                  placeholder="Your full name"
                />
                {errors.name && <p className="error-text">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="email" className="label-text">Email Address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`input-field ${errors.email ? 'input-field-error' : ''}`}
                  placeholder="you@example.com"
                />
                {errors.email && <p className="error-text">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="phone" className="label-text">Phone Number</label>
                <div className="flex gap-2">
                  <div className="input-field text-twinkle-ink/70 w-20 text-center font-medium min-h-[44px] flex items-center justify-center" aria-label="Country code">
                    {COUNTRY_CODE}
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`input-field flex-1 ${errors.phone ? 'input-field-error' : ''}`}
                    placeholder={PHONE_PLACEHOLDER}
                  />
                </div>
                {errors.phone && <p className="error-text">{errors.phone}</p>}
              </div>

              <div>
                <label htmlFor="password" className="label-text">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`input-field ${errors.password ? 'input-field-error' : ''}`}
                  placeholder="••••••••"
                />
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <div className="password-strength-bar flex-1">
                        <div
                          className={`password-strength-fill ${getPasswordStrengthColor()}`}
                          style={{ width: `${(passwordStrength / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-twinkle-ink/50">{getPasswordStrengthLabel()}</span>
                    </div>
                  </div>
                )}
                {errors.password && <p className="error-text">{errors.password}</p>}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="label-text">Confirm Password</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`input-field ${errors.confirmPassword ? 'input-field-error' : ''}`}
                  placeholder="••••••••"
                />
                {errors.confirmPassword && <p className="error-text">{errors.confirmPassword}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-primary py-3 text-base disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-twinkle-ink/50">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-twinkle-ink hover:text-twinkle-rose">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}