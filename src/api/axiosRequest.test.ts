import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { axiosRequest, setToken, getToken, axiosInstance } from './axiosRequest';

// Mock de axios para no hacer requests reales.
// Devolvemos un objeto con `create()` que retorna una "instance" mockeada.
vi.mock('axios', () => {
  const instance = {
    request: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };
  return {
    default: { create: () => instance },
    create: () => instance,
  };
});

describe('getToken / setToken', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await setToken(null);
  });

  it('returns null when no token is stored', async () => {
    expect(await getToken()).toBeNull();
  });

  it('persists token in SecureStore and memory', async () => {
    await setToken('abc123');
    expect(await getToken()).toBe('abc123');
  });

  it('removes token when set to null', async () => {
    await setToken('temp');
    await setToken(null);
    expect(await getToken()).toBeNull();
  });
});

describe('axiosRequest', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await setToken(null);
  });

  it('calls instance.request with the right config', async () => {
    vi.mocked(axiosInstance.request).mockResolvedValueOnce({ data: { ok: true } });

    const result = await axiosRequest({ method: 'GET', url: '/api/foo' });

    expect(axiosInstance.request).toHaveBeenCalledTimes(1);
    expect(axiosInstance.request).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', url: '/api/foo' }),
    );
    expect(result).toEqual({ ok: true });
  });

  it('deduplicates identical GETs in the dedup window', async () => {
    vi.mocked(axiosInstance.request).mockResolvedValue({ data: { ok: 1 } });

    // Primer request → ejecuta
    await axiosRequest({ method: 'GET', url: '/api/dup' });
    // Segundo idéntico dentro de la ventana → debe tirar DUPLICATE_REQUEST
    await expect(axiosRequest({ method: 'GET', url: '/api/dup' })).rejects.toThrow(
      'DUPLICATE_REQUEST',
    );

    expect(axiosInstance.request).toHaveBeenCalledTimes(1);
  });

  it('does NOT deduplicate POSTs (mutations always execute)', async () => {
    vi.mocked(axiosInstance.request).mockResolvedValue({ data: { ok: 1 } });

    await axiosRequest({ method: 'POST', url: '/api/dup', data: { a: 1 } });
    await axiosRequest({ method: 'POST', url: '/api/dup', data: { a: 1 } });

    expect(axiosInstance.request).toHaveBeenCalledTimes(2);
  });

  it('passes through the signal option', async () => {
    const controller = new AbortController();
    vi.mocked(axiosInstance.request).mockResolvedValueOnce({ data: null });

    await axiosRequest({
      method: 'GET',
      url: '/api/cancel',
      signal: controller.signal,
    });

    expect(axiosInstance.request).toHaveBeenCalledWith(
      expect.objectContaining({ signal: controller.signal }),
    );
  });

  it('clears the in-flight entry on completion so next call hits network', async () => {
    // Mockeamos Date.now para simular el paso del tiempo fuera de la ventana.
    const nowSpy = vi.spyOn(Date, 'now');
    nowSpy.mockReturnValueOnce(1000).mockReturnValueOnce(1000 + 10_000);

    vi.mocked(axiosInstance.request)
      .mockResolvedValueOnce({ data: { ok: 1 } })
      .mockResolvedValueOnce({ data: { ok: 2 } });

    // Primer request a t=1000 → ejecuta
    await axiosRequest({ method: 'GET', url: '/api/clear' });
    // Segundo request a t=11000 (>5000ms ventana) → ejecuta también
    await axiosRequest({ method: 'GET', url: '/api/clear' });

    expect(axiosInstance.request).toHaveBeenCalledTimes(2);
  });

  it('can be called concurrently with different URLs without dedup', async () => {
    vi.mocked(axiosInstance.request).mockImplementation(async (config) => {
      return { data: { url: config.url } };
    });

    const [a, b, c] = await Promise.all([
      axiosRequest({ method: 'GET', url: '/api/a' }),
      axiosRequest({ method: 'GET', url: '/api/b' }),
      axiosRequest({ method: 'GET', url: '/api/c' }),
    ]);

    expect(a).toEqual({ url: '/api/a' });
    expect(b).toEqual({ url: '/api/b' });
    expect(c).toEqual({ url: '/api/c' });
    expect(axiosInstance.request).toHaveBeenCalledTimes(3);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});
