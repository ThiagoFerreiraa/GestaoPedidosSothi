import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';

export type Role = 'ADMIN' | 'ATENDENTE' | 'COZINHA' | 'ENTREGADOR';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        sessionStorage.setItem('access_token', data.accessToken);
        set({ user: data.user, isAuthenticated: true });
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } finally {
          sessionStorage.removeItem('access_token');
          set({ user: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
);
