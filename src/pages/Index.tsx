import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AuthPage from '@/components/AuthPage';
import Dashboard from '@/components/Dashboard';
import CarManager from '@/components/CarManager';
import MaintenanceManager from '@/components/MaintenanceManager';
import FuelManager from '@/components/FuelManager';
import { Car, LayoutDashboard, Wrench, Fuel, LogOut, User } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';

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

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const [cars, setCars] = useState<Car[]>([]);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (user) {
      fetchCars();
    }
  }, [user]);

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
        setSelectedCar(data[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar carros:', error);
    }
  };

  const handleCarSelect = (car: Car | null) => {
    setSelectedCar(car);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mb-4 animate-pulse">
            <Car className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg mr-3">
                <Car className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Car Health Monitor</h1>
                <p className="text-sm text-gray-600">Monitore a saúde do seu veículo</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-600">
                <User className="w-4 h-4 mr-1" />
                {user.email}
              </div>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="cars" className="flex items-center gap-2">
              <Car className="w-4 h-4" />
              Carros
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Manutenções
            </TabsTrigger>
            <TabsTrigger value="fuel" className="flex items-center gap-2">
              <Fuel className="w-4 h-4" />
              Combustível
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard cars={cars} selectedCar={selectedCar} />
          </TabsContent>

          <TabsContent value="cars">
            <CarManager 
              onCarSelect={handleCarSelect} 
              selectedCar={selectedCar}
            />
          </TabsContent>

          <TabsContent value="maintenance">
            <MaintenanceManager selectedCar={selectedCar} />
          </TabsContent>

          <TabsContent value="fuel">
            <FuelManager selectedCar={selectedCar} />
          </TabsContent>
        </Tabs>
      </main>

      <Toaster />
    </div>
  );
};

export default Index;
