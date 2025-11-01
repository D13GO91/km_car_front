import { useQuery } from '@tanstack/react-query';

const FIPE_API_URL = "https://parallelum.com.br/fipe/api/v1/carros/marcas";

// Função que busca os dados
const fetchMarcas = async () => {
  const response = await fetch(FIPE_API_URL);
  if (!response.ok) {
    throw new Error('Erro ao buscar marcas FIPE');
  }
  return response.json();
};

const fetchModelos = async (marcaCodigo: string) => {
  const response = await fetch(`${FIPE_API_URL}/${marcaCodigo}/modelos`);
  if (!response.ok) {
    throw new Error('Erro ao buscar modelos FIPE');
  }
  return response.json(); // Retorna { modelos: [...], anos: [...] }
};

const fetchAnos = async (marcaCodigo: string, modeloCodigo: string) => {
  const response = await fetch(`${FIPE_API_URL}/${marcaCodigo}/modelos/${modeloCodigo}/anos`);
  if (!response.ok) {
    throw new Error('Erro ao buscar anos FIPE');
  }
  return response.json();
};


// --- Hooks personalizados ---

// Hook para buscar Marcas
export const useFipeMarcas = () => {
  return useQuery({
    queryKey: ['fipeMarcas'], // Chave única para o cache
    queryFn: fetchMarcas,
    staleTime: 1000 * 60 * 60 * 24, // Cache de 24 horas, já que marcas não mudam
  });
};

// Hook para buscar Modelos (só executa se a marca estiver selecionada)
export const useFipeModelos = (marcaCodigo: string | null) => {
  return useQuery({
    queryKey: ['fipeModelos', marcaCodigo],
    queryFn: () => fetchModelos(marcaCodigo!),
    enabled: !!marcaCodigo, // <-- Só executa a query se marcaCodigo não for nulo
    staleTime: 1000 * 60 * 60 * 24,
  });
};

// Hook para buscar Anos (só executa se marca E modelo estiverem selecionados)
export const useFipeAnos = (marcaCodigo: string | null, modeloCodigo: string | null) => {
  return useQuery({
    queryKey: ['fipeAnos', marcaCodigo, modeloCodigo],
    queryFn: () => fetchAnos(marcaCodigo!, modeloCodigo!),
    enabled: !!marcaCodigo && !!modeloCodigo, // <-- Só executa se ambos estiverem preenchidos
    staleTime: 1000 * 60 * 60 * 24,
  });
};