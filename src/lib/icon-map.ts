
import { Sun, Waves, Dna, Sunrise, Wrench, Heart, Smile, Star, Leaf, Wind } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import * as icons from 'lucide-react';

export const iconMap = {
  Sun,
  Waves,
  Dna,
  Sunrise,
  Heart,
  Smile,
  Star,
  Leaf,
  Wind,
  default: Wrench,
};

// Helper function to format icon names to match the lucide-react export keys
// e.g., "Collagen Boost" -> "CollagenBoost", "sun" -> "Sun"
const formatIconName = (name: string): string => {
    return name
        .split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');
}

export function getIcon(name: string | null | undefined): LucideIcon {
    if (!name) return iconMap.default;

    const formattedName = formatIconName(name);

    // @ts-ignore
    const IconComponent = icons[formattedName] as LucideIcon | undefined;
    
    return IconComponent || iconMap.default;
}
