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
  Inbox,
  ChevronUp,
  ChevronDown,
  MessageCircle,
  LayoutDashboard,
  Building2,
  Ban,
  LucideProps
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
  Inbox,
  ChevronUp,
  ChevronDown,
  MessageCircle,
  LayoutDashboard,
  Building2,
  Ban
};

export default function DynamicIcon({ name, className, size = 20, color = 'currentColor' }: DynamicIconProps) {
  // Lucide usa PascalCase
  const toPascalCase = (str: string) => {
    if (!str) return '';
    return str.split(/[-_ ]/).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join('');
  };
  
  const PascalName = toPascalCase(name || 'check');
  const LucideIcon = IconMap[PascalName] || IconMap['CheckCircle'];

  return <LucideIcon className={className} size={size} color={color} />;
}
