import { useServices } from '@/hooks/useAppointments';
import { Scissors, Wind, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import logoServices from '@/assets/logo-services.png';

const serviceIcons: Record<string, React.ElementType> = {
  'Corte Masculino': Scissors,
  'Barba': Wind,
  'Corte + Barba': Scissors,
  'Sobrancelha': Sparkles,
};

export function ServicesSection() {
  const { services, loading } = useServices();

  if (loading) {
    return (
      <section id="services" className="py-24 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Skeleton className="h-4 w-24 mx-auto mb-4" />
            <Skeleton className="h-12 w-64 mx-auto mb-6" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="services" className="py-24 bg-card/50 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-10 right-0 w-64 h-64 rounded-full bg-primary/3 blur-3xl" />
      <div className="absolute bottom-10 left-0 w-48 h-48 rounded-full bg-primary/3 blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          {/* Logo */}
          <div className="mb-8">
            <img src={logoServices} alt="Art Cabelo Barbearia" className="h-40 md:h-52 w-auto mx-auto" />
          </div>
          <span className="text-primary text-sm tracking-widest uppercase font-medium">
            Nossos Serviços
          </span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold mt-4">
            O Que <span className="text-gradient-gold">Oferecemos</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => {
            const Icon = serviceIcons[service.name] || Scissors;
            
            return (
              <div
                key={service.id}
                className="group relative p-6 rounded-xl border border-border/50 bg-background/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 hover-lift"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Top accent line */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  
                  <h3 className="text-lg font-serif font-semibold mb-2">
                    {service.name}
                  </h3>
                  
                  {service.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {service.description}
                    </p>
                  )}
                  
                  <div className="mt-auto space-y-1">
                    <p className="text-2xl font-bold text-gradient-gold">
                      R$ {Number(service.price).toFixed(2).replace('.', ',')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {service.duration_minutes} minutos
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
