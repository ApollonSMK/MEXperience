import type { Plan } from '@/components/admin-appointment-form';

export interface Appointment {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  service_name: string;
  date: string; // ISO string
  duration: number;
  status: 'Confirmado' | 'Concluído' | 'Cancelado';
  payment_method: 'card' | 'minutes' | 'reception' | 'online' | 'gift' | 'cash' | 'blocked';
  payment_status?: string;
}

export interface UserProfile {
  id: string;
  display_name?: string | null;
  photo_url?: string;
  email: string;
  plan_id?: string;
  minutes_balance?: number;
}

export interface NewAppointmentSlot {
    date: Date;
    time: string;
    x?: number;
    y?: number;
}

export interface Schedule {
    id: string;
    day_name: string;
    time_slots: string[];
    order: number;
}