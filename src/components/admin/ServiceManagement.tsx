import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
import { Plus, Pencil, Trash2, Loader2, Scissors, Clock, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  is_active: boolean;
}

export function ServiceManagement() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_minutes: 30,
    price: 0,
    is_active: true,
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Erro ao carregar serviços');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        description: service.description || '',
        duration_minutes: service.duration_minutes,
        price: service.price,
        is_active: service.is_active,
      });
    } else {
      setEditingService(null);
      setFormData({
        name: '',
        description: '',
        duration_minutes: 30,
        price: 0,
        is_active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Nome do serviço é obrigatório');
      return;
    }

    if (formData.price <= 0) {
      toast.error('Preço deve ser maior que zero');
      return;
    }

    setSaving(true);
    try {
      if (editingService) {
        const { error } = await supabase
          .from('services')
          .update({
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            duration_minutes: formData.duration_minutes,
            price: formData.price,
            is_active: formData.is_active,
          })
          .eq('id', editingService.id);

        if (error) throw error;
        toast.success('Serviço atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('services')
          .insert({
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            duration_minutes: formData.duration_minutes,
            price: formData.price,
            is_active: formData.is_active,
          });

        if (error) throw error;
        toast.success('Serviço criado com sucesso!');
      }

      setDialogOpen(false);
      fetchServices();
    } catch (error) {
      console.error('Error saving service:', error);
      toast.error('Erro ao salvar serviço');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (service: Service) => {
    if (!confirm(`Tem certeza que deseja excluir o serviço "${service.name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', service.id);

      if (error) throw error;
      toast.success('Serviço excluído com sucesso!');
      fetchServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Erro ao excluir serviço. Pode haver agendamentos vinculados.');
    }
  };

  const toggleActive = async (service: Service) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: !service.is_active })
        .eq('id', service.id);

      if (error) throw error;
      toast.success(service.is_active ? 'Serviço desativado' : 'Serviço ativado');
      fetchServices();
    } catch (error) {
      console.error('Error toggling service:', error);
      toast.error('Erro ao alterar status do serviço');
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
        <h2 className="text-3xl font-serif font-bold">Gerenciar Serviços</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gold" onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Serviço
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingService ? 'Editar Serviço' : 'Novo Serviço'}
              </DialogTitle>
              <DialogDescription>
                {editingService
                  ? 'Atualize as informações do serviço'
                  : 'Preencha os dados para criar um novo serviço'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Serviço *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Corte Masculino"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Descrição do serviço..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duração (minutos)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min={5}
                    step={5}
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 30 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Preço (R$)</Label>
                  <Input
                    id="price"
                    type="number"
                    min={0}
                    step={0.01}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Serviço Ativo</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="gold" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingService ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {services.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-xl">
          <Scissors className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum serviço cadastrado</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <div
              key={service.id}
              className={`p-6 rounded-xl glass-card transition-all ${
                !service.is_active ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Scissors className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{service.name}</h3>
                    <span className={`text-xs ${service.is_active ? 'text-success' : 'text-muted-foreground'}`}>
                      {service.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
                <Switch
                  checked={service.is_active}
                  onCheckedChange={() => toggleActive(service)}
                />
              </div>

              {service.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {service.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {service.duration_minutes} min
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  R$ {service.price.toFixed(2)}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleOpenDialog(service)}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(service)}
                >
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
