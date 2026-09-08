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
    it('returns the flat user+token shape on success (no user/token nesting)', async () => {
      // La respuesta real del backend es plana (AUTH_WEB_FLOWS.md §1):
      // el user y el token viven en el mismo nivel de `data`.
      mockedRequest.mockResolvedValueOnce({
        id: 'u1',
        name: 'Ana',
        email: 'a@b.com',
        token: 'jwt-123',
      });
      const result = await authService.login({
        email: 'a@b.com',
        password: 'Secret123!',
      });
      expect(result).toEqual({ id: 'u1', name: 'Ana', email: 'a@b.com', token: 'jwt-123' });
      expect(mockedRequest).toHaveBeenCalledWith({
        method: 'POST',
        url: '/api/auth/login',
        data: { email: 'a@b.com', password: 'Secret123!' },
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
      const user = { id: 'u5', name: 'Ana', email: 'me@x.com' };
      mockedRequest.mockResolvedValueOnce({ data: user });
      const result = await authService.me();
      expect(result).toEqual(user);
    });
  });

  describe('register', () => {
    it('posts to /api/users/register with the real backend field names', async () => {
      // El registro no devuelve user ni token (AUTH_WEB_FLOWS.md §2) —
      // el email todavía no está verificado.
      mockedRequest.mockResolvedValueOnce(null);
      const payload = {
        document_type: 'V' as const,
        document_id: 12345678,
        name: 'María',
        email: 'new@x.com',
        password: 'Secret123!',
        password_confirmation: 'Secret123!',
        id_gender: 0 as const,
        country_code: '+58' as const,
        area_code: '0412',
        phone_number: '123-4567',
        terms_of_service: true as const,
      };
      const result = await authService.register(payload);
      expect(result).toBeNull();
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
      // El éxito se determina por `message` (o por no tirar excepción),
      // no por un `data.verified` que el backend no manda.
      mockedRequest.mockResolvedValueOnce({
        status: 'OK',
        message: 'Correo electrónico verificado correctamente',
        data: null,
      });
      const result = await authService.verifyEmail('42', 'tok');
      expect(result.message).toBe('Correo electrónico verificado correctamente');
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
    it('posts email and pin — NO devuelve resetToken (el backend no lo emite)', async () => {
      mockedRequest.mockResolvedValueOnce({
        status: 'OK',
        message: 'Código de verificación correcto',
        data: null,
      });
      const result = await authService.validatePin({
        email: 'a@b.com',
        pin: '123456',
      });
      expect(result.data).toBeNull();
      expect(mockedRequest).toHaveBeenCalledWith({
        method: 'POST',
        url: '/api/auth/validate-pin',
        data: { email: 'a@b.com', pin: '123456' },
        dedup: false,
      });
    });
  });

  describe('restorePassword (reset step 3)', () => {
    it('posts email, pin, password y password_confirmation (no resetToken)', async () => {
      mockedRequest.mockResolvedValueOnce({ status: 'OK', message: 'ok', data: null });
      await authService.restorePassword({
        email: 'a@b.com',
        pin: '123456',
        password: 'NewSecret1!',
        password_confirmation: 'NewSecret1!',
      });
      expect(mockedRequest).toHaveBeenCalledWith({
        method: 'POST',
        url: '/api/auth/restore-password',
        data: {
          email: 'a@b.com',
          pin: '123456',
          password: 'NewSecret1!',
          password_confirmation: 'NewSecret1!',
        },
        dedup: false,
      });
    });
  });

  describe('resetPassword (logged in)', () => {
    it('posts old_password, new_password y new_password_confirmation', async () => {
      mockedRequest.mockResolvedValueOnce({ status: 'OK', message: 'ok', data: null });
      await authService.resetPassword({
        old_password: 'OldSecret1!',
        new_password: 'NewSecret1!',
        new_password_confirmation: 'NewSecret1!',
      });
      expect(mockedRequest).toHaveBeenCalledWith({
        method: 'POST',
        url: '/api/auth/reset-password',
        data: {
          old_password: 'OldSecret1!',
          new_password: 'NewSecret1!',
          new_password_confirmation: 'NewSecret1!',
        },
        dedup: false,
      });
    });
  });

  describe('sendEmailVerification', () => {
    it('posts email to send-email-verification (endpoint público, sin token)', async () => {
      mockedRequest.mockResolvedValueOnce({ status: 'OK', message: 'ok', data: null });
      await authService.sendEmailVerification('a@b.com');
      expect(mockedRequest).toHaveBeenCalledWith({
        method: 'POST',
        url: '/api/auth/send-email-verification',
        data: { email: 'a@b.com' },
        dedup: false,
      });
    });
  });
});
