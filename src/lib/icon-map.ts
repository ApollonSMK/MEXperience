
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
// e.g., "collagen-boost" -> "CollagenBoost", "sun" -> "Sun", "sun-set" -> "SunSet"
const formatIconName = (name: string): string => {
    if (!name || typeof name !== 'string') return '';
    // Converts "sun-set" to "SunSet", and "sun" to "Sun"
    return name
        .split(/[-_ ]+/) 
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');
}

export function getIcon(name: string | null | undefined): LucideIcon {
    if (!name) return iconMap.default;

    const formattedName = formatIconName(name);

    // @ts-ignore - We are accessing the icons object by a dynamic string key
    // This provides a deterministic way to get the icon component
    const IconComponent = icons[formattedName as keyof typeof icons] as LucideIcon | undefined;
    
    // Check if the found component is a valid React component (a function)
    if (typeof IconComponent === 'function') {
        return IconComponent;
    }
    
    return iconMap.default;
}
