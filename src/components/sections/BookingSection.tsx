import { useState } from 'react';
import { useServices, useAvailableSlots, useCreateAppointment } from '@/hooks/useAppointments';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
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
  const { user } = useAuth();
  const { createAppointment, loading: creating, error, setError } = useCreateAppointment();
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState('');
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ name?: string; phone?: string }>({});
  
  const selectedService = services.find(s => s.id === serviceId);
  const dateString = date ? format(date, 'yyyy-MM-dd') : '';
  const { availableSlots, loading: slotsLoading, refetch } = useAvailableSlots(
    dateString,
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

    if (!serviceId || !date || !time) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    const result = await createAppointment(
      name,
      phone,
      serviceId,
      dateString,
      time,
      user?.id
    );

    if (result.success) {
      setSuccess(true);
      setName('');
      setPhone('');
      setServiceId('');
      setDate(undefined);
      setTime('');
      refetch();
    }
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5);
  };

  if (success) {
    return (
      <section id="booking" className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="max-w-lg mx-auto text-center">
            <div className="p-8 rounded-2xl glass-card gold-glow">
              <CheckCircle className="w-16 h-16 text-success mx-auto mb-6" />
              <h3 className="text-2xl font-serif font-bold mb-4">
                Agendamento Confirmado!
              </h3>
              <p className="text-muted-foreground mb-6">
                Seu horário foi reservado com sucesso. Aguardamos você!
              </p>
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

            <div className="space-y-2">
              <Label className="text-foreground">Serviço</Label>
              <Select value={serviceId} onValueChange={setServiceId}>
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
                      isBefore(maxDate, date) ||
                      date.getDay() === 0 // Closed on Sundays
                    }
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {date && (
              <div className="space-y-2">
                <Label className="text-foreground">Horário Disponível</Label>
                {slotsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : availableSlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum horário disponível nesta data
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
                        {formatTime(slot)}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Button
              type="submit"
              variant="premium"
              size="lg"
              className="w-full"
              disabled={creating || !name || !phone || !serviceId || !date || !time}
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
