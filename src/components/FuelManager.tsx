import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Fuel, Plus, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
}

interface FuelRecord {
  id: string;
  car_id: string;
  date_filled: string;
  mileage: number;
  fuel_type: string;
  liters: number;
  cost_per_liter: number;
  total_cost: number;
  gas_station: string;
  is_full_tank: boolean;
  notes: string;
}

interface FuelManagerProps {
  selectedCar: Car | null;
}

const FuelManager: React.FC<FuelManagerProps> = ({ selectedCar }) => {
  const [records, setRecords] = useState<FuelRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    date_filled: new Date().toISOString().split('T')[0],
    mileage: selectedCar?.mileage || 0,
    fuel_type: 'gasolina',
    liters: 0,
    cost_per_liter: 0,
    total_cost: 0,
    gas_station: '',
    is_full_tank: true,
    notes: ''
  });

  useEffect(() => {
    if (selectedCar) {
      fetchFuelRecords();
      setFormData(prev => ({ ...prev, mileage: selectedCar.mileage }));
    }
  }, [selectedCar]);

  const fetchFuelRecords = async () => {
    if (!selectedCar) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fuel_records_2025_11_01_19_24')
        .select('*')
        .eq('car_id', selectedCar.id)
        .order('date_filled', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar registros",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalCost = (liters: number, costPerLiter: number) => {
    return liters * costPerLiter;
  };

  const handleLitersChange = (liters: number) => {
    const totalCost = calculateTotalCost(liters, formData.cost_per_liter);
    setFormData(prev => ({ ...prev, liters, total_cost: totalCost }));
  };

  const handleCostPerLiterChange = (costPerLiter: number) => {
    const totalCost = calculateTotalCost(formData.liters, costPerLiter);
    setFormData(prev => ({ ...prev, cost_per_liter: costPerLiter, total_cost: totalCost }));
  };

  const handleTotalCostChange = (totalCost: number) => {
    const costPerLiter = formData.liters > 0 ? totalCost / formData.liters : 0;
    setFormData(prev => ({ ...prev, total_cost: totalCost, cost_per_liter: costPerLiter }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCar) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('fuel_records_2025_11_01_19_24')
        .insert([{
          ...formData,
          car_id: selectedCar.id,
          liters: parseFloat(formData.liters.toString()),
          cost_per_liter: parseFloat(formData.cost_per_liter.toString()),
          total_cost: parseFloat(formData.total_cost.toString())
        }]);

      if (error) throw error;

      toast({ title: "Abastecimento registrado com sucesso!" });
      setDialogOpen(false);
      resetForm();
      fetchFuelRecords();
    } catch (error: any) {
      toast({
        title: "Erro ao registrar abastecimento",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      date_filled: new Date().toISOString().split('T')[0],
      mileage: selectedCar?.mileage || 0,
      fuel_type: 'gasolina',
      liters: 0,
      cost_per_liter: 0,
      total_cost: 0,
      gas_station: '',
      is_full_tank: true,
      notes: ''
    });
  };

  const calculateConsumption = () => {
    if (records.length < 2) return null;

    const fullTankRecords = records.filter(r => r.is_full_tank).slice(0, 2);
    if (fullTankRecords.length < 2) return null;

    const [recent, previous] = fullTankRecords;
    const kmDriven = recent.mileage - previous.mileage;
    const litersUsed = recent.liters;
    
    if (kmDriven <= 0 || litersUsed <= 0) return null;

    return {
      consumption: kmDriven / litersUsed,
      kmDriven,
      litersUsed
    };
  };

  const getAverageConsumption = () => {
    const fullTankRecords = records.filter(r => r.is_full_tank);
    if (fullTankRecords.length < 2) return null;

    let totalKm = 0;
    let totalLiters = 0;
    let validPairs = 0;

    for (let i = 0; i < fullTankRecords.length - 1; i++) {
      const current = fullTankRecords[i];
      const next = fullTankRecords[i + 1];
      const kmDriven = current.mileage - next.mileage;
      
      if (kmDriven > 0) {
        totalKm += kmDriven;
        totalLiters += current.liters;
        validPairs++;
      }
    }

    return validPairs > 0 ? totalKm / totalLiters : null;
  };

  const getTotalSpent = () => {
    return records.reduce((total, record) => total + record.total_cost, 0);
  };

  const consumption = calculateConsumption();
  const averageConsumption = getAverageConsumption();
  const totalSpent = getTotalSpent();

  if (!selectedCar) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Fuel className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Selecione um carro para ver o consumo</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Consumo de Combustível</h2>
          <p className="text-gray-600">{selectedCar.brand} {selectedCar.model}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Registrar Abastecimento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Registrar Abastecimento</DialogTitle>
              <DialogDescription>
                Registre um novo abastecimento do seu veículo
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date_filled">Data</Label>
                  <Input
                    id="date_filled"
                    type="date"
                    value={formData.date_filled}
                    onChange={(e) => setFormData({ ...formData, date_filled: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mileage">Quilometragem</Label>
                  <Input
                    id="mileage"
                    type="number"
                    value={formData.mileage}
                    onChange={(e) => setFormData({ ...formData, mileage: parseInt(e.target.value) })}
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fuel_type">Tipo de Combustível</Label>
                  <Select value={formData.fuel_type} onValueChange={(value) => setFormData({ ...formData, fuel_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gasolina">Gasolina</SelectItem>
                      <SelectItem value="etanol">Etanol</SelectItem>
                      <SelectItem value="diesel">Diesel</SelectItem>
                      <SelectItem value="gnv">GNV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="liters">Litros</Label>
                  <Input
                    id="liters"
                    type="number"
                    step="0.001"
                    value={formData.liters}
                    onChange={(e) => handleLitersChange(parseFloat(e.target.value) || 0)}
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cost_per_liter">Preço por Litro (R$)</Label>
                  <Input
                    id="cost_per_liter"
                    type="number"
                    step="0.001"
                    value={formData.cost_per_liter}
                    onChange={(e) => handleCostPerLiterChange(parseFloat(e.target.value) || 0)}
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total_cost">Valor Total (R$)</Label>
                  <Input
                    id="total_cost"
                    type="number"
                    step="0.01"
                    value={formData.total_cost}
                    onChange={(e) => handleTotalCostChange(parseFloat(e.target.value) || 0)}
                    min="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gas_station">Posto de Combustível</Label>
                <Input
                  id="gas_station"
                  value={formData.gas_station}
                  onChange={(e) => setFormData({ ...formData, gas_station: e.target.value })}
                  placeholder="Nome do posto"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_full_tank"
                  checked={formData.is_full_tank}
                  onChange={(e) => setFormData({ ...formData, is_full_tank: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="is_full_tank">Tanque cheio</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Observações sobre o abastecimento..."
                  rows={2}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Salvando...' : 'Registrar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consumo Atual</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {consumption ? `${consumption.consumption.toFixed(1)} km/L` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {consumption && (
                <>
                  {consumption.kmDriven} km com {consumption.litersUsed.toFixed(1)}L
                </>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média Geral</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {averageConsumption ? `${averageConsumption.toFixed(1)} km/L` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Baseado em {records.filter(r => r.is_full_tank).length} abastecimentos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gasto Total</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalSpent.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {records.length} abastecimentos registrados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de registros */}
      {loading ? (
        <div className="text-center py-8">Carregando registros...</div>
      ) : records.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Fuel className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Nenhum abastecimento registrado ainda.</p>
            <p className="text-sm text-gray-500 mt-2">Registre o primeiro abastecimento para começar o controle!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <Card key={record.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Fuel className="w-4 h-4" />
                      {record.fuel_type.charAt(0).toUpperCase() + record.fuel_type.slice(1)}
                      {record.is_full_tank && <Badge variant="outline">Tanque cheio</Badge>}
                    </CardTitle>
                    <CardDescription>
                      {new Date(record.date_filled).toLocaleDateString('pt-BR')} - {record.mileage.toLocaleString()} km
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">R$ {record.total_cost.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">{record.liters.toFixed(1)}L</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Preço por Litro</p>
                    <p>R$ {record.cost_per_liter.toFixed(3)}</p>
                  </div>
                  {record.gas_station && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Posto</p>
                      <p className="text-sm">{record.gas_station}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-600">Litros</p>
                    <p>{record.liters.toFixed(1)}L</p>
                  </div>
                </div>
                {record.notes && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-600">Observações</p>
                    <p className="text-sm text-gray-700">{record.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FuelManager;