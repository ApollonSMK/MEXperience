
'use client';

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

// A much simpler and more direct way to get the icon component
export function getIcon(name: string | null | undefined): LucideIcon {
    if (!name) {
        return iconMap.default;
    }
    
    // The keys in the lucide-react library are PascalCase, e.g., "Sun", "Dna"
    // We assume the name passed in is already in the correct format.
    const IconComponent = (icons as Record<string, LucideIcon>)[name];

    if (IconComponent) {
        return IconComponent;
    }

    // Fallback for icons defined in our explicit map
    const fallbackIcon = (iconMap as Record<string, LucideIcon>)[name.toLowerCase()];
    if (fallbackIcon) {
        return fallbackIcon;
    }
    
    return iconMap.default;
}
