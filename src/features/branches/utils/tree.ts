import type { BranchGroup, BranchItem } from '@/types/whitelabel';

/**
 * Aplana el árbol `data.branches[]` (estado → ciudad → items)
 * a una lista plana de `BranchItem` para iterar sin anidar.
 */
export function flattenBranchTree(tree: BranchGroup[]): BranchItem[] {
  if (!tree || tree.length === 0) return [];
  const out: BranchItem[] = [];
  for (const group of tree) {
    if (group.items && group.items.length > 0) {
      out.push(...group.items);
    }
  }
  return out;
}

/**
 * Busca la sede marcada como `is_default = 1`.
 * Si no hay default explícito, devuelve la primera del primer grupo.
 * Devuelve `null` si el árbol está vacío.
 */
export function pickDefaultBranch(tree: BranchGroup[]): BranchItem | null {
  if (!tree || tree.length === 0) return null;
  // Primero: buscar is_default=1 en todo el árbol.
  for (const group of tree) {
    const found = group.items?.find((it) => Number(it.is_default) === 1);
    if (found) return found;
  }
  // Fallback: primera sede del primer grupo.
  return tree[0]?.items?.[0] ?? null;
}

/**
 * Busca una sede por id dentro del árbol.
 * Devuelve `null` si no existe.
 */
export function findBranchById(
  tree: BranchGroup[],
  id: number
): BranchItem | null {
  if (!tree || tree.length === 0) return null;
  for (const group of tree) {
    const found = group.items?.find((it) => it.value === id);
    if (found) return found;
  }
  return null;
}
