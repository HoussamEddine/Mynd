import React from 'react';
import { View, ViewStyle } from 'react-native';
import { 
  ArrowUpCircle, BarChart, Clock, Heart, Home, Plus, Search, Settings, 
  CheckCircle, AlertCircle, X, Activity, Calendar, Bell, User,
  ChevronRight, ChevronLeft, ChevronDown, ChevronUp,
  Edit, Trash, Save, Share, Download, Upload, 
  Sun, Moon, Star, Zap, 
  Pencil, FileText, CirclePlus, CircleMinus,
  MinusCircle, Mail, Lock, Unlock, Eye, EyeOff,
  Compass, PlusCircle, MapPin, BookOpen, Award,
  BarChart2, Briefcase, Camera, Coffee, Gift,
  HelpCircle, Info, MessageCircle, Music, Phone,
  ShoppingBag, Tag, ThumbsUp, TrendingUp, Video,
  Brain, Lightbulb, Sparkles, MessageSquare, Play
} from 'lucide-react-native';

// Map of available icons
const ICONS = {
  'arrow-up-circle': ArrowUpCircle,
  'bar-chart': BarChart,
  'bar-chart-2': BarChart2,
  'brain': Brain,
  'clock': Clock,
  'heart': Heart,
  'home': Home,
  'lightbulb': Lightbulb,
  'plus': Plus,
  'plus-circle': PlusCircle,
  'search': Search,
  'settings': Settings,
  'check-circle': CheckCircle,
  'alert-circle': AlertCircle,
  'x': X,
  'activity': Activity,
  'calendar': Calendar,
  'bell': Bell,
  'user': User,
  'chevron-right': ChevronRight,
  'chevron-left': ChevronLeft,
  'chevron-down': ChevronDown,
  'chevron-up': ChevronUp,
  'edit': Edit,
  'trash': Trash,
  'save': Save,
  'share': Share,
  'download': Download,
  'upload': Upload,
  'sun': Sun,
  'moon': Moon,
  'star': Star,
  'zap': Zap,
  'pencil': Pencil,
  'file-text': FileText,
  'circle-plus': CirclePlus,
  'circle-minus': CircleMinus,
  'minus-circle': MinusCircle,
  'mail': Mail,
  'lock': Lock,
  'unlock': Unlock,
  'eye': Eye,
  'eye-off': EyeOff,
  'compass': Compass,
  'map-pin': MapPin,
  'book-open': BookOpen,
  'award': Award,
  'briefcase': Briefcase,
  'camera': Camera,
  'coffee': Coffee,
  'gift': Gift,
  'help-circle': HelpCircle,
  'info': Info,
  'message-circle': MessageCircle,
  'message-square': MessageSquare,
  'music': Music,
  'phone': Phone,
  'shopping-bag': ShoppingBag,
  'sparkles': Sparkles,
  'tag': Tag,
  'thumbs-up': ThumbsUp, 
  'trending-up': TrendingUp,
  'video': Video,
  'play': Play,
};

// Type for our icon names
export type IconName = keyof typeof ICONS;

interface LucideIconProps {
  name: IconName;
  color?: string;
  size?: number;
  strokeWidth?: number;
  style?: ViewStyle;
}

/**
 * A wrapper component for Lucide icons
 * Usage: <Icon name="heart" color="#ff0000" size={24} />
 */
const Icon = ({ 
  name, 
  color = '#000', 
  size = 24, 
  strokeWidth = 2,
  style 
}: LucideIconProps) => {
  const IconComponent = ICONS[name];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in our icon set`);
    return <View style={{ width: size, height: size }} />;
  }
  
  return (
    <IconComponent 
      color={color} 
      size={size} 
      strokeWidth={strokeWidth} 
      style={style} 
    />
  );
};

export default Icon; 