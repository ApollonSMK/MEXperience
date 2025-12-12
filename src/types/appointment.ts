import type { Plan } from '@/components/admin-appointment-form';

export interface Appointment {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string | null;
  service_name: string;
  date: string; // ISO string
  duration: number;
  status: 'Confirmado' | 'Concluído' | 'Cancelado';
  payment_method: 'card' | 'minutes' | 'reception' | 'online' | 'gift' | 'cash' | 'blocked' | 'mixed' | 'external_me_beauty';
  payment_status?: string;
}

export interface UserProfile {
  id: string;
  display_name?: string | null;
  photo_url?: string;
  email: string;
  plan_id?: string;
  minutes_balance?: number;
  is_admin?: boolean;
  is_influencer?: boolean;
  is_reseller?: boolean;
  referral_code?: string;
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