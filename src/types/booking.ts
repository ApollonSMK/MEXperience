
export type Booking = {
  id: number;
  created_at: string;
  user_id: string | null;
  service_id: string;
  date: string;
  time: string;
  status: 'Pendente' | 'Confirmado' | 'Cancelado';
  duration: number;
  name: string | null;
  email: string | null;
  avatar_url?: string | null; // Adicionado para a junção de dados
};
