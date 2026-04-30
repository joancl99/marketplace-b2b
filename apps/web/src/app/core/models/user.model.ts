export type Role = 'ADMIN' | 'PROVIDER' | 'DISTRIBUTOR';

export interface User {
  id: string;
  email: string;
  name: string;
  company?: string;
  role: Role;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
