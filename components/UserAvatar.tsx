type UserAvatarProps = {
  name: string;
  id?: string | null;
  email?: string | null;
  className?: string;
  textClassName?: string;
};

const avatarStyles = [
  'from-violet-500 via-fuchsia-500 to-rose-500',
  'from-indigo-500 via-sky-500 to-cyan-400',
  'from-emerald-500 via-teal-500 to-cyan-500',
  'from-amber-400 via-orange-500 to-rose-500',
  'from-purple-500 via-indigo-500 to-blue-500',
  'from-lime-500 via-emerald-500 to-teal-500',
];

function getInitials(name: string, email?: string | null) {
  const source = name.trim() || email?.split('@')[0] || 'User';
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function getAvatarStyle(seed: string) {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 9973;
  }

  return avatarStyles[hash % avatarStyles.length];
}

export default function UserAvatar({
  name,
  id,
  email,
  className = 'h-10 w-10 rounded-2xl',
  textClassName = 'text-sm',
}: UserAvatarProps) {
  const label = name.trim() || email || 'User';
  const seed = `${id ?? ''}:${email ?? ''}:${label}`;
  const initials = getInitials(label, email);
  const gradient = getAvatarStyle(seed);

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br ${gradient} font-bold text-white shadow-sm ring-1 ring-white/60 ${className}`}
      aria-label={`${label} avatar`}
      title={label}
    >
      <span className="absolute -right-2 -top-2 h-1/2 w-1/2 rounded-full bg-white/20" />
      <span className="absolute -bottom-3 -left-2 h-2/3 w-2/3 rounded-full bg-slate-950/10" />
      <span className={`relative z-10 tracking-wide ${textClassName}`}>{initials}</span>
    </div>
  );
}
