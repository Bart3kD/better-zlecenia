import { 
  Calculator, 
  Database, 
  Shield, 
  Activity, 
  Globe, 
  Code, 
  Users, 
  Image, 
  Leaf, 
  Monitor, 
  Heart, 
  Clock, 
  ShieldCheck, 
  Scale, 
  Brain, 
  Languages, 
  Map, 
  BookOpen, 
  Zap, 
  Smartphone, 
  Settings, 
  Award, 
  Flag, 
  Layers, 
  CheckCircle, 
  Calendar, 
  Briefcase, 
  TrendingUp, 
  Server,
  FileText,
  type LucideIcon
} from 'lucide-react';

// Icon mapping for database icon names to Lucide React components
const ICON_MAP: Record<string, LucideIcon> = {
  'calculator': Calculator,
  'database': Database,
  'shield': Shield,
  'activity': Activity,
  'globe': Globe,
  'code': Code,
  'users': Users,
  'image': Image,
  'leaf': Leaf,
  'monitor': Monitor,
  'heart': Heart,
  'clock': Clock,
  'shield-check': ShieldCheck,
  'balance-scale': Scale,
  'brain': Brain,
  'language': Languages,
  'map': Map,
  'book-open': BookOpen,
  'zap': Zap,
  'smartphone': Smartphone,
  'settings': Settings,
  'award': Award,
  'flag': Flag,
  'layers': Layers,
  'check-circle': CheckCircle,
  'calendar': Calendar,
  'briefcase': Briefcase,
  'trending-up': TrendingUp,
  'server': Server,
};

/**
 * Get Lucide React icon component by name
 * @param iconName - The icon name from the database
 * @returns LucideIcon component or FileText as fallback
 */
export const getIconByName = (iconName?: string): LucideIcon => {
  if (!iconName) return FileText;
  return ICON_MAP[iconName] || FileText;
};

/**
 * Render icon with consistent styling
 * @param iconName - The icon name from the database
 * @param className - Additional CSS classes
 * @returns JSX element with the icon
 */
export const renderIcon = (iconName?: string, className?: string) => {
  const IconComponent = getIconByName(iconName);
  return <IconComponent className={className} />;
};