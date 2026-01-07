import { Button } from '@/components/ui/button';
import { Scissors } from 'lucide-react';

interface HeroSectionProps {
  onBookClick: () => void;
}

export function HeroSection({ onBookClick }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-20 right-10 w-40 h-40 rounded-full bg-primary/5 blur-3xl" />
      
      {/* Gold line decorations */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-32 bg-gradient-to-b from-transparent via-primary/50 to-transparent" />
      
      <div className="relative z-10 container mx-auto px-4 text-center">
        {/* Logo/Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-2 border-primary/30 mb-8 animate-fade-up">
          <Scissors className="w-10 h-10 text-primary" />
        </div>
        
        {/* Main heading */}
        <h1 
          className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold mb-6 animate-fade-up"
          style={{ animationDelay: '0.1s' }}
        >
          <span className="text-foreground">Art</span>{' '}
          <span className="text-gradient-gold">Cabelo</span>
        </h1>
        
        {/* Subtitle */}
        <p 
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-4 animate-fade-up font-light tracking-wide"
          style={{ animationDelay: '0.2s' }}
        >
          BARBEARIA
        </p>
        
        {/* Tagline */}
        <p 
          className="text-xl md:text-2xl text-foreground/80 max-w-2xl mx-auto mb-12 animate-fade-up font-serif italic"
          style={{ animationDelay: '0.3s' }}
        >
          "Onde a tradição encontra o estilo moderno"
        </p>
        
        {/* CTA Button */}
        <div 
          className="animate-fade-up"
          style={{ animationDelay: '0.4s' }}
        >
          <Button 
            variant="premium" 
            size="xl"
            onClick={onBookClick}
            className="group"
          >
            Agendar Horário
            <Scissors className="w-5 h-5 transition-transform group-hover:rotate-45" />
          </Button>
        </div>
        
        {/* Scroll indicator */}
        <div 
          className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-fade-up"
          style={{ animationDelay: '0.6s' }}
        >
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <span className="text-xs tracking-widest uppercase">Explore</span>
            <div className="w-px h-8 bg-gradient-to-b from-primary/50 to-transparent animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  );
}
