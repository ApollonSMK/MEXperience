
'use client';

import { Sun, Waves, Dna, Sunrise, Wrench, Heart, Smile, Star, Leaf, Wind, Sunset, User, Check, Car, Hand, Info } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const iconMap: { [key: string]: LucideIcon } = {
  sun: Sun,
  waves: Waves,
  dna: Dna,
  sunrise: Sunrise,
  heart: Heart,
  smile: Smile,
  star: Star,
  leaf: Leaf,
  wind: Wind,
  sunset: Sunset,
  user: User,
  check: Check,
  car: Car,
  hand: Hand,
  info: Info,
  default: Wrench,
};

export function getIcon(name: string | null | undefined): LucideIcon {
    if (!name) {
        return iconMap.default;
    }
    const lowerCaseName = name.toLowerCase();
    return iconMap[lowerCaseName] || iconMap.default;
}
