import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProducts, Product } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Loader2, ShoppingBag, DollarSign, Upload, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

export function ProductManagement() {
  const { products, loading, refetch } = useProducts();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    photo_url: '',
    is_active: true,
  });

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price,
        photo_url: product.photo_url || '',
        is_active: product.is_active,
      });
      setPhotoPreview(product.photo_url || null);
    } else {
      setEditingProduct(null);
      setFormData({ name: '', description: '', price: 0, photo_url: '', is_active: true });
      setPhotoPreview(null);
    }
    setDialogOpen(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem deve ter no máximo 5MB');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('product-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('product-photos')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, photo_url: urlData.publicUrl }));
      setPhotoPreview(urlData.publicUrl);
      toast.success('Foto enviada!');
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Erro ao enviar foto');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Nome do produto é obrigatório');
      return;
    }
    if (formData.price <= 0) {
      toast.error('Preço deve ser maior que zero');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price: formData.price,
        photo_url: formData.photo_url.trim() || null,
        is_active: formData.is_active,
      };

      if (editingProduct) {
        const { error } = await supabase.from('products').update(payload).eq('id', editingProduct.id);
        if (error) throw error;
        toast.success('Produto atualizado!');
      } else {
        const { error } = await supabase.from('products').insert(payload);
        if (error) throw error;
        toast.success('Produto criado!');
      }

      setDialogOpen(false);
      refetch();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Erro ao salvar produto');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Excluir "${product.name}"?`)) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', product.id);
      if (error) throw error;
      toast.success('Produto excluído!');
      refetch();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Erro ao excluir produto');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-serif font-bold">Gerenciar Produtos</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gold" onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
              <DialogDescription>
                {editingProduct ? 'Atualize as informações do produto' : 'Preencha os dados do novo produto'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="prod-name">Nome *</Label>
                <Input
                  id="prod-name"
                  placeholder="Ex: Pomada Modeladora"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prod-desc">Descrição</Label>
                <Textarea
                  id="prod-desc"
                  placeholder="Descrição do produto..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prod-price">Preço (R$)</Label>
                <Input
                  id="prod-price"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                />
              </div>

              {/* Photo upload */}
              <div className="space-y-2">
                <Label>Foto do Produto</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
                
                {photoPreview ? (
                  <div className="relative">
                    <div className="aspect-video rounded-lg overflow-hidden bg-card border border-border">
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2 w-full"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      Trocar foto
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full aspect-video rounded-lg border-2 border-dashed border-border hover:border-primary/50 bg-card/50 flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    {uploading ? (
                      <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Clique para enviar uma foto</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="prod-active">Ativo (visível na loja)</Label>
                <Switch
                  id="prod-active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button variant="gold" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingProduct ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-xl">
          <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum produto cadastrado</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <div
              key={product.id}
              className={`p-6 rounded-xl glass-card transition-all ${!product.is_active ? 'opacity-60' : ''}`}
            >
              {product.photo_url ? (
                <div className="aspect-video rounded-lg overflow-hidden mb-4 bg-card">
                  <img src={product.photo_url} alt={product.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="aspect-video rounded-lg mb-4 bg-card flex items-center justify-center">
                  <ShoppingBag className="w-10 h-10 text-muted-foreground/30" />
                </div>
              )}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold">{product.name}</h3>
                  <span className={`text-xs ${product.is_active ? 'text-success' : 'text-muted-foreground'}`}>
                    {product.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
              {product.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
              )}
              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
                <DollarSign className="w-4 h-4" />
                R$ {Number(product.price).toFixed(2)}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenDialog(product)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(product)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
