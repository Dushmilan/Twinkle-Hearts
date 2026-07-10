export interface Address {
  id: string;
  label: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  phone?: string | null;
  role: string;
  avatar?: string | null;
  createdAt: string;
  updatedAt: string;
}
