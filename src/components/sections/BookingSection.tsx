import { useState } from 'react';
import { useServices, useAvailableSlots, useCreateAppointment } from '@/hooks/useAppointments';
import { useBarbers } from '@/hooks/useBarbers';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, CheckCircle, AlertCircle, Loader2, User } from 'lucide-react';
import { format, addDays, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { z } from 'zod';

const bookingSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  phone: z.string().min(10, 'Telefone inválido').max(15).regex(/^[\d\s\-()]+$/, 'Telefone inválido'),
});

export function BookingSection() {
  const { services, loading: servicesLoading } = useServices();
  const { barbers, loading: barbersLoading } = useBarbers();
  const { user } = useAuth();
  const { createAppointment, loading: creating, error, setError } = useCreateAppointment();
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [barberId, setBarberId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState('');
  const [success, setSuccess] = useState(false);
  const [lastBookedServiceId, setLastBookedServiceId] = useState('');
  const [lastBookedBarberId, setLastBookedBarberId] = useState('');
  const [lastBookedDate, setLastBookedDate] = useState('');
  const [lastBookedTime, setLastBookedTime] = useState('');
  const [validationErrors, setValidationErrors] = useState<{ name?: string; phone?: string }>({});
  
  const selectedService = services.find(s => s.id === serviceId);
  const selectedBarber = barbers.find(b => b.id === barberId);
  const dateString = date ? format(date, 'yyyy-MM-dd') : '';
  
  const { availableSlots, loading: slotsLoading, refetch } = useAvailableSlots(
    dateString,
    barberId || null,
    selectedService?.duration_minutes || 30
  );

  const today = startOfDay(new Date());
  const maxDate = addDays(today, 30);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});
    setError(null);

    // Validate inputs
    try {
      bookingSchema.parse({ name, phone });
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors: { name?: string; phone?: string } = {};
        err.errors.forEach((e) => {
          if (e.path[0] === 'name') errors.name = e.message;
          if (e.path[0] === 'phone') errors.phone = e.message;
        });
        setValidationErrors(errors);
        return;
      }
    }

    if (!barberId || !serviceId || !date || !time) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    const result = await createAppointment(
      name,
      phone,
      serviceId,
      barberId,
      dateString,
      time,
      user?.id
    );

    if (result.success) {
      setLastBookedServiceId(serviceId);
      setLastBookedBarberId(barberId);
      setLastBookedDate(dateString);
      setLastBookedTime(time);
      setSuccess(true);
      setName('');
      setPhone('');
      setBarberId('');
      setServiceId('');
      setDate(undefined);
      setTime('');
      refetch();
    }
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5);
  };

  const formatTimeRange = (timeString: string, durationMinutes: number) => {
    const [h, m] = timeString.split(':').map(Number);
    const startTotal = h * 60 + m;
    const endTotal = startTotal + durationMinutes;
    const endH = Math.floor(endTotal / 60).toString().padStart(2, '0');
    const endM = (endTotal % 60).toString().padStart(2, '0');
    return `${timeString.slice(0, 5)} - ${endH}:${endM}`;
  };

  const confirmedService = services.find(s => s.id === lastBookedServiceId);
  const confirmedBarber = barbers.find(b => b.id === lastBookedBarberId);

  if (success) {
    return (
      <section id="booking" className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="max-w-lg mx-auto text-center">
            <div className="p-8 rounded-2xl glass-card gold-glow space-y-6">
              <CheckCircle className="w-16 h-16 text-success mx-auto" />
              <h3 className="text-2xl font-serif font-bold">
                Pedido de Agendamento Enviado!
              </h3>
              <p className="text-muted-foreground">
                Seu pedido foi registrado com sucesso. Aguarde a confirmação.
              </p>
              
              {(confirmedBarber || confirmedService || lastBookedDate || lastBookedTime) && (
                <div className="bg-background/50 rounded-xl p-4 space-y-2 text-sm text-left">
                  {confirmedBarber && (
                    <p><span className="text-muted-foreground">Barbeiro:</span> <span className="font-medium">{confirmedBarber.name}</span></p>
                  )}
                  {confirmedService && (
                    <p><span className="text-muted-foreground">Serviço:</span> <span className="font-medium">{confirmedService.name}</span></p>
                  )}
                  {lastBookedDate && (
                    <p><span className="text-muted-foreground">Data:</span> <span className="font-medium">{format(new Date(lastBookedDate + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR })}</span></p>
                  )}
                  {lastBookedTime && (
                    <p><span className="text-muted-foreground">Horário:</span> <span className="font-medium">{lastBookedTime.slice(0, 5)}</span></p>
                  )}
                </div>
              )}

              <Button 
                variant="gold-outline"
                onClick={() => setSuccess(false)}
              >
                Fazer Novo Agendamento
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="booking" className="py-24 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-20 bg-gradient-to-b from-primary/30 to-transparent" />
      
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-primary text-sm tracking-widest uppercase font-medium">
            Agendamento
          </span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold mt-4">
            Reserve Seu <span className="text-gradient-gold">Horário</span>
          </h2>
        </div>

        <div className="max-w-xl mx-auto">
          <form onSubmit={handleSubmit} className="p-8 rounded-2xl glass-card space-y-6">
            {error && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">Nome Completo</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                className="bg-background/50 border-border focus:border-primary"
              />
              {validationErrors.name && (
                <p className="text-xs text-destructive">{validationErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-foreground">WhatsApp</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(00) 00000-0000"
                className="bg-background/50 border-border focus:border-primary"
              />
              {validationErrors.phone && (
                <p className="text-xs text-destructive">{validationErrors.phone}</p>
              )}
            </div>

            {/* Barber Selection */}
            <div className="space-y-3">
              <Label className="text-foreground">Escolha seu Barbeiro</Label>
              {barbersLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : barbers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum barbeiro disponível no momento
                </p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {barbers.map((barber) => (
                    <button
                      key={barber.id}
                      type="button"
                      onClick={() => {
                        setBarberId(barber.id);
                        setTime(''); // Reset time when barber changes
                      }}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all duration-300 text-center",
                        barberId === barber.id
                          ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                          : "border-border/50 bg-background/30 hover:border-primary/50"
                      )}
                    >
                      <div className="w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                        {barber.photo_url ? (
                          <img 
                            src={barber.photo_url} 
                            alt={barber.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                      <p className="font-medium text-sm">{barber.name}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Serviço</Label>
              <Select value={serviceId} onValueChange={(val) => { setServiceId(val); setTime(''); }}>
                <SelectTrigger className="bg-background/50 border-border focus:border-primary">
                  <SelectValue placeholder="Selecione o serviço" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} - R$ {Number(service.price).toFixed(2).replace('.', ',')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-background/50 border-border",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "dd 'de' MMMM", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => {
                      setDate(newDate);
                      setTime('');
                    }}
                    disabled={(date) => 
                      isBefore(date, today) || 
                      isBefore(maxDate, date)
                    }
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {date && barberId && (
              <div className="space-y-2">
                <Label className="text-foreground">
                  Horário Disponível
                  {selectedBarber && <span className="text-primary ml-1">({selectedBarber.name})</span>}
                </Label>
                {slotsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : availableSlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum horário disponível nesta data para este barbeiro
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots.map((slot) => (
                      <Button
                        key={slot}
                        type="button"
                        variant={time === slot ? "gold" : "outline"}
                        size="sm"
                        onClick={() => setTime(slot)}
                        className="text-sm"
                      >
                        {selectedService ? formatTimeRange(slot, selectedService.duration_minutes) : formatTime(slot)}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {date && !barberId && (
              <p className="text-sm text-muted-foreground text-center py-2">
                Selecione um barbeiro para ver os horários disponíveis
              </p>
            )}

            <Button
              type="submit"
              variant="premium"
              size="lg"
              className="w-full"
              disabled={creating || !name || !phone || !barberId || !serviceId || !date || !time}
            >
              {creating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Agendando...
                </>
              ) : (
                'Confirmar Agendamento'
              )}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
