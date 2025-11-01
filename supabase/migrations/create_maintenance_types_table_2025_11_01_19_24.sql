-- Tabela para tipos de manutenção predefinidos
CREATE TABLE IF NOT EXISTS public.maintenance_types_2025_11_01_19_24 (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    default_interval_km INTEGER, -- intervalo padrão em quilômetros
    default_interval_months INTEGER, -- intervalo padrão em meses
    category VARCHAR(50), -- preventiva, corretiva, obrigatória
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir tipos de manutenção comuns
INSERT INTO public.maintenance_types_2025_11_01_19_24 (name, description, default_interval_km, default_interval_months, category) VALUES
('Troca de Óleo', 'Troca do óleo do motor e filtro', 10000, 6, 'preventiva'),
('Revisão Geral', 'Revisão completa do veículo', 10000, 12, 'preventiva'),
('Troca de Filtro de Ar', 'Substituição do filtro de ar do motor', 15000, 12, 'preventiva'),
('Alinhamento e Balanceamento', 'Alinhamento das rodas e balanceamento', 10000, 6, 'preventiva'),
('Troca de Pastilhas de Freio', 'Substituição das pastilhas de freio', 30000, 24, 'preventiva'),
('Troca de Pneus', 'Substituição dos pneus', 40000, 36, 'preventiva'),
('Troca de Bateria', 'Substituição da bateria', NULL, 24, 'preventiva'),
('Inspeção Veicular', 'Inspeção obrigatória anual', NULL, 12, 'obrigatória'),
('IPVA', 'Pagamento do IPVA', NULL, 12, 'obrigatória'),
('Seguro Obrigatório', 'Renovação do seguro obrigatório', NULL, 12, 'obrigatória');

-- RLS - Tabela pública para leitura
ALTER TABLE public.maintenance_types_2025_11_01_19_24 ENABLE ROW LEVEL SECURITY;

-- Policy para todos os usuários autenticados lerem os tipos
CREATE POLICY "Authenticated users can view maintenance types" ON public.maintenance_types_2025_11_01_19_24
    FOR SELECT USING (auth.role() = 'authenticated');