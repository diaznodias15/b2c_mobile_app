import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Los textos de la interfaz usan tuteo ("Inicia sesión", "Agrega productos"),
 * no voseo ("Iniciá sesión", "Agregá productos"). Había una mezcla de ambos;
 * este test evita que el voseo vuelva a colarse en un archivo nuevo.
 *
 * Lista conservadora: formas verbales de voseo inequívocas. Solo mira líneas
 * de código/strings (ignora comentarios y tests).
 */
const VOSEO =
  /(?<![\p{L}])(Iniciá|Agregá|Escribí|Elegí|Revisá|Completá|Intentá|Probá|Ingresá|Tocá|Arrastrá|Seleccioná|Confirmá|Volvé|Esperá|Buscá|Usá|Mirá|Contactá|Cerrá|Abrí|Dejá|Llená|Descubrí|Conocé|Sumá|Comprá|Hacé|Guardá|Editá|Eliminá|Verificá|Reintentá|Cambiá|Actualizá|Compartí|Seguí|Continuá|Terminá|Mandá|Enviá|Copiá|Pegá|Llamá|Entrá|Salí|Recibí|Creá|Tené|Decí|Avisá|Mostrá|Registrate|Ingresate|Pagás|tenés|querés|podés|sabés|acá)(?![\p{L}])/iu;

function listSourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listSourceFiles(full);
    if (!/\.(ts|tsx)$/.test(entry.name)) return [];
    if (/\.test\.|generated/.test(entry.name)) return [];
    return [full];
  });
}

describe('textos de la interfaz', () => {
  it('no usan voseo', () => {
    const offenders: string[] = [];
    for (const file of listSourceFiles(path.resolve(__dirname, '..'))) {
      fs.readFileSync(file, 'utf8')
        .split(/\r?\n/)
        .forEach((line, index) => {
          const t = line.trim();
          if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return;
          const match = line.match(VOSEO);
          if (match) offenders.push(`${path.relative(process.cwd(), file)}:${index + 1} → "${match[0]}"`);
        });
    }
    expect(offenders).toEqual([]);
  });
});
