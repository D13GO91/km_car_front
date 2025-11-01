-- Tabela para registros de abastecimento e consumo de combustível
CREATE TABLE IF NOT EXISTS public.fuel_records_2025_11_01_19_24 (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    car_id UUID REFERENCES public.cars_2025_11_01_19_24(id) ON DELETE CASCADE NOT NULL,
    date_filled DATE NOT NULL,
    mileage INTEGER NOT NULL,
    fuel_type VARCHAR(20) NOT NULL, -- gasolina, etanol, diesel, gnv
    liters DECIMAL(8,3) NOT NULL,
    cost_per_liter DECIMAL(6,3),
    total_cost DECIMAL(10,2),
    gas_station VARCHAR(200),
    is_full_tank BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_fuel_records_car_id ON public.fuel_records_2025_11_01_19_24(car_id);
CREATE INDEX IF NOT EXISTS idx_fuel_records_date ON public.fuel_records_2025_11_01_19_24(date_filled);
CREATE INDEX IF NOT EXISTS idx_fuel_records_mileage ON public.fuel_records_2025_11_01_19_24(mileage);

-- RLS (Row Level Security)
ALTER TABLE public.fuel_records_2025_11_01_19_24 ENABLE ROW LEVEL SECURITY;

-- Policy para usuários verem registros de combustível de seus próprios carros
CREATE POLICY "Users can view own car fuel records" ON public.fuel_records_2025_11_01_19_24
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.cars_2025_11_01_19_24 
            WHERE id = car_id AND user_id = auth.uid()
        )
    );

-- Policy para usuários criarem registros de combustível para seus próprios carros
CREATE POLICY "Users can create fuel records for own cars" ON public.fuel_records_2025_11_01_19_24
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.cars_2025_11_01_19_24 
            WHERE id = car_id AND user_id = auth.uid()
        )
    );

-- Policy para usuários atualizarem registros de combustível de seus próprios carros
CREATE POLICY "Users can update own car fuel records" ON public.fuel_records_2025_11_01_19_24
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.cars_2025_11_01_19_24 
            WHERE id = car_id AND user_id = auth.uid()
        )
    );

-- Policy para usuários deletarem registros de combustível de seus próprios carros
CREATE POLICY "Users can delete own car fuel records" ON public.fuel_records_2025_11_01_19_24
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.cars_2025_11_01_19_24 
            WHERE id = car_id AND user_id = auth.uid()
        )
    );