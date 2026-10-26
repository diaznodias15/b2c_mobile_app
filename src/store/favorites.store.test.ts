import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '@/api/services/favorites.services';

import { useFavoritesStore } from './favorites.store';
import { useToastStore } from './toast.store';

vi.mock('@/api/services/favorites.services', () => ({
  getFavoriteSlugs: vi.fn(),
  addFavorite: vi.fn(),
  removeFavorite: vi.fn(),
}));

describe('useFavoritesStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useFavoritesStore.getState().reset();
    useToastStore.getState().hide();
  });

  it('load trae los slugs y marca isLoaded', async () => {
    vi.mocked(api.getFavoriteSlugs).mockResolvedValue(['a', 'b']);
    await useFavoritesStore.getState().load();
    expect(useFavoritesStore.getState()).toMatchObject({ slugs: ['a', 'b'], isLoaded: true });
  });

  it('un fallo al cargar no rompe ni marca isLoaded', async () => {
    vi.mocked(api.getFavoriteSlugs).mockRejectedValue(new Error('sin red'));
    await useFavoritesStore.getState().load();
    expect(useFavoritesStore.getState().isLoaded).toBe(false);
  });

  it('toggle NO es optimista: el slug entra solo cuando el servidor confirma', async () => {
    let resolve!: (v: boolean) => void;
    vi.mocked(api.addFavorite).mockReturnValue(new Promise((r) => (resolve = r)));

    const p = useFavoritesStore.getState().toggle('x');
    expect(useFavoritesStore.getState().slugs).toEqual([]);
    expect(useFavoritesStore.getState().pending).toEqual(['x']);

    resolve(true);
    expect(await p).toBe(true);
    expect(useFavoritesStore.getState().slugs).toEqual(['x']);
    expect(useFavoritesStore.getState().pending).toEqual([]);
  });

  it('ignora toques repetidos mientras hay una petición en curso', async () => {
    let resolve!: (v: boolean) => void;
    vi.mocked(api.addFavorite).mockReturnValue(new Promise((r) => (resolve = r)));

    const first = useFavoritesStore.getState().toggle('x');
    expect(await useFavoritesStore.getState().toggle('x')).toBe(false);
    resolve(true);
    await first;
    expect(api.addFavorite).toHaveBeenCalledTimes(1);
  });

  it('un favorito existente se quita', async () => {
    vi.mocked(api.getFavoriteSlugs).mockResolvedValue(['a', 'b']);
    vi.mocked(api.removeFavorite).mockResolvedValue(true);
    await useFavoritesStore.getState().load();
    await useFavoritesStore.getState().toggle('a');
    expect(useFavoritesStore.getState().slugs).toEqual(['b']);
  });

  it('si el servidor rechaza, queda como estaba y avisa con el mensaje del backend', async () => {
    vi.mocked(api.addFavorite).mockRejectedValue(new Error('Alcanzó el máximo de 200 productos favoritos.'));
    expect(await useFavoritesStore.getState().toggle('x')).toBe(false);
    expect(useFavoritesStore.getState().slugs).toEqual([]);
    expect(useFavoritesStore.getState().pending).toEqual([]);
    expect(useToastStore.getState().message).toBe('Alcanzó el máximo de 200 productos favoritos.');
  });

  it('reset vacía todo y descarta respuestas de la sesión anterior', async () => {
    let resolve!: (v: string[]) => void;
    vi.mocked(api.getFavoriteSlugs).mockReturnValue(new Promise((r) => (resolve = r)));

    const p = useFavoritesStore.getState().load();
    useFavoritesStore.getState().reset();
    resolve(['de-otra-cuenta']);
    await p;
    expect(useFavoritesStore.getState()).toMatchObject({ slugs: [], isLoaded: false });
  });
});
