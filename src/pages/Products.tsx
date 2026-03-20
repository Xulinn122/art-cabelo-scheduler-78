import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useProducts } from '@/hooks/useProducts';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingBag } from 'lucide-react';
import logoServices from '@/assets/logo-services.png';

export default function Products() {
  const { products, loading } = useProducts();
  const activeProducts = products.filter(p => p.is_active);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-32 pb-24">
        <section className="relative overflow-hidden">
          <div className="absolute top-10 right-0 w-64 h-64 rounded-full bg-primary/3 blur-3xl" />
          <div className="absolute bottom-10 left-0 w-48 h-48 rounded-full bg-primary/3 blur-3xl" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <div className="mb-8">
                <img src={logoServices} alt="Art Cabelo Barbearia" className="h-40 md:h-52 w-auto mx-auto" />
              </div>
              <span className="text-primary text-sm tracking-widest uppercase font-medium">
                Nossa Loja
              </span>
              <h1 className="text-4xl md:text-5xl font-serif font-bold mt-4">
                Nossos <span className="text-gradient-gold">Produtos</span>
              </h1>
              <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
                Produtos profissionais para manter seu visual impecável entre as visitas.
              </p>
            </div>

            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-80 rounded-xl" />
                ))}
              </div>
            ) : activeProducts.length === 0 ? (
              <div className="text-center py-16 glass-card rounded-xl">
                <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum produto disponível no momento</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className="group relative rounded-xl border border-border/50 bg-background/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 hover-lift overflow-hidden"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {product.photo_url ? (
                      <div className="aspect-square overflow-hidden bg-card">
                        <img
                          src={product.photo_url}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    ) : (
                      <div className="aspect-square bg-card flex items-center justify-center">
                        <ShoppingBag className="w-16 h-16 text-muted-foreground/30" />
                      </div>
                    )}

                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="p-5">
                      <h3 className="text-lg font-serif font-semibold mb-1">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      <p className="text-2xl font-bold text-gradient-gold">
                        R$ {Number(product.price).toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
