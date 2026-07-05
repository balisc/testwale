'use client';

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

export default function CircularGauge({
  value,
  size = 120,
  stroke = 10,
  label,
  sublabel,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
}) {
  const pct = Math.min(100, Math.max(0, value));
  const radius = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const endAngle = (pct / 100) * 360;

  return (
    <div className="flex w-full max-w-full flex-col items-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="h-auto w-full max-w-full"
        style={{ maxWidth: size }}
        aria-hidden={!label}
      >
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#EDE9FE" strokeWidth={stroke} />
        {pct > 0 && (
          <path
            d={describeArc(cx, cy, radius, 0, endAngle)}
            fill="none"
            stroke="#7C3AED"
            strokeWidth={stroke}
            strokeLinecap="round"
          />
        )}
        <text
          x={cx}
          y={cy - size * 0.04}
          textAnchor="middle"
          fill="#0f172a"
          fontSize={size * 0.18}
          fontWeight="700"
        >
          {Math.round(pct)}%
        </text>
        {sublabel && (
          <text
            x={cx}
            y={cy + size * 0.14}
            textAnchor="middle"
            fill="#64748b"
            fontSize={size * 0.09}
            fontWeight="500"
          >
            {sublabel}
          </text>
        )}
      </svg>
      {label && <p className="mt-1 text-xs font-semibold text-slate-500">{label}</p>}
    </div>
  );
}
