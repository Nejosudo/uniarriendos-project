import * as icons from 'lucide-react';

interface DynamicIconProps {
  name: string;
  className?: string;
  size?: number;
  color?: string;
}

export default function DynamicIcon({ name, className, size = 20, color = 'currentColor' }: DynamicIconProps) {
  // Lucide usa PascalCase para las llaves exportadas (ej: 'WashingMachine', 'Wifi')
  const toPascalCase = (str: string) => {
    return str.split(/[-_ ]/).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join('');
  };
  
  const PascalName = toPascalCase(name || 'check');
  const LucideIcon = (icons as any)[PascalName];

  if (!LucideIcon) {
    const Fallback = (icons as any)['CheckCircle'] || (icons as any)['Check'];
    if (!Fallback) return null;
    return <Fallback className={className} size={size} color={color} />;
  }

  return <LucideIcon className={className} size={size} color={color} />;
}
