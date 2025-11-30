-- 1. Adiciona a coluna 'updated_at' se ela ainda não existir
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Cria a função que atualiza o timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. Cria o trigger que dispara antes de qualquer UPDATE na tabela appointments
DROP TRIGGER IF EXISTS update_appointments_updated_at ON public.appointments;

CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();