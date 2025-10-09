# MEXperience - Instruções de Correção Urgente

## Script 1: CORRIGIR A FALTA DA COLUNA 'qr_token' (ERRO ATUAL)

O erro `column bookings.qr_token does not exist` acontece porque o código precisa de uma coluna na base de dados que não existe. Execute o SQL abaixo para a criar e resolver o problema de uma vez por todas.

```sql
-- Adiciona a coluna para o QR Code Token, se ainda não existir.
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS qr_token TEXT UNIQUE;

-- Atualiza a função que cria agendamentos para gerar o token automaticamente.
CREATE OR REPLACE FUNCTION create_booking_as_admin(
    p_user_id uuid,
    p_service_id text,
    p_date date,
    p_time time,
    p_status text,
    p_duration integer,
    p_name text,
    p_email text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
  new_qr_token TEXT;
BEGIN
  -- Gera um UUID para usar como token
  new_qr_token := extensions.uuid_generate_v4();
  
  -- Insere o novo agendamento com o token
  INSERT INTO public.bookings (user_id, service_id, date, "time", status, duration, name, email, qr_token)
  VALUES (p_user_id, p_service_id, p_date, p_time, p_status, p_duration, p_name, p_email, new_qr_token);
END;
$$;

-- Atualiza a função de leitura para incluir a nova coluna.
CREATE OR REPLACE FUNCTION get_all_bookings_with_details(start_date date, end_date date)
  RETURNS TABLE (
      id int8,
      created_at timestamptz,
      user_id uuid,
      service_id text,
      date date,
      "time" time,
      status text,
      duration int4,
      name text,
      email text,
      avatar_url text,
      qr_token text
  )
  LANGUAGE sql
  SECURITY DEFINER
  AS $$
      SELECT
          b.id,
          b.created_at,
          b.user_id,
          b.service_id,
          b.date,
          b.time,
          b.status,
          b.duration,
          COALESCE(p.full_name, u.raw_user_meta_data->>'full_name', b.name) AS name,
          COALESCE(u.email, b.email) AS email,
          COALESCE(p.avatar_url, u.raw_user_meta_data->>'picture') AS avatar_url,
          b.qr_token -- Coluna adicionada aqui
      FROM
          public.bookings b
      LEFT JOIN
          public.profiles p ON b.user_id = p.id
      LEFT JOIN
          auth.users u ON b.user_id = u.id
      WHERE
          b.date >= start_date AND b.date < end_date
      ORDER BY
          b.time ASC;
  $$;

```

---

## Script 2: Corrigir Permissões de Edição de Perfil de Utilizador

Se os administradores não conseguem editar perfis de outros utilizadores, execute o seguinte código SQL.

```sql
-- HABILITA A ROW LEVEL SECURITY (SE AINDA NÃO ESTIVER ATIVA)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- REMOVE POLÍTICAS ANTIGAS PARA EVITAR CONFLITOS
DROP POLICY IF EXISTS "Admins can update any profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;

-- CRIA A POLÍTICA PARA PERMITIR QUE ADMINS ATUALIZEM QUALQUER PERFIL
CREATE POLICY "Admins can update any profile."
ON public.profiles FOR UPDATE
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- CRIA A POLÍTICA PARA UTILIZADORES NORMAIS (EDITAR O PRÓPRIO PERFIL)
CREATE POLICY "Users can update own profile."
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

```

---

## Script 3: Corrigir Permissões de Gestão de Horários

Para garantir que apenas administradores podem criar, editar ou apagar os horários de funcionamento, execute o seguinte código SQL.

```sql
-- 1. Habilita a Row Level Security para a tabela de horários
ALTER TABLE public.operating_hours ENABLE ROW LEVEL SECURITY;

-- 2. Remove políticas antigas para evitar conflitos (opcional mas recomendado)
DROP POLICY IF EXISTS "Admins can manage operating hours" ON public.operating_hours;
DROP POLICY IF EXISTS "Public can read operating hours" ON public.operating_hours;

-- 3. Cria uma política para permitir que todos leiam os horários (necessário para os formulários de agendamento)
CREATE POLICY "Public can read operating hours"
ON public.operating_hours FOR SELECT
USING (true);

-- 4. Cria a política principal que permite a administradores gerir (inserir, atualizar, apagar) os horários
CREATE POLICY "Admins can manage operating hours"
ON public.operating_hours FOR ALL -- 'ALL' cobre INSERT, UPDATE, DELETE
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

```

Peço desculpa, de novo, por toda esta saga.
