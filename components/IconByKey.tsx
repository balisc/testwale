import {
  AlertTriangle,
  BadgeCheck,
  Blocks,
  Book,
  BookOpen,
  Building2,
  FilePen,
  Flag,
  Gavel,
  GitBranch,
  HeartHandshake,
  Landmark,
  LucideIcon,
  Network,
  Scale,
  Scroll,
  ShieldCheck,
  UserCheck,
  Users,
  Vote,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  landmark: Landmark,
  book: Book,
  'book-open': BookOpen,
  scale: Scale,
  'shield-check': ShieldCheck,
  scroll: Scroll,
  flag: Flag,
  'file-pen': FilePen,
  network: Network,
  'user-check': UserCheck,
  gavel: Gavel,
  'building-2': Building2,
  users: Users,
  'git-branch': GitBranch,
  'alert-triangle': AlertTriangle,
  'badge-check': BadgeCheck,
  blocks: Blocks,
  vote: Vote,
  'heart-handshake': HeartHandshake,
};

type IconByKeyProps = {
  iconKey?: string | null;
  className?: string;
  strokeWidth?: number;
};

export default function IconByKey({ iconKey, className, strokeWidth = 2 }: IconByKeyProps) {
  const Icon = (iconKey && ICON_MAP[iconKey]) || BookOpen;
  return <Icon className={className} strokeWidth={strokeWidth} aria-hidden />;
}

export { ICON_MAP };
