
'use client';
import { createContext, useContext } from 'react';
import type { Service } from '@/lib/services';

export const ServicesContext = createContext<Service[]>([]);

export function useServices() {
  const context = useContext(ServicesContext);
  if (context === undefined) {
    throw new Error('useServices must be used within a ServicesProvider');
  }
  return context;
}
