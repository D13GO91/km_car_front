-- Tabela para armazenar informações dos carros dos usuários
CREATE TABLE IF NOT EXISTS public.cars_2025_11_01_19_24 (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    license_plate VARCHAR(20),
    color VARCHAR(50),
    engine_type VARCHAR(50), -- gasolina, etanol, flex, diesel, híbrido, elétrico
    mileage INTEGER DEFAULT 0, -- quilometragem atual
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_cars_user_id ON public.cars_2025_11_01_19_24(user_id);

-- RLS (Row Level Security)
ALTER TABLE public.cars_2025_11_01_19_24 ENABLE ROW LEVEL SECURITY;

-- Policy para usuários verem apenas seus próprios carros
CREATE POLICY "Users can view own cars" ON public.cars_2025_11_01_19_24
    FOR SELECT USING (auth.uid() = user_id);

-- Policy para usuários criarem carros
CREATE POLICY "Users can create own cars" ON public.cars_2025_11_01_19_24
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy para usuários atualizarem seus próprios carros
CREATE POLICY "Users can update own cars" ON public.cars_2025_11_01_19_24
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy para usuários deletarem seus próprios carros
CREATE POLICY "Users can delete own cars" ON public.cars_2025_11_01_19_24
    FOR DELETE USING (auth.uid() = user_id);