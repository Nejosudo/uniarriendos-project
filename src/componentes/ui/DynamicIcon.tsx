import {
  X,
  Heart,
  Search,
  Upload,
  Camera,
  Image as ImageIcon,
  ExternalLink,
  Edit,
  Trash2,
  AlertTriangle,
  PlusCircle,
  ArrowLeft,
  Plus,
  Home,
  CheckCircle,
  Check,
  MapPin,
  Wifi,
  Tv,
  Car,
  Bed,
  Bath,
  Users,
  Shield,
  Zap,
  Snowflake,
  Coffee,
  Utensils,
  Key,
  WashingMachine,
  Wind,
  User,
  HelpCircle,
  MessageSquare,
  Lightbulb,
  Send,
  Toilet,
  Inbox,
  ChevronUp,
  ChevronDown,
  MessageCircle,
  LayoutDashboard,
  Building2,
  Ban,
  LucideProps,
  Bell
} from 'lucide-react';

interface DynamicIconProps {
  name: string;
  className?: string;
  size?: number;
  color?: string;
}

const IconMap: Record<string, React.FC<LucideProps>> = {
  X,
  Heart,
  Search,
  Upload,
  Camera,
  Image: ImageIcon,
  ExternalLink,
  Edit,
  Trash2,
  AlertTriangle,
  PlusCircle,
  ArrowLeft,
  Plus,
  Home,
  CheckCircle,
  Check,
  MapPin,
  Wifi,
  Tv,
  Car,
  Bed,
  Bath,
  Users,
  Shield,
  Zap,
  Snowflake,
  Coffee,
  Utensils,
  Key,
  WashingMachine,
  Wind,
  User,
  HelpCircle,
  MessageSquare,
  Lightbulb,
  Send,
  Toilet,
  Inbox,
  ChevronUp,
  ChevronDown,
  MessageCircle,
  LayoutDashboard,
  Building2,
  Ban,
  Bell
};

const aliases: Record<string, string> = {
  wifi: 'Wifi',
  parqueadero: 'Car',
  parking: 'Car',
  aire: 'Wind',
  'aire-acondicionado': 'Snowflake',
  cocina: 'Utensils',
  lavanderia: 'WashingMachine',
  'lavadora': 'WashingMachine',
  petfriendly: 'Heart',
};

export default function DynamicIcon({ name, className, size = 20, color = 'currentColor' }: DynamicIconProps) {
  const raw = (name || 'check').trim().toLowerCase().replace(/\s+/g, '-');
  const alias = aliases[raw];
  const normalized = alias || raw;
  const toPascalCase = (str: string) => str.split(/[-_\s]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
  const pascal = toPascalCase(normalized);
  const lowerMap: Record<string, React.FC<LucideProps>> = Object.fromEntries(Object.entries(IconMap).map(([k, v]) => [k.toLowerCase(), v]));
  const LucideIcon = lowerMap[pascal.toLowerCase()] || lowerMap[normalized.toLowerCase()] || IconMap['CheckCircle'];
  return <LucideIcon className={className} size={size} color={color} />;
}
