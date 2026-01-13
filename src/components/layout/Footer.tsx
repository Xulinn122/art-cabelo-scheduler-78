import { Instagram, Facebook } from 'lucide-react';
import logo from '@/assets/logo.png';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-12 border-t border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img src={logo} alt="Art Cabelo" className="h-16 w-auto" />
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            <a
              href="#"
              className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5 text-primary" />
            </a>
            <a
              href="#"
              className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
              aria-label="Facebook"
            >
              <Facebook className="w-5 h-5 text-primary" />
            </a>
          </div>

          {/* Copyright */}
          <p className="text-sm text-muted-foreground">
            © {currentYear} Barbearia Art Cabelo. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
