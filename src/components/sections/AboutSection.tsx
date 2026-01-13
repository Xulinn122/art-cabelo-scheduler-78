import { Award, Clock, Star } from 'lucide-react';
import logo from '@/assets/logo.png';

export function AboutSection() {
  const features = [
    {
      icon: Award,
      title: 'Excelência',
      description: 'Mais de 10 anos de experiência em cortes masculinos de alta qualidade',
    },
    {
      icon: Star,
      title: 'Qualidade Premium',
      description: 'Utilizamos apenas produtos profissionais das melhores marcas',
    },
    {
      icon: Clock,
      title: 'Pontualidade',
      description: 'Respeitamos seu tempo com agendamentos precisos e sem atrasos',
    },
  ];

  return (
    <section id="about" className="py-24 relative">
      {/* Decorative line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-20 bg-gradient-to-b from-primary/30 to-transparent" />
      
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          {/* Small logo */}
          <div className="mb-6">
            <img src={logo} alt="Art Cabelo" className="h-20 w-auto mx-auto opacity-80" />
          </div>
          <span className="text-primary text-sm tracking-widest uppercase font-medium">
            Sobre Nós
          </span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold mt-4 mb-6">
            A Arte do Corte <span className="text-gradient-gold">Perfeito</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
            Na Barbearia Art Cabelo, cada corte é uma obra de arte. Combinamos técnicas 
            tradicionais com tendências contemporâneas para criar o visual ideal para 
            cada cliente. Nossa missão é proporcionar uma experiência única de cuidado 
            masculino em um ambiente sofisticado e acolhedor.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative p-8 rounded-xl glass-card hover-lift text-center"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Gold accent on hover */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-serif font-semibold mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
