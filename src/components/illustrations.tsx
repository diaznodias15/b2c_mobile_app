import Svg, { Circle, Path, Rect } from 'react-native-svg';

/**
 * Ilustraciones geometricas para empty states y success screens.
 * Estilo: trazo simple, dos colores (whitelabel primary + muted),
 * sin gradientes ni sombras. Deliberadamente "dibujado a mano" para
 * evitar el feeling AI-generic.
 */

const stroke = '#0f766e';
const fillMuted = '#60646C';
const fillSoft = '#E5E7EB';

type Props = {
  width?: number;
  height?: number;
};

export function EmptyCartIllustration({ width = 160, height = 160 }: Props) {
  return (
    <Svg width={width} height={height} viewBox="0 0 200 200" fill="none">
      {/* Bolsa de compras estilizada */}
      <Path
        d="M50 70 L150 70 L145 160 L55 160 Z"
        stroke={stroke}
        strokeWidth={2.5}
        fill="white"
        strokeLinejoin="round"
      />
      {/* Asas */}
      <Path
        d="M75 70 C75 50, 90 40, 100 40 C110 40, 125 50, 125 70"
        stroke={stroke}
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
      />
      {/* Linea interna (vacío) */}
      <Path
        d="M70 100 L130 100"
        stroke={fillMuted}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeDasharray="4 4"
      />
      <Path
        d="M70 125 L130 125"
        stroke={fillMuted}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeDasharray="4 4"
      />
      {/* Pequenos circulos decorativos */}
      <Circle cx="40" cy="100" r="3" fill={fillSoft} />
      <Circle cx="160" cy="120" r="2" fill={fillSoft} />
    </Svg>
  );
}

export function EmptySearchIllustration({ width = 160, height = 160 }: Props) {
  return (
    <Svg width={width} height={height} viewBox="0 0 200 200" fill="none">
      {/* Lupa */}
      <Circle
        cx="85"
        cy="85"
        r="40"
        stroke={stroke}
        strokeWidth={2.5}
        fill="white"
      />
      <Circle
        cx="85"
        cy="85"
        r="32"
        stroke={fillMuted}
        strokeWidth={1.5}
        fill="none"
        strokeDasharray="3 4"
      />
      {/* Mango */}
      <Path
        d="M115 115 L150 150"
        stroke={stroke}
        strokeWidth={3.5}
        strokeLinecap="round"
      />
      {/* Punto de "no encontrado" */}
      <Path
        d="M70 85 L100 85"
        stroke={fillMuted}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M85 70 L85 100"
        stroke={fillMuted}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function EmptyDepartmentIllustration({ width = 160, height = 160 }: Props) {
  return (
    <Svg width={width} height={height} viewBox="0 0 200 200" fill="none">
      {/* Estante */}
      <Rect x="40" y="50" width="120" height="6" fill={fillMuted} rx="2" />
      <Rect x="40" y="100" width="120" height="6" fill={fillMuted} rx="2" />
      <Rect x="40" y="150" width="120" height="6" fill={fillMuted} rx="2" />
      {/* Cajas vacías */}
      <Rect
        x="55"
        y="60"
        width="20"
        height="35"
        stroke={stroke}
        strokeWidth={2}
        fill="white"
        strokeDasharray="3 3"
      />
      <Rect
        x="90"
        y="60"
        width="20"
        height="35"
        stroke={stroke}
        strokeWidth={2}
        fill="white"
        strokeDasharray="3 3"
      />
      <Rect
        x="125"
        y="60"
        width="20"
        height="35"
        stroke={stroke}
        strokeWidth={2}
        fill="white"
        strokeDasharray="3 3"
      />
    </Svg>
  );
}

export function CheckIllustration({
  size = 140,
}: { size?: number }) {
  // Animado en el cliente (stroke-dashoffset) — ver AnimatedCheckCircle.
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Circle cx="50" cy="50" r="45" fill="#17C964" fillOpacity={0.15} />
      <Path
        d="M30 50 L45 65 L72 35"
        stroke="#17C964"
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
