/** Original SVG illustrations for Regulating Act, 1773 revision page. */
import type { SVGProps } from 'react';

type SvgProps = SVGProps<SVGSVGElement> & { title?: string; desc?: string };

function SvgShell({ title, desc, children, className = '', ...rest }: SvgProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 120 120"
      role="img"
      aria-hidden={!title}
      className={`h-full w-full ${className}`.trim()}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {desc ? <desc>{desc}</desc> : null}
      {children}
    </svg>
  );
}

export function TradeShipIllustration(props: SvgProps) {
  return (
    <SvgShell title={props.title ?? 'East India Company trade ship'} {...props}>
      <rect x="8" y="72" width="104" height="28" rx="4" fill="#E0E7FF" />
      <path d="M20 72 Q60 48 100 72" fill="#C7D2FE" stroke="#6366F1" strokeWidth="2" />
      <rect x="48" y="38" width="24" height="34" rx="2" fill="#FFF" stroke="#6366F1" strokeWidth="2" />
      <line x1="60" y1="38" x2="60" y2="18" stroke="#7C3AED" strokeWidth="2" />
      <path d="M60 18 L88 32 L60 46 Z" fill="#DDD6FE" stroke="#7C3AED" strokeWidth="1.5" />
      <circle cx="28" cy="82" r="6" fill="#6366F1" opacity="0.3" />
      <circle cx="92" cy="82" r="6" fill="#6366F1" opacity="0.3" />
    </SvgShell>
  );
}

export function LedgerIllustration(props: SvgProps) {
  return (
    <SvgShell title={props.title ?? 'Financial ledger and coins'} {...props}>
      <rect x="24" y="20" width="56" height="72" rx="4" fill="#FFF" stroke="#D97706" strokeWidth="2" />
      <line x1="32" y1="36" x2="72" y2="36" stroke="#FDE68A" strokeWidth="3" />
      <line x1="32" y1="48" x2="68" y2="48" stroke="#E2E8F0" strokeWidth="2" />
      <line x1="32" y1="58" x2="70" y2="58" stroke="#E2E8F0" strokeWidth="2" />
      <line x1="32" y1="68" x2="64" y2="68" stroke="#E2E8F0" strokeWidth="2" />
      <circle cx="88" cy="78" r="14" fill="#FEF3C7" stroke="#D97706" strokeWidth="2" />
      <text x="88" y="83" textAnchor="middle" fontSize="12" fill="#B45309" fontWeight="700">
        ₹
      </text>
      <circle cx="88" cy="38" r="10" fill="#FEF3C7" stroke="#D97706" strokeWidth="2" />
    </SvgShell>
  );
}

export function ParliamentIllustration(props: SvgProps) {
  return (
    <SvgShell title={props.title ?? 'British Parliament building'} {...props}>
      <rect x="16" y="48" width="88" height="44" fill="#F1F5F9" stroke="#64748B" strokeWidth="2" />
      <polygon points="60,18 96,48 24,48" fill="#E2E8F0" stroke="#64748B" strokeWidth="2" />
      <rect x="28" y="58" width="12" height="20" rx="1" fill="#94A3B8" />
      <rect x="44" y="58" width="12" height="20" rx="1" fill="#94A3B8" />
      <rect x="64" y="58" width="12" height="20" rx="1" fill="#94A3B8" />
      <rect x="80" y="58" width="12" height="20" rx="1" fill="#94A3B8" />
      <rect x="52" y="68" width="16" height="24" fill="#64748B" />
      <circle cx="60" cy="32" r="6" fill="#7C3AED" opacity="0.5" />
    </SvgShell>
  );
}

export function StatuteIllustration(props: SvgProps) {
  return (
    <SvgShell title={props.title ?? 'Regulating Act statute scroll'} {...props}>
      <path
        d="M28 24 C28 18 92 18 92 24 L92 96 C92 102 28 102 28 96 Z"
        fill="#FAF5FF"
        stroke="#7C3AED"
        strokeWidth="2"
      />
      <line x1="38" y1="40" x2="82" y2="40" stroke="#C4B5FD" strokeWidth="2" />
      <line x1="38" y1="52" x2="78" y2="52" stroke="#DDD6FE" strokeWidth="2" />
      <line x1="38" y1="64" x2="80" y2="64" stroke="#DDD6FE" strokeWidth="2" />
      <text x="60" y="86" textAnchor="middle" fontSize="11" fill="#7C3AED" fontWeight="700">
        1773
      </text>
    </SvgShell>
  );
}

export function CouncilDiagramIllustration(props: SvgProps) {
  return (
    <SvgShell title={props.title ?? 'Governor-General and Council structure'} viewBox="0 0 400 420" {...props}>
      {/* Governor-General */}
      <rect x="100" y="8" width="200" height="72" rx="10" fill="#7C3AED" />
      <text x="200" y="30" textAnchor="middle" fill="#EDE9FE" fontSize="9">Office created by the Regulating Act, 1773</text>
      <text x="200" y="50" textAnchor="middle" fill="#FFF" fontSize="13" fontWeight="700">Governor-General of Bengal</text>
      <text x="200" y="66" textAnchor="middle" fill="#DDD6FE" fontSize="9">बंगाल का गवर्नर-जनरल</text>

      <line x1="200" y1="80" x2="200" y2="98" stroke="#7C3AED" strokeWidth="2" />

      {/* Council */}
      <rect x="70" y="98" width="260" height="64" rx="10" fill="#F5F3FF" stroke="#7C3AED" strokeWidth="1.5" />
      <text x="200" y="120" textAnchor="middle" fill="#7C3AED" fontSize="12" fontWeight="700">Four-Member Council</text>
      <text x="200" y="136" textAnchor="middle" fill="#64748B" fontSize="8">Majority vote could overrule Governor-General</text>
      <text x="200" y="150" textAnchor="middle" fill="#7C3AED" fontSize="9">चार सदस्यीय परिषद</text>

      {/* Councillors */}
      {[
        { x: 60, name: 'Clavering' },
        { x: 140, name: 'Monson' },
        { x: 220, name: 'Barwell' },
        { x: 300, name: 'Francis' },
      ].map(({ x, name }) => (
        <g key={name}>
          <line x1="200" y1="162" x2={x} y2="178" stroke="#C4B5FD" strokeWidth="1.5" />
          <rect x={x - 36} y="178" width="72" height="44" rx="8" fill="#FFF" stroke="#E2E8F0" strokeWidth="1.5" />
          <text x={x} y="198" textAnchor="middle" fill="#0F172A" fontSize="10" fontWeight="600">{name}</text>
          <text x={x} y="212" textAnchor="middle" fill="#94A3B8" fontSize="8">Councillor</text>
        </g>
      ))}

      <line x1="200" y1="222" x2="200" y2="248" stroke="#94A3B8" strokeWidth="2" strokeDasharray="4 3" />

      {/* Presidencies */}
      {[
        { x: 70, label: 'Bengal', sub: '(primary)', fill: '#7C3AED', text: '#FFF', subColor: '#EDE9FE' },
        { x: 200, label: 'Bombay', sub: 'Subordinate\n(war/peace only)', fill: '#FFF', text: '#0F172A', subColor: '#64748B' },
        { x: 330, label: 'Madras', sub: 'Subordinate\n(war/peace only)', fill: '#FFF', text: '#0F172A', subColor: '#64748B' },
      ].map(({ x, label, sub, fill, text, subColor }) => (
        <g key={label}>
          <line x1="200" y1="248" x2={x} y2="268" stroke="#CBD5E1" strokeWidth="1.5" />
          <rect x={x - 52} y="268" width="104" height={label === 'Bengal' ? 48 : 56} rx="8" fill={fill} stroke={fill === '#7C3AED' ? '#7C3AED' : '#E2E8F0'} strokeWidth="1.5" />
          <text x={x} y="288" textAnchor="middle" fill={text} fontSize="11" fontWeight="700">{label}</text>
          {sub.split('\n').map((line, i) => (
            <text key={line} x={x} y={302 + i * 12} textAnchor="middle" fill={subColor} fontSize="7">{line}</text>
          ))}
        </g>
      ))}
    </SvgShell>
  );
}

export function CourtTimelineIllustration({
  activeStage = 3,
  ...props
}: SvgProps & { activeStage?: number }) {
  const stages = 4;
  return (
    <SvgShell title={props.title ?? 'Supreme Court timeline'} viewBox="0 0 480 100" {...props}>
      <line x1="40" y1="50" x2="440" y2="50" stroke="#CBD5E1" strokeWidth="3" />
      <line
        x1="40"
        y1="50"
        x2={40 + ((440 - 40) * activeStage) / (stages - 1)}
        y2="50"
        stroke="#7C3AED"
        strokeWidth="3"
        className="court-timeline-progress"
      />
      {[
        { x: 40, label: '1773' },
        { x: 173, label: '1774' },
        { x: 306, label: 'Conflict' },
        { x: 440, label: '1781' },
      ].map(({ x, label }, i) => (
        <g key={label}>
          <circle cx={x} cy="50" r="12" fill={i <= activeStage ? '#7C3AED' : '#FFF'} stroke="#7C3AED" strokeWidth="2" />
          <text x={x} y="82" textAnchor="middle" fontSize="10" fill="#475569" fontWeight="600">
            {label}
          </text>
        </g>
      ))}
    </SvgShell>
  );
}

export function BalanceScaleIllustration(props: SvgProps) {
  return (
    <SvgShell title={props.title ?? 'Significance and limitations balance'} viewBox="0 0 80 100" {...props}>
      <line x1="40" y1="20" x2="40" y2="78" stroke="#64748B" strokeWidth="3" />
      <line x1="16" y1="32" x2="64" y2="32" stroke="#64748B" strokeWidth="3" />
      <line x1="16" y1="32" x2="16" y2="52" stroke="#16A34A" strokeWidth="2" />
      <ellipse cx="16" cy="58" rx="14" ry="6" fill="#DCFCE7" stroke="#16A34A" strokeWidth="1.5" />
      <line x1="64" y1="32" x2="64" y2="58" stroke="#DC2626" strokeWidth="2" />
      <ellipse cx="64" cy="64" rx="14" ry="6" fill="#FEE2E2" stroke="#DC2626" strokeWidth="1.5" />
      <polygon points="40,12 48,24 32,24" fill="#64748B" />
    </SvgShell>
  );
}

export function StudentCtaIllustration(props: SvgProps) {
  return (
    <SvgShell title={props.title ?? 'Student ready for practice'} viewBox="0 0 100 100" {...props}>
      <circle cx="50" cy="28" r="14" fill="#EDE9FE" stroke="#7C3AED" strokeWidth="2" />
      <path d="M28 78 C28 58 72 58 72 78" fill="#EDE9FE" stroke="#7C3AED" strokeWidth="2" />
      <rect x="62" y="48" width="24" height="30" rx="3" fill="#FFF" stroke="#7C3AED" strokeWidth="2" />
      <line x1="68" y1="56" x2="80" y2="56" stroke="#C4B5FD" strokeWidth="2" />
      <line x1="68" y1="64" x2="78" y2="64" stroke="#DDD6FE" strokeWidth="2" />
      <path d="M18 42 L26 38 L22 50 Z" fill="#FDE68A" stroke="#D97706" strokeWidth="1" />
    </SvgShell>
  );
}

export function FlowArrow({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 24" aria-hidden className={`h-6 w-10 shrink-0 text-brand ${className}`}>
      <path d="M4 12 H32 M26 6 L34 12 L26 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function FlowArrowDown({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 40" aria-hidden className={`mx-auto h-10 w-6 shrink-0 text-brand ${className}`}>
      <path d="M12 4 V32 M6 26 L12 34 L18 26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
