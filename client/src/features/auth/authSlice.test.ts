import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, {
  login,
  logout,
  loginUser,
  registerUser,
  fetchMe,
  setAuthError,
  clearAuthError,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  updateProfile,
  uploadAvatar,
  deleteAccount,
  loginWithGoogle,
  loginWithMeta,
} from './authSlice';

const mockApi = vi.hoisted(() => ({
  post: vi.fn(),
  get: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('@/api/axios', () => ({ default: mockApi }));

const mockUser = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'user',
  isVerified: true,
  hasStripeAccount: false,
};

function createStore() {
  return configureStore({
    reducer: { auth: authReducer },
  });
}

describe('authSlice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('reducers', () => {
    it('login sets user and isAuthenticated', () => {
      const store = createStore();
      store.dispatch(login(mockUser));
      const state = store.getState().auth;
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.status).toBe('succeeded');
      expect(state.error).toBeNull();
    });

    it('logout clears user and removes token', () => {
      localStorage.setItem('token', 'some-token');
      const store = createStore();
      store.dispatch(login(mockUser));
      store.dispatch(logout());
      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.status).toBe('idle');
      expect(localStorage.getItem('token')).toBeNull();
    });

    it('setAuthError sets error and status failed', () => {
      const store = createStore();
      store.dispatch(setAuthError('Invalid credentials'));
      const state = store.getState().auth;
      expect(state.error).toBe('Invalid credentials');
      expect(state.status).toBe('failed');
    });

    it('clearAuthError clears error', () => {
      const store = createStore();
      store.dispatch(setAuthError('Some error'));
      store.dispatch(clearAuthError());
      const state = store.getState().auth;
      expect(state.error).toBeNull();
    });
  });

  describe('loginUser thunk', () => {
    it('calls api and updates state on success', async () => {
      mockApi.post.mockResolvedValue({ data: { user: mockUser, token: 'jwt' } });
      const store = createStore();
      await store.dispatch(loginUser({ email: 'test@example.com', password: 'pass' }));
      expect(mockApi.post).toHaveBeenCalledWith('/auth/login', { email: 'test@example.com', password: 'pass' });
      expect(localStorage.getItem('token')).toBe('jwt');
      const state = store.getState().auth;
      expect(state.user).toEqual(mockUser);
      expect(state.status).toBe('succeeded');
    });

    it('rejected sets error from response.data.message', async () => {
      mockApi.post.mockRejectedValue({ response: { data: { message: 'Invalid email or password' } } });
      const store = createStore();
      await store.dispatch(loginUser({ email: 'a@b.com', password: 'p' }));
      const state = store.getState().auth;
      expect(state.status).toBe('failed');
      expect(state.error).toBe('Invalid email or password');
    });

    it('rejected uses Error.message when no response', async () => {
      mockApi.post.mockRejectedValue(new Error('Network error'));
      const store = createStore();
      await store.dispatch(loginUser({ email: 'a@b.com', password: 'p' }));
      expect(store.getState().auth.error).toBe('Network error');
    });

    it('fulfilled updates state with user (direct dispatch)', async () => {
      const store = createStore();
      await store.dispatch(
        loginUser.fulfilled(mockUser, 'requestId', { email: 'test@example.com', password: 'pass' })
      );
      const state = store.getState().auth;
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.status).toBe('succeeded');
      expect(state.error).toBeNull();
    });

    it('rejected sets error (direct dispatch)', async () => {
      const store = createStore();
      await store.dispatch(
        loginUser.rejected(
          new Error('Rejected'),
          'requestId',
          { email: 'a@b.com', password: 'p' },
          'Invalid email or password'
        )
      );
      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.status).toBe('failed');
      expect(state.error).toBe('Invalid email or password');
    });

    it('pending sets status loading and clears error', () => {
      const store = createStore();
      store.dispatch(setAuthError('Previous error'));
      store.dispatch(loginUser.pending('requestId', { email: 'a@b.com', password: 'p' }));
      const state = store.getState().auth;
      expect(state.status).toBe('loading');
      expect(state.error).toBeNull();
    });
  });

  describe('registerUser thunk', () => {
    it('calls api and updates state on success', async () => {
      mockApi.post.mockResolvedValue({ data: { user: mockUser, token: 'jwt' } });
      const store = createStore();
      await store.dispatch(registerUser({ name: 'Test', email: 'test@example.com', password: 'pass123' }));
      expect(mockApi.post).toHaveBeenCalledWith('/auth/register', {
        name: 'Test',
        email: 'test@example.com',
        password: 'pass123',
      });
      expect(store.getState().auth.user).toEqual(mockUser);
      expect(store.getState().auth.status).toBe('succeeded');
    });

    it('fulfilled updates state with user', async () => {
      const store = createStore();
      await store.dispatch(
        registerUser.fulfilled(mockUser, 'requestId', {
          name: 'Test',
          email: 'test@example.com',
          password: 'password123',
        })
      );
      const state = store.getState().auth;
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.status).toBe('succeeded');
    });

    it('rejected when api fails', async () => {
      mockApi.post.mockRejectedValue({ response: { data: { message: 'Email already registered' } } });
      const store = createStore();
      await store.dispatch(registerUser({ name: 'T', email: 't@t.com', password: 'p' }));
      expect(store.getState().auth.error).toBe('Email already registered');
    });

    it('rejected sets error (direct)', async () => {
      const store = createStore();
      await store.dispatch(
        registerUser.rejected(
          new Error('Rejected'),
          'requestId',
          { name: 'T', email: 't@t.com', password: 'p' },
          'Email already registered'
        )
      );
      const state = store.getState().auth;
      expect(state.status).toBe('failed');
      expect(state.error).toBe('Email already registered');
    });
  });

  describe('fetchMe thunk', () => {
    it('calls api and sets user on success', async () => {
      mockApi.get.mockResolvedValue({ data: { user: mockUser } });
      const store = createStore();
      await store.dispatch(fetchMe());
      expect(mockApi.get).toHaveBeenCalledWith('/auth/me');
      expect(store.getState().auth.user).toEqual(mockUser);
      expect(store.getState().auth.status).toBe('succeeded');
    });

    it('pending sets status loading', () => {
      const store = createStore();
      store.dispatch(fetchMe.pending('requestId'));
      expect(store.getState().auth.status).toBe('loading');
    });

    it('fulfilled sets user', async () => {
      const store = createStore();
      await store.dispatch(fetchMe.fulfilled(mockUser, 'requestId'));
      const state = store.getState().auth;
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it('rejected clears user and sets idle', async () => {
      const store = createStore();
      store.dispatch(login(mockUser));
      await store.dispatch(fetchMe.rejected(new Error('Unauthorized'), 'requestId'));
      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.status).toBe('idle');
    });
  });

  describe('verifyEmail thunk', () => {
    it('calls api and sets user on success', async () => {
      mockApi.post.mockResolvedValue({ data: { user: mockUser, token: 'jwt' } });
      const store = createStore();
      await store.dispatch(verifyEmail({ email: 'a@b.com', code: '123456' }));
      expect(mockApi.post).toHaveBeenCalledWith('/auth/verify-email', { email: 'a@b.com', code: '123456' });
      expect(store.getState().auth.user).toEqual(mockUser);
      expect(store.getState().auth.status).toBe('succeeded');
    });

    it('pending sets loading', () => {
      const store = createStore();
      store.dispatch(verifyEmail.pending('req', { email: 'a@b.com', code: '123' }));
      expect(store.getState().auth.status).toBe('loading');
    });
    it('fulfilled sets user and succeeded', () => {
      const store = createStore();
      store.dispatch(verifyEmail.fulfilled(mockUser, 'req', { email: 'a@b.com', code: '123' }));
      expect(store.getState().auth.user).toEqual(mockUser);
      expect(store.getState().auth.status).toBe('succeeded');
    });
    it('rejected when api fails', async () => {
      mockApi.post.mockRejectedValue({ response: { data: { message: 'Invalid or expired verification code' } } });
      const store = createStore();
      await store.dispatch(verifyEmail({ email: 'a@b.com', code: 'wrong' }));
      expect(store.getState().auth.error).toBe('Invalid or expired verification code');
    });

    it('rejected sets error (direct)', () => {
      const store = createStore();
      store.dispatch(
        verifyEmail.rejected(new Error('Bad'), 'req', { email: 'a@b.com', code: '123' }, 'Invalid code')
      );
      expect(store.getState().auth.status).toBe('failed');
      expect(store.getState().auth.error).toBe('Invalid code');
    });
  });

  describe('resendVerificationEmail thunk', () => {
    it('calls api on success', async () => {
      mockApi.post.mockResolvedValue({});
      const store = createStore();
      await store.dispatch(resendVerificationEmail('a@b.com'));
      expect(mockApi.post).toHaveBeenCalledWith('/auth/resend-verification', { email: 'a@b.com' });
    });

    it('handles api rejection', async () => {
      mockApi.post.mockRejectedValue({ response: { data: { message: 'Too many requests' } } });
      const store = createStore();
      await store.dispatch(resendVerificationEmail('a@b.com'));
      expect(mockApi.post).toHaveBeenCalled();
    });
  });

  describe('forgotPassword thunk', () => {
    it('calls api and sets idle on success', async () => {
      mockApi.post.mockResolvedValue({});
      const store = createStore();
      await store.dispatch(forgotPassword({ email: 'a@b.com' }));
      expect(mockApi.post).toHaveBeenCalledWith('/auth/forgot-password', { email: 'a@b.com' });
      expect(store.getState().auth.status).toBe('idle');
    });

    it('pending clears error', () => {
      const store = createStore();
      store.dispatch(setAuthError('x'));
      store.dispatch(forgotPassword.pending('req', { email: 'a@b.com' }));
      expect(store.getState().auth.status).toBe('loading');
      expect(store.getState().auth.error).toBeNull();
    });
    it('fulfilled sets idle', () => {
      const store = createStore();
      store.dispatch(forgotPassword.fulfilled(undefined, 'req', { email: 'a@b.com' }));
      expect(store.getState().auth.status).toBe('idle');
    });
    it('rejected sets error', () => {
      const store = createStore();
      store.dispatch(forgotPassword.rejected(new Error('x'), 'req', { email: 'a@b.com' }, 'Request failed'));
      expect(store.getState().auth.status).toBe('failed');
      expect(store.getState().auth.error).toBe('Request failed');
    });
  });

  describe('resetPassword thunk', () => {
    it('calls api and sets user on success', async () => {
      mockApi.post.mockResolvedValue({ data: { user: mockUser, token: 'jwt' } });
      const store = createStore();
      await store.dispatch(resetPassword({ token: 't', password: 'newpass' }));
      expect(store.getState().auth.user).toEqual(mockUser);
      expect(store.getState().auth.status).toBe('succeeded');
    });

    it('pending sets loading', () => {
      const store = createStore();
      store.dispatch(resetPassword.pending('req', { token: 't', password: 'p' }));
      expect(store.getState().auth.status).toBe('loading');
    });
    it('fulfilled sets user', () => {
      const store = createStore();
      store.dispatch(resetPassword.fulfilled(mockUser, 'req', { token: 't', password: 'p' }));
      expect(store.getState().auth.user).toEqual(mockUser);
      expect(store.getState().auth.status).toBe('succeeded');
    });
    it('rejected when api fails', async () => {
      mockApi.post.mockRejectedValue({ response: { data: { message: 'Invalid or expired reset link' } } });
      const store = createStore();
      await store.dispatch(resetPassword({ token: 'bad', password: 'p' }));
      expect(store.getState().auth.error).toBe('Invalid or expired reset link');
    });

    it('rejected sets error (direct)', () => {
      const store = createStore();
      store.dispatch(resetPassword.rejected(new Error('x'), 'req', { token: 't', password: 'p' }, 'Invalid link'));
      expect(store.getState().auth.error).toBe('Invalid link');
    });
  });

  describe('updateProfile thunk', () => {
    it('calls api and updates user on success', async () => {
      const updated = { ...mockUser, name: 'New Name' };
      mockApi.patch.mockResolvedValue({ data: { user: updated } });
      const store = createStore();
      store.dispatch(login(mockUser));
      await store.dispatch(updateProfile({ name: 'New Name' }));
      expect(store.getState().auth.user).toEqual(updated);
    });

    it('fulfilled updates user', () => {
      const store = createStore();
      store.dispatch(login(mockUser));
      const updated = { ...mockUser, name: 'New Name' };
      store.dispatch(updateProfile.fulfilled(updated, 'req', { name: 'New Name' }));
      expect(store.getState().auth.user).toEqual(updated);
    });
  });

  describe('uploadAvatar thunk', () => {
    it('fulfilled updates user', () => {
      const store = createStore();
      store.dispatch(login(mockUser));
      const updated = { ...mockUser, avatarUrl: '/uploads/a.jpg' };
      store.dispatch(uploadAvatar.fulfilled(updated, 'req', new File([], 'x')));
      expect(store.getState().auth.user).toEqual(updated);
    });
    it('rejected sets error when api fails', async () => {
      mockApi.post.mockRejectedValue({ response: { data: { message: 'File too large' } } });
      const store = createStore();
      store.dispatch(login(mockUser));
      await store.dispatch(uploadAvatar(new File([], 'x.jpg')));
      expect(store.getState().auth.error).toBe('File too large');
    });

    it('rejected sets error (direct dispatch)', () => {
      const store = createStore();
      store.dispatch(uploadAvatar.rejected(new Error('x'), 'req', new File([], 'x'), 'Upload failed'));
      expect(store.getState().auth.error).toBe('Upload failed');
    });
  });

  describe('deleteAccount thunk', () => {
    it('calls api and clears user on success', async () => {
      mockApi.delete.mockResolvedValue({});
      const store = createStore();
      store.dispatch(login(mockUser));
      await store.dispatch(deleteAccount());
      expect(mockApi.delete).toHaveBeenCalledWith('/auth/me');
      expect(store.getState().auth.user).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
    });

    it('pending sets loading', () => {
      const store = createStore();
      store.dispatch(login(mockUser));
      store.dispatch(deleteAccount.pending('req'));
      expect(store.getState().auth.status).toBe('loading');
    });
    it('fulfilled clears user', () => {
      const store = createStore();
      store.dispatch(login(mockUser));
      store.dispatch(deleteAccount.fulfilled(undefined, 'req'));
      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.status).toBe('idle');
    });
    it('rejected when api fails', async () => {
      mockApi.delete.mockRejectedValue({ response: { data: { message: 'Delete failed' } } });
      const store = createStore();
      store.dispatch(login(mockUser));
      await store.dispatch(deleteAccount());
      expect(store.getState().auth.error).toBe('Delete failed');
    });

    it('rejected sets error (direct)', () => {
      const store = createStore();
      store.dispatch(deleteAccount.rejected(new Error('x'), 'req', undefined, 'Delete failed'));
      expect(store.getState().auth.error).toBe('Delete failed');
    });
  });

  describe('loginWithGoogle thunk', () => {
    it('calls api and sets user on success', async () => {
      mockApi.post.mockResolvedValue({ data: { user: mockUser, token: 'jwt', isNewUser: false } });
      const store = createStore();
      await store.dispatch(loginWithGoogle('google-token'));
      expect(mockApi.post).toHaveBeenCalledWith('/auth/google', { accessToken: 'google-token' });
      expect(store.getState().auth.user).toEqual(mockUser);
      expect(store.getState().auth.status).toBe('succeeded');
    });

    it('rejected when api fails', async () => {
      mockApi.post.mockRejectedValue({ response: { data: { message: 'Google sign-in failed' } } });
      const store = createStore();
      await store.dispatch(loginWithGoogle('bad-token'));
      expect(store.getState().auth.error).toBe('Google sign-in failed');
    });

    it('pending sets loading', () => {
      const store = createStore();
      store.dispatch(loginWithGoogle.pending('req', 'token'));
      expect(store.getState().auth.status).toBe('loading');
    });
    it('fulfilled sets user from payload.user', () => {
      const store = createStore();
      store.dispatch(loginWithGoogle.fulfilled({ user: mockUser, isNewUser: false }, 'req', 'token'));
      expect(store.getState().auth.user).toEqual(mockUser);
      expect(store.getState().auth.status).toBe('succeeded');
    });
    it('rejected sets error', () => {
      const store = createStore();
      store.dispatch(loginWithGoogle.rejected(new Error('x'), 'req', 'token', 'Google sign-in failed'));
      expect(store.getState().auth.error).toBe('Google sign-in failed');
    });
  });

  describe('loginWithMeta thunk', () => {
    it('calls api and sets user on success', async () => {
      mockApi.post.mockResolvedValue({ data: { user: mockUser, token: 'jwt' } });
      const store = createStore();
      await store.dispatch(loginWithMeta('meta-token'));
      expect(mockApi.post).toHaveBeenCalledWith('/auth/meta', { accessToken: 'meta-token' });
      expect(store.getState().auth.user).toEqual(mockUser);
      expect(store.getState().auth.status).toBe('succeeded');
    });

    it('rejected when api fails', async () => {
      mockApi.post.mockRejectedValue({ response: { data: { message: 'Meta sign-in failed' } } });
      const store = createStore();
      await store.dispatch(loginWithMeta('bad-token'));
      expect(store.getState().auth.error).toBe('Meta sign-in failed');
    });

    it('pending sets loading', () => {
      const store = createStore();
      store.dispatch(loginWithMeta.pending('req', 'token'));
      expect(store.getState().auth.status).toBe('loading');
    });
    it('fulfilled sets user', () => {
      const store = createStore();
      store.dispatch(loginWithMeta.fulfilled(mockUser, 'req', 'token'));
      expect(store.getState().auth.user).toEqual(mockUser);
      expect(store.getState().auth.status).toBe('succeeded');
    });
    it('rejected sets error', () => {
      const store = createStore();
      store.dispatch(loginWithMeta.rejected(new Error('x'), 'req', 'token', 'Meta sign-in failed'));
      expect(store.getState().auth.error).toBe('Meta sign-in failed');
    });
  });
});
