import { MapPin, Phone, Clock, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ContactSection() {
  const contactInfo = [
    {
      icon: MapPin,
      title: 'Endereço',
      content: 'Rua da Barbearia, 123 - Centro',
      subtitle: 'São Paulo, SP',
    },
    {
      icon: Clock,
      title: 'Horário de Funcionamento',
      content: 'Segunda a Sábado',
      subtitle: '09:00 - 19:00',
    },
    {
      icon: Phone,
      title: 'Telefone',
      content: '(11) 99999-9999',
      subtitle: 'WhatsApp disponível',
    },
  ];

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent('Olá! Gostaria de mais informações sobre a Barbearia Art Cabelo.');
    window.open(`https://wa.me/5511999999999?text=${message}`, '_blank');
  };

  return (
    <section id="contact" className="py-24 bg-card/50 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-primary text-sm tracking-widest uppercase font-medium">
            Contato
          </span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold mt-4">
            Venha Nos <span className="text-gradient-gold">Visitar</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
          {contactInfo.map((item, index) => (
            <div
              key={item.title}
              className="text-center p-6 rounded-xl glass-card hover-lift"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
                <item.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-serif font-semibold mb-2">
                {item.title}
              </h3>
              <p className="text-foreground">{item.content}</p>
              <p className="text-sm text-muted-foreground">{item.subtitle}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button
            variant="gold"
            size="lg"
            onClick={handleWhatsAppClick}
            className="group"
          >
            <MessageCircle className="w-5 h-5" />
            Fale Conosco pelo WhatsApp
          </Button>
        </div>
      </div>
    </section>
  );
}
