-- Tabela para registros de manutenção realizadas
CREATE TABLE IF NOT EXISTS public.maintenance_records_2025_11_01_19_24 (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    car_id UUID REFERENCES public.cars_2025_11_01_19_24(id) ON DELETE CASCADE NOT NULL,
    maintenance_type_id UUID REFERENCES public.maintenance_types_2025_11_01_19_24(id) NOT NULL,
    date_performed DATE NOT NULL,
    mileage_at_service INTEGER,
    cost DECIMAL(10,2),
    notes TEXT,
    next_service_km INTEGER, -- próxima manutenção em km
    next_service_date DATE, -- próxima manutenção por data
    service_provider VARCHAR(200), -- oficina/prestador
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_maintenance_records_car_id ON public.maintenance_records_2025_11_01_19_24(car_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_next_service_date ON public.maintenance_records_2025_11_01_19_24(next_service_date);

-- RLS (Row Level Security)
ALTER TABLE public.maintenance_records_2025_11_01_19_24 ENABLE ROW LEVEL SECURITY;

-- Policy para usuários verem registros de seus próprios carros
CREATE POLICY "Users can view own car maintenance records" ON public.maintenance_records_2025_11_01_19_24
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.cars_2025_11_01_19_24 
            WHERE id = car_id AND user_id = auth.uid()
        )
    );

-- Policy para usuários criarem registros para seus próprios carros
CREATE POLICY "Users can create maintenance records for own cars" ON public.maintenance_records_2025_11_01_19_24
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.cars_2025_11_01_19_24 
            WHERE id = car_id AND user_id = auth.uid()
        )
    );

-- Policy para usuários atualizarem registros de seus próprios carros
CREATE POLICY "Users can update own car maintenance records" ON public.maintenance_records_2025_11_01_19_24
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.cars_2025_11_01_19_24 
            WHERE id = car_id AND user_id = auth.uid()
        )
    );

-- Policy para usuários deletarem registros de seus próprios carros
CREATE POLICY "Users can delete own car maintenance records" ON public.maintenance_records_2025_11_01_19_24
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.cars_2025_11_01_19_24 
            WHERE id = car_id AND user_id = auth.uid()
        )
    );