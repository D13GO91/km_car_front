import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Car, Plus, Edit, Trash2, Fuel, Settings } from 'lucide-react';

interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  license_plate?: string;
  color?: string;
  engine_type?: string;
  mileage: number;
}

interface CarManagerProps {
  onCarSelect: (car: Car) => void;
  selectedCar: Car | null;
}

const CarManager: React.FC<CarManagerProps> = ({ onCarSelect, selectedCar }) => {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    license_plate: '',
    color: '',
    engine_type: '',
    mileage: 0
  });

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    try {
      const { data, error } = await supabase
        .from('cars_2025_11_01_19_24')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCars(data || []);
      
      // Se não há carro selecionado e há carros disponíveis, seleciona o primeiro
      if (!selectedCar && data && data.length > 0) {
        onCarSelect(data[0]);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar carros",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingCar) {
        const { error } = await supabase
          .from('cars_2025_11_01_19_24')
          .update(formData)
          .eq('id', editingCar.id);

        if (error) throw error;
        toast({ title: "Carro atualizado com sucesso!" });
      } else {
        const { error } = await supabase
          .from('cars_2025_11_01_19_24')
          .insert([formData]);

        if (error) throw error;
        toast({ title: "Carro cadastrado com sucesso!" });
      }

      setDialogOpen(false);
      setEditingCar(null);
      resetForm();
      fetchCars();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar carro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (car: Car) => {
    setEditingCar(car);
    setFormData({
      brand: car.brand,
      model: car.model,
      year: car.year,
      license_plate: car.license_plate || '',
      color: car.color || '',
      engine_type: car.engine_type || '',
      mileage: car.mileage
    });
    setDialogOpen(true);
  };

  const handleDelete = async (carId: string) => {
    if (!confirm('Tem certeza que deseja excluir este carro?')) return;

    try {
      const { error } = await supabase
        .from('cars_2025_11_01_19_24')
        .delete()
        .eq('id', carId);

      if (error) throw error;
      
      toast({ title: "Carro excluído com sucesso!" });
      fetchCars();
      
      // Se o carro excluído era o selecionado, limpa a seleção
      if (selectedCar?.id === carId) {
        onCarSelect(cars.find(c => c.id !== carId) || null);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao excluir carro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      license_plate: '',
      color: '',
      engine_type: '',
      mileage: 0
    });
  };

  const openAddDialog = () => {
    setEditingCar(null);
    resetForm();
    setDialogOpen(true);
  };

  if (loading && cars.length === 0) {
    return <div className="text-center py-8">Carregando carros...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Meus Carros</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Carro
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingCar ? 'Editar Carro' : 'Adicionar Novo Carro'}
              </DialogTitle>
              <DialogDescription>
                Preencha as informações do seu veículo
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brand">Marca</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="Toyota, Honda, etc."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Modelo</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="Corolla, Civic, etc."
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Ano</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    min="1900"
                    max={new Date().getFullYear() + 1}
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
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="license_plate">Placa</Label>
                <Input
                  id="license_plate"
                  value={formData.license_plate}
                  onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                  placeholder="ABC-1234"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="color">Cor</Label>
                  <Input
                    id="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="Branco, Preto, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="engine_type">Combustível</Label>
                  <Select value={formData.engine_type} onValueChange={(value) => setFormData({ ...formData, engine_type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gasolina">Gasolina</SelectItem>
                      <SelectItem value="etanol">Etanol</SelectItem>
                      <SelectItem value="flex">Flex</SelectItem>
                      <SelectItem value="diesel">Diesel</SelectItem>
                      <SelectItem value="hibrido">Híbrido</SelectItem>
                      <SelectItem value="eletrico">Elétrico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Salvando...' : (editingCar ? 'Atualizar' : 'Adicionar')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {cars.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Car className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Nenhum carro cadastrado ainda.</p>
            <p className="text-sm text-gray-500 mt-2">Adicione seu primeiro veículo para começar!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cars.map((car) => (
            <Card 
              key={car.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedCar?.id === car.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              }`}
              onClick={() => onCarSelect(car)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{car.brand} {car.model}</CardTitle>
                    <CardDescription>{car.year}</CardDescription>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(car);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(car.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {car.license_plate && (
                    <Badge variant="outline">{car.license_plate}</Badge>
                  )}
                  <div className="flex items-center text-sm text-gray-600">
                    <Settings className="w-4 h-4 mr-1" />
                    {car.mileage.toLocaleString()} km
                  </div>
                  {car.engine_type && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Fuel className="w-4 h-4 mr-1" />
                      {car.engine_type}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CarManager;