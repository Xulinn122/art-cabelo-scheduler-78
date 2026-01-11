import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminAppointments } from '@/hooks/useAppointments';
import { BarberManagement } from '@/components/admin/BarberManagement';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Scissors, 
  ArrowLeft, 
  Check, 
  X, 
  Trash2, 
  Loader2, 
  Calendar, 
  Phone, 
  User,
  Users
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Admin() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { appointments, loading, updateStatus, deleteAppointment } = useAdminAppointments();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('appointments');

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate('/auth');
    }
  }, [user, isAdmin, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
    confirmed: 'bg-success/20 text-success border-success/30',
    cancelled: 'bg-destructive/20 text-destructive border-destructive/30',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    cancelled: 'Cancelado',
  };

  const formatTime = (time: string) => time.slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <Scissors className="w-6 h-6 text-primary" />
              <span className="text-xl font-serif font-bold">Art <span className="text-gradient-gold">Cabelo</span></span>
            </Link>
            <Badge variant="outline" className="border-primary/30 text-primary">Admin</Badge>
          </div>
          <Link to="/"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Voltar</Button></Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="appointments" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Agendamentos
            </TabsTrigger>
            <TabsTrigger value="barbers" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Barbeiros
            </TabsTrigger>
          </TabsList>

          <TabsContent value="appointments" className="space-y-6">
            <h1 className="text-3xl font-serif font-bold">Agendamentos</h1>

            {appointments.length === 0 ? (
              <div className="text-center py-16 glass-card rounded-xl">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum agendamento encontrado</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {appointments.map((apt) => (
                  <div key={apt.id} className="p-6 rounded-xl glass-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Cliente</p>
                        <p className="font-medium flex items-center gap-2"><User className="w-4 h-4 text-primary" />{apt.client_name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">WhatsApp</p>
                        <p className="font-medium flex items-center gap-2"><Phone className="w-4 h-4 text-primary" />{apt.client_phone}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Barbeiro</p>
                        <p className="font-medium">{apt.barbers?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Serviço</p>
                        <p className="font-medium">{apt.services?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Data & Hora</p>
                        <p className="font-medium">{format(parseISO(apt.appointment_date), "dd/MM/yyyy", { locale: ptBR })} às {formatTime(apt.appointment_time)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge className={statusColors[apt.status]}>{statusLabels[apt.status]}</Badge>
                      {apt.status === 'pending' && (
                        <Button variant="gold" size="sm" onClick={() => updateStatus(apt.id, 'confirmed')}><Check className="w-4 h-4" /></Button>
                      )}
                      {apt.status !== 'cancelled' && (
                        <Button variant="outline" size="sm" onClick={() => updateStatus(apt.id, 'cancelled')}><X className="w-4 h-4" /></Button>
                      )}
                      <Button variant="destructive" size="sm" onClick={() => deleteAppointment(apt.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="barbers">
            <BarberManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
