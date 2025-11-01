import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, CheckCircle, Clock, Car, Wrench, Calendar, Bell } from 'lucide-react';

interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
}

interface MaintenanceRecord {
  id: string;
  car_id: string;
  maintenance_type_id: string;
  date_performed: string;
  mileage_at_service: number;
  next_service_km: number;
  next_service_date: string;
  maintenance_types_2025_11_01_19_24: {
    name: string;
    category: string;
  };
  cars_2025_11_01_19_24: {
    brand: string;
    model: string;
    mileage: number;
  };
}

interface DashboardProps {
  cars: Car[];
  selectedCar: Car | null;
}

const Dashboard: React.FC<DashboardProps> = ({ cars, selectedCar }) => {
  const [upcomingMaintenance, setUpcomingMaintenance] = useState<MaintenanceRecord[]>([]);
  const [overdueMaintenance, setOverdueMaintenance] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMaintenanceAlerts();
  }, [cars]);

  const fetchMaintenanceAlerts = async () => {
    if (cars.length === 0) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const carIds = cars.map(car => car.id);
      
      const { data, error } = await supabase
        .from('maintenance_records_2025_11_01_19_24')
        .select(`
          *,
          maintenance_types_2025_11_01_19_24 (name, category),
          cars_2025_11_01_19_24 (brand, model, mileage)
        `)
        .in('car_id', carIds)
        .not('next_service_date', 'is', null)
        .order('next_service_date', { ascending: true });

      if (error) throw error;

      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      const upcoming: MaintenanceRecord[] = [];
      const overdue: MaintenanceRecord[] = [];

      (data || []).forEach((record: MaintenanceRecord) => {
        const nextServiceDate = new Date(record.next_service_date);
        const car = cars.find(c => c.id === record.car_id);
        
        if (!car) return;

        const kmUntilService = record.next_service_km - car.mileage;
        const isOverdueByDate = nextServiceDate < today;
        const isOverdueByKm = record.next_service_km > 0 && kmUntilService <= 0;
        
        if (isOverdueByDate || isOverdueByKm) {
          overdue.push(record);
        } else if (nextServiceDate <= thirtyDaysFromNow || (record.next_service_km > 0 && kmUntilService <= 1000)) {
          upcoming.push(record);
        }
      });

      setUpcomingMaintenance(upcoming);
      setOverdueMaintenance(overdue);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar alertas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getMaintenanceStats = () => {
    const totalCars = cars.length;
    const carsWithOverdue = new Set(overdueMaintenance.map(m => m.car_id)).size;
    const carsWithUpcoming = new Set(upcomingMaintenance.map(m => m.car_id)).size;
    const carsUpToDate = totalCars - carsWithOverdue - carsWithUpcoming;

    return { totalCars, carsWithOverdue, carsWithUpcoming, carsUpToDate };
  };

  const formatTimeUntilService = (record: MaintenanceRecord) => {
    const car = cars.find(c => c.id === record.car_id);
    if (!car) return '';

    const today = new Date();
    const nextServiceDate = new Date(record.next_service_date);
    const daysUntilService = Math.ceil((nextServiceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const kmUntilService = record.next_service_km - car.mileage;

    const parts = [];
    
    if (daysUntilService <= 0) {
      parts.push(`${Math.abs(daysUntilService)} dias atrasado`);
    } else {
      parts.push(`${daysUntilService} dias`);
    }

    if (record.next_service_km > 0) {
      if (kmUntilService <= 0) {
        parts.push(`${Math.abs(kmUntilService).toLocaleString()} km atrasado`);
      } else {
        parts.push(`${kmUntilService.toLocaleString()} km`);
      }
    }

    return parts.join(' ou ');
  };

  const stats = getMaintenanceStats();

  if (loading) {
    return <div className="text-center py-8">Carregando dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600">Visão geral da saúde dos seus veículos</p>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Carros</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCars}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Manutenções Atrasadas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueMaintenance.length}</div>
            <p className="text-xs text-muted-foreground">
              {stats.carsWithOverdue} carro(s) afetado(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximas Manutenções</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{upcomingMaintenance.length}</div>
            <p className="text-xs text-muted-foreground">
              Próximos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Carros em Dia</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.carsUpToDate}</div>
            <p className="text-xs text-muted-foreground">
              Sem pendências
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas de Manutenção Atrasada */}
      {overdueMaintenance.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              Manutenções Atrasadas
            </CardTitle>
            <CardDescription className="text-red-600">
              Estas manutenções precisam de atenção imediata
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overdueMaintenance.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">
                        {record.cars_2025_11_01_19_24.brand} {record.cars_2025_11_01_19_24.model}
                      </p>
                      <p className="text-sm text-gray-600">
                        {record.maintenance_types_2025_11_01_19_24.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive">Atrasada</Badge>
                    <p className="text-xs text-gray-600 mt-1">
                      {formatTimeUntilService(record)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Próximas Manutenções */}
      {upcomingMaintenance.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <Clock className="w-5 h-5" />
              Próximas Manutenções
            </CardTitle>
            <CardDescription className="text-yellow-600">
              Manutenções programadas para os próximos 30 dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingMaintenance.slice(0, 5).map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">
                        {record.cars_2025_11_01_19_24.brand} {record.cars_2025_11_01_19_24.model}
                      </p>
                      <p className="text-sm text-gray-600">
                        {record.maintenance_types_2025_11_01_19_24.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-yellow-500">Em breve</Badge>
                    <p className="text-xs text-gray-600 mt-1">
                      {formatTimeUntilService(record)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Carro Selecionado */}
      {selectedCar && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="w-5 h-5" />
              Carro Selecionado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  {selectedCar.brand} {selectedCar.model} {selectedCar.year}
                </h3>
                <p className="text-gray-600">
                  Quilometragem atual: {selectedCar.mileage.toLocaleString()} km
                </p>
              </div>
              <div className="text-right">
                <Badge variant="outline">Ativo</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estado Vazio */}
      {cars.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Car className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Bem-vindo ao Car Health Monitor!
            </h3>
            <p className="text-gray-600 mb-6">
              Comece adicionando seu primeiro veículo para monitorar sua saúde e manutenções.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Wrench className="w-4 h-4" />
                Controle de manutenções
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                Lembretes automáticos
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Bell className="w-4 h-4" />
                Alertas personalizados
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;