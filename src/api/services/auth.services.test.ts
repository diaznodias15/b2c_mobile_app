import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// vi.mock se hoistea al top, por lo que estos imports "debajo"
// del mock son intencionales. El linter no lo entiende.
vi.mock('../axiosRequest', () => ({
  axiosRequest: vi.fn(),
}));
// eslint-disable-next-line import/first
import { axiosRequest } from '../axiosRequest';
// eslint-disable-next-line import/first
import * as authService from './auth.services';

const mockedRequest = vi.mocked(axiosRequest);

describe('auth.services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('login', () => {
    it('returns user and token on success', async () => {
      mockedRequest.mockResolvedValueOnce({
        user: { id: 1, email: 'a@b.com' },
        token: 'jwt-123',
      });
      const result = await authService.login({
        email: 'a@b.com',
        password: 'Secret123',
      });
      expect(result).toEqual({ user: { id: 1, email: 'a@b.com' }, token: 'jwt-123' });
      expect(mockedRequest).toHaveBeenCalledWith({
        method: 'POST',
        url: '/api/auth/login',
        data: { email: 'a@b.com', password: 'Secret123' },
        dedup: false,
      });
    });

    it('throws cleaned error message from backend', async () => {
      mockedRequest.mockRejectedValueOnce(
        new Error('Request failed with status code 401, {"message":"Credenciales inválidas"}')
      );
      await expect(
        authService.login({ email: 'a@b.com', password: 'wrong' })
      ).rejects.toThrow('Credenciales inválidas');
    });

    it('falls back to default message if no backend message', async () => {
      mockedRequest.mockRejectedValueOnce(new Error('Network error'));
      await expect(
        authService.login({ email: 'a@b.com', password: 'wrong' })
      ).rejects.toThrow('Network error');
    });
  });

  describe('logout', () => {
    it('calls server logout endpoint', async () => {
      mockedRequest.mockResolvedValueOnce({ message: 'ok', status: 200 });
      await authService.logout();
      expect(mockedRequest).toHaveBeenCalledWith({
        method: 'POST',
        url: '/api/auth/logout',
        dedup: false,
      });
    });

    it('does not throw on server error (local logout is what matters)', async () => {
      mockedRequest.mockRejectedValueOnce(new Error('Server down'));
      // console.warn puede ensuciar el test, lo silenciamos.
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      await expect(authService.logout()).resolves.toBeUndefined();
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe('me', () => {
    it('returns the user from response.data', async () => {
      const user = { id: 5, email: 'me@x.com' };
      mockedRequest.mockResolvedValueOnce({ data: user });
      const result = await authService.me();
      expect(result).toEqual(user);
    });
  });

  describe('register', () => {
    it('posts to /api/users/register', async () => {
      mockedRequest.mockResolvedValueOnce({
        user: { id: 1, email: 'new@x.com' },
      });
      const payload = {
        email: 'new@x.com',
        documentType: 'V' as const,
        documentNumber: '12345678',
        name: 'María',
        gender: 'F' as const,
        countryCode: '+58',
        areaCode: '0412',
        phoneNumber: '1234567',
        password: 'Secret123',
        acceptTerms: true as const,
      };
      const result = await authService.register(payload);
      expect(result).toEqual({ user: { id: 1, email: 'new@x.com' } });
      expect(mockedRequest).toHaveBeenCalledWith({
        method: 'POST',
        url: '/api/users/register',
        data: payload,
        dedup: false,
      });
    });
  });

  describe('verifyEmail', () => {
    it('calls GET with id and token in URL', async () => {
      mockedRequest.mockResolvedValueOnce({ data: { verified: true } });
      const result = await authService.verifyEmail('42', 'tok');
      expect(result.data.verified).toBe(true);
      expect(mockedRequest).toHaveBeenCalledWith({
        method: 'GET',
        url: '/api/auth/account/verify/42/tok',
        dedup: false,
      });
    });
  });

  describe('validateUser (reset step 1)', () => {
    it('posts email', async () => {
      mockedRequest.mockResolvedValueOnce({ message: 'ok', status: 200 });
      await authService.validateUser({ email: 'a@b.com' });
      expect(mockedRequest).toHaveBeenCalledWith({
        method: 'POST',
        url: '/api/auth/validate-user',
        data: { email: 'a@b.com' },
        dedup: false,
      });
    });
  });

  describe('validatePin (reset step 2)', () => {
    it('posts email and pin, returns resetToken', async () => {
      mockedRequest.mockResolvedValueOnce({
        data: { resetToken: 'rst-123' },
      });
      const result = await authService.validatePin({
        email: 'a@b.com',
        pin: '123456',
      });
      expect(result.data.resetToken).toBe('rst-123');
    });
  });

  describe('restorePassword (reset step 3)', () => {
    it('posts email, resetToken and newPassword', async () => {
      mockedRequest.mockResolvedValueOnce({ message: 'ok', status: 200 });
      await authService.restorePassword({
        email: 'a@b.com',
        resetToken: 'rst-123',
        newPassword: 'NewSecret1',
      });
      expect(mockedRequest).toHaveBeenCalledWith({
        method: 'POST',
        url: '/api/auth/restore-password',
        data: {
          email: 'a@b.com',
          resetToken: 'rst-123',
          newPassword: 'NewSecret1',
        },
        dedup: false,
      });
    });
  });

  describe('resetPassword (logged in)', () => {
    it('posts current and new password', async () => {
      mockedRequest.mockResolvedValueOnce({ message: 'ok', status: 200 });
      await authService.resetPassword({
        currentPassword: 'OldSecret1',
        newPassword: 'NewSecret1',
      });
      expect(mockedRequest).toHaveBeenCalledWith({
        method: 'POST',
        url: '/api/auth/reset-password',
        data: {
          currentPassword: 'OldSecret1',
          newPassword: 'NewSecret1',
        },
        dedup: false,
      });
    });
  });

  describe('sendEmailVerification', () => {
    it('posts to send-email-verification', async () => {
      mockedRequest.mockResolvedValueOnce({ message: 'ok', status: 200 });
      await authService.sendEmailVerification();
      expect(mockedRequest).toHaveBeenCalledWith({
        method: 'POST',
        url: '/api/auth/send-email-verification',
        dedup: false,
      });
    });
  });
});
