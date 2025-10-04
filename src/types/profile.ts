
export type Profile = {
  id: string;
  created_at: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  phone: string | null;
  subscription_plan: string | null;
  // Propriedade opcional para dados aninhados da consulta
  user?: { created_at: string } | { created_at: string }[] | null;
};
