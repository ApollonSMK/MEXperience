
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

export function getIcon(name: string | null | undefined): LucideIcon {
    if (!name) return iconMap.default;
    // @ts-ignore
    const IconComponent = icons[name] as LucideIcon;
    return IconComponent || iconMap.default;
}
