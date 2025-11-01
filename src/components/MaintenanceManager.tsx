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
import { Calendar, Plus, Wrench, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
}

interface MaintenanceType {
  id: string;
  name: string;
  description: string;
  default_interval_km: number;
  default_interval_months: number;
  category: string;
}

interface MaintenanceRecord {
  id: string;
  car_id: string;
  maintenance_type_id: string;
  date_performed: string;
  mileage_at_service: number;
  cost: number;
  notes: string;
  next_service_km: number;
  next_service_date: string;
  service_provider: string;
  maintenance_types_2025_11_01_19_24: MaintenanceType;
}

interface MaintenanceManagerProps {
  selectedCar: Car | null;
}

const MaintenanceManager: React.FC<MaintenanceManagerProps> = ({ selectedCar }) => {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    maintenance_type_id: '',
    date_performed: new Date().toISOString().split('T')[0],
    mileage_at_service: selectedCar?.mileage || 0,
    cost: 0,
    notes: '',
    service_provider: '',
    next_service_km: 0,
    next_service_date: ''
  });

  useEffect(() => {
    fetchMaintenanceTypes();
  }, []);

  useEffect(() => {
    if (selectedCar) {
      fetchMaintenanceRecords();
      setFormData(prev => ({ ...prev, mileage_at_service: selectedCar.mileage }));
    }
  }, [selectedCar]);

  const fetchMaintenanceTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('maintenance_types_2025_11_01_19_24')
        .select('*')
        .order('name');

      if (error) throw error;
      setMaintenanceTypes(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar tipos de manutenção",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchMaintenanceRecords = async () => {
    if (!selectedCar) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('maintenance_records_2025_11_01_19_24')
        .select(`
          *,
          maintenance_types_2025_11_01_19_24 (*)
        `)
        .eq('car_id', selectedCar.id)
        .order('date_performed', { ascending: false });

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

  const calculateNextService = (typeId: string, currentMileage: number, serviceDate: string) => {
    const type = maintenanceTypes.find(t => t.id === typeId);
    if (!type) return { nextKm: 0, nextDate: '' };

    const nextKm = type.default_interval_km ? currentMileage + type.default_interval_km : 0;
    
    let nextDate = '';
    if (type.default_interval_months) {
      const date = new Date(serviceDate);
      date.setMonth(date.getMonth() + type.default_interval_months);
      nextDate = date.toISOString().split('T')[0];
    }

    return { nextKm, nextDate };
  };

  const handleTypeChange = (typeId: string) => {
    const { nextKm, nextDate } = calculateNextService(
      typeId, 
      formData.mileage_at_service, 
      formData.date_performed
    );
    
    setFormData(prev => ({
      ...prev,
      maintenance_type_id: typeId,
      next_service_km: nextKm,
      next_service_date: nextDate
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCar) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('maintenance_records_2025_11_01_19_24')
        .insert([{
          ...formData,
          car_id: selectedCar.id,
          cost: parseFloat(formData.cost.toString()) || 0
        }]);

      if (error) throw error;

      toast({ title: "Manutenção registrada com sucesso!" });
      setDialogOpen(false);
      resetForm();
      fetchMaintenanceRecords();
    } catch (error: any) {
      toast({
        title: "Erro ao registrar manutenção",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      maintenance_type_id: '',
      date_performed: new Date().toISOString().split('T')[0],
      mileage_at_service: selectedCar?.mileage || 0,
      cost: 0,
      notes: '',
      service_provider: '',
      next_service_km: 0,
      next_service_date: ''
    });
  };

  const getMaintenanceStatus = (record: MaintenanceRecord) => {
    if (!selectedCar) return 'ok';
    
    const today = new Date();
    const nextServiceDate = new Date(record.next_service_date);
    const daysUntilService = Math.ceil((nextServiceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const kmUntilService = record.next_service_km - selectedCar.mileage;

    if (daysUntilService <= 0 || kmUntilService <= 0) return 'overdue';
    if (daysUntilService <= 30 || kmUntilService <= 1000) return 'due';
    return 'ok';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'overdue': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'due': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'overdue': return <Badge variant="destructive">Atrasada</Badge>;
      case 'due': return <Badge className="bg-yellow-500">Em breve</Badge>;
      default: return <Badge className="bg-green-500">Em dia</Badge>;
    }
  };

  if (!selectedCar) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Wrench className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Selecione um carro para ver as manutenções</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Manutenções</h2>
          <p className="text-gray-600">{selectedCar.brand} {selectedCar.model} - {selectedCar.mileage.toLocaleString()} km</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Registrar Manutenção
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Registrar Nova Manutenção</DialogTitle>
              <DialogDescription>
                Registre uma manutenção realizada no seu veículo
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="maintenance_type">Tipo de Manutenção</Label>
                <Select value={formData.maintenance_type_id} onValueChange={handleTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {maintenanceTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date_performed">Data da Manutenção</Label>
                  <Input
                    id="date_performed"
                    type="date"
                    value={formData.date_performed}
                    onChange={(e) => setFormData({ ...formData, date_performed: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mileage_at_service">Quilometragem</Label>
                  <Input
                    id="mileage_at_service"
                    type="number"
                    value={formData.mileage_at_service}
                    onChange={(e) => setFormData({ ...formData, mileage_at_service: parseInt(e.target.value) })}
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cost">Custo (R$)</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service_provider">Oficina/Prestador</Label>
                  <Input
                    id="service_provider"
                    value={formData.service_provider}
                    onChange={(e) => setFormData({ ...formData, service_provider: e.target.value })}
                    placeholder="Nome da oficina"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="next_service_km">Próxima em (km)</Label>
                  <Input
                    id="next_service_km"
                    type="number"
                    value={formData.next_service_km}
                    onChange={(e) => setFormData({ ...formData, next_service_km: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="next_service_date">Próxima em (data)</Label>
                  <Input
                    id="next_service_date"
                    type="date"
                    value={formData.next_service_date}
                    onChange={(e) => setFormData({ ...formData, next_service_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Detalhes sobre a manutenção..."
                  rows={3}
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

      {loading ? (
        <div className="text-center py-8">Carregando registros...</div>
      ) : records.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Nenhuma manutenção registrada ainda.</p>
            <p className="text-sm text-gray-500 mt-2">Registre a primeira manutenção do seu veículo!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {records.map((record) => {
            const status = getMaintenanceStatus(record);
            return (
              <Card key={record.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {getStatusIcon(status)}
                        {record.maintenance_types_2025_11_01_19_24.name}
                      </CardTitle>
                      <CardDescription>
                        {new Date(record.date_performed).toLocaleDateString('pt-BR')} - {record.mileage_at_service.toLocaleString()} km
                      </CardDescription>
                    </div>
                    {getStatusBadge(status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Custo</p>
                      <p className="text-lg">R$ {record.cost.toFixed(2)}</p>
                    </div>
                    {record.next_service_km > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Próxima manutenção</p>
                        <p className="text-sm">{record.next_service_km.toLocaleString()} km</p>
                        {record.next_service_date && (
                          <p className="text-sm">{new Date(record.next_service_date).toLocaleDateString('pt-BR')}</p>
                        )}
                      </div>
                    )}
                    {record.service_provider && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Prestador</p>
                        <p className="text-sm">{record.service_provider}</p>
                      </div>
                    )}
                  </div>
                  {record.notes && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-600">Observações</p>
                      <p className="text-sm text-gray-700">{record.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MaintenanceManager;