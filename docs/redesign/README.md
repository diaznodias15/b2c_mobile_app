# Rediseño UI/UX e-commerce — plan y convenciones

Rama: `rediseno`. Objetivo: una alternativa de interfaz pensada para
conversión en e-commerce (descubrir → comparar → agregar → pagar), **sin tocar
los archivos actuales** y adoptable pantalla por pantalla.

Documentos:

| Archivo | Para qué |
|---|---|
| [`DESIGN-SYSTEM.md`](./DESIGN-SYSTEM.md) | Principios, tokens, tipografía, espaciado, estados, accesibilidad |
| [`MIGRATION.md`](./MIGRATION.md) | Inventario de componentes/vistas, orden de implementación y checklist por paso |

## Cómo funciona la idea

Todo lo nuevo vive en `src/redesign/` y **refleja la estructura actual**:

```
src/redesign/
├── ui/            # primitivas del rediseño (Text, Surface, Button, Chip, Price…)
├── components/    # 1 archivo por componente rediseñado (mismo nombre y props que el actual)
└── screens/       # 1 archivo por vista rediseñada (el cuerpo de la pantalla)
```

Reglas:

1. **Mismo contrato que el original.** Un componente v2 exporta el mismo nombre
   y acepta las mismas props que el actual (`ProductCard`, `ProductListItem`…).
   Así el cambio es de una línea: el `import`.
2. **Las pantallas no pueden vivir en `src/app/`** (cada archivo ahí es una ruta).
   La vista nueva va en `src/redesign/screens/XScreen.tsx` y el cambio es que el
   archivo de ruta la reexporte:
   ```ts
   // src/app/index.tsx
   export { default } from '@/redesign/screens/HomeScreen';
   ```
   El código viejo no se borra hasta que la vista nueva esté validada; volver
   atrás es restaurar esa línea.
3. **Lógica no se duplica.** Hooks, stores, utils y servicios (`useAddToCartFlight`,
   `getProductPricing`, `useDisplayCurrency`, `cart.store`…) se reutilizan tal
   cual. El rediseño solo cambia presentación e interacción.
4. **Se mantienen las convenciones de `AGENTS.md`**: estilos inline (nada de
   `className` en `<Text>`/`<View>`), colores desde `useThemeColors()`, iconos
   de `lucide-react-native`, tuteo en los textos, y sin selectores de Zustand
   que armen objetos.
5. **Whitelabel intacto.** El admin cambia los colores desde el backend, así que
   el rediseño trabaja con *roles* de color (`primary`, `section`, `muted`…),
   nunca con hex fijos.

## Qué queda fuera

- Cambios de API, stores o navegación (salvo lo imprescindible para una vista).
- Modo oscuro real (la app no lo implementa; ver `AGENTS.md`). El rediseño
  queda listo para tenerlo (tokens semánticos) pero no lo activa.
- Fuentes personalizadas en la primera fase (ver `DESIGN-SYSTEM.md` §Tipografía).
