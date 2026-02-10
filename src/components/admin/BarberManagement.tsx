import { useState, useRef } from 'react';
import { useAdminBarbers, useBarberSchedules, Barber } from '@/hooks/useBarbers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Loader2, 
  User, 
  Upload,
  RotateCcw,
  Clock,
  Save
} from 'lucide-react';
import { toast } from 'sonner';
import { Coffee } from 'lucide-react';

// Generate time options every 30 minutes (00:00 to 23:30)
const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    TIME_OPTIONS.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
  }
}

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export function BarberManagement() {
  const { 
    barbers, 
    loading, 
    createBarber, 
    updateBarber, 
    deleteBarber, 
    toggleActive,
    uploadPhoto,
    refetch 
  } = useAdminBarbers();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);
  const [formData, setFormData] = useState({ name: '', bio: '', photoUrl: '' });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openCreateDialog = () => {
    setEditingBarber(null);
    setFormData({ name: '', bio: '', photoUrl: '' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (barber: Barber) => {
    setEditingBarber(barber);
    setFormData({ 
      name: barber.name, 
      bio: barber.bio || '', 
      photoUrl: barber.photo_url || '' 
    });
    setIsDialogOpen(true);
  };

  const openScheduleDialog = (barber: Barber) => {
    setEditingBarber(barber);
    setIsScheduleDialogOpen(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const url = await uploadPhoto(file);
    if (url) {
      setFormData(prev => ({ ...prev, photoUrl: url }));
      toast.success('Foto carregada com sucesso!');
    } else {
      toast.error('Erro ao carregar foto');
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    setSaving(true);

    if (editingBarber) {
      const { error } = await updateBarber(editingBarber.id, {
        name: formData.name,
        bio: formData.bio || null,
        photo_url: formData.photoUrl || null
      });
      
      if (error) {
        toast.error('Erro ao atualizar barbeiro');
      } else {
        toast.success('Barbeiro atualizado!');
        setIsDialogOpen(false);
      }
    } else {
      const { error } = await createBarber(
        formData.name,
        formData.photoUrl || null,
        formData.bio || null
      );
      
      if (error) {
        toast.error('Erro ao criar barbeiro');
      } else {
        toast.success('Barbeiro adicionado!');
        setIsDialogOpen(false);
        refetch();
      }
    }

    setSaving(false);
  };

  const handleDelete = async (barber: Barber) => {
    if (!confirm(`Tem certeza que deseja excluir ${barber.name}?`)) return;
    
    const { error } = await deleteBarber(barber.id);
    if (error) {
      toast.error('Erro ao excluir barbeiro');
    } else {
      toast.success('Barbeiro excluído');
    }
  };

  const handleToggleActive = async (barber: Barber) => {
    const { error } = await toggleActive(barber.id, !barber.is_active);
    if (error) {
      toast.error('Erro ao alterar status');
    } else {
      toast.success(barber.is_active ? 'Barbeiro desativado' : 'Barbeiro ativado');
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
        <h2 className="text-2xl font-serif font-bold">Barbeiros</h2>
        <Button variant="gold" onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Barbeiro
        </Button>
      </div>

      {barbers.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-xl">
          <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum barbeiro cadastrado</p>
          <Button variant="gold-outline" className="mt-4" onClick={openCreateDialog}>
            Adicionar Primeiro Barbeiro
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {barbers.map((barber) => (
            <div 
              key={barber.id} 
              className={`p-6 rounded-xl glass-card transition-all ${
                !barber.is_active ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                  {barber.photo_url ? (
                    <img 
                      src={barber.photo_url} 
                      alt={barber.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-lg truncate">{barber.name}</h3>
                  {barber.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {barber.bio}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      barber.is_active 
                        ? 'bg-success/20 text-success' 
                        : 'bg-destructive/20 text-destructive'
                    }`}>
                      {barber.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => openEditDialog(barber)}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => openScheduleDialog(barber)}
                >
                  <Clock className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleToggleActive(barber)}
                >
                  {barber.is_active ? 'Desativar' : 'Ativar'}
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => handleDelete(barber)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Barber Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingBarber ? 'Editar Barbeiro' : 'Novo Barbeiro'}
            </DialogTitle>
            <DialogDescription>
              {editingBarber 
                ? 'Atualize as informações do barbeiro'
                : 'Adicione um novo barbeiro à equipe'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                  {formData.photoUrl ? (
                    <img 
                      src={formData.photoUrl} 
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-muted-foreground" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="barber-name">Nome</Label>
              <Input
                id="barber-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome do barbeiro"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="barber-bio">Bio (opcional)</Label>
              <Textarea
                id="barber-bio"
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Uma breve descrição sobre o barbeiro..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="gold" onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      {editingBarber && (
        <ScheduleDialog
          barber={editingBarber}
          isOpen={isScheduleDialogOpen}
          onClose={() => setIsScheduleDialogOpen(false)}
        />
      )}
    </div>
  );
}

interface ScheduleDialogProps {
  barber: Barber;
  isOpen: boolean;
  onClose: () => void;
}

function ScheduleDialog({ barber, isOpen, onClose }: ScheduleDialogProps) {
  const { schedules, loading, updateSchedule, resetToDefault, refetch } = useBarberSchedules(barber.id);
  const [saving, setSaving] = useState(false);
  const [localSchedules, setLocalSchedules] = useState<Record<number, { 
    start: string; 
    end: string; 
    active: boolean;
    breakStart: string;
    breakEnd: string;
    hasBreak: boolean;
  }>>({});

  // Initialize local schedules when schedules load
  useState(() => {
    if (schedules.length > 0) {
      const initial: Record<number, { start: string; end: string; active: boolean; breakStart: string; breakEnd: string; hasBreak: boolean }> = {};
      schedules.forEach(s => {
        initial[s.day_of_week] = {
          start: s.start_time.slice(0, 5),
          end: s.end_time.slice(0, 5),
          active: s.is_active,
          breakStart: s.break_start?.slice(0, 5) || '12:00',
          breakEnd: s.break_end?.slice(0, 5) || '13:00',
          hasBreak: !!(s.break_start && s.break_end)
        };
      });
      setLocalSchedules(initial);
    }
  });

  // Update local state when schedules change
  const getScheduleForDay = (day: number) => {
    if (localSchedules[day]) return localSchedules[day];
    const schedule = schedules.find(s => s.day_of_week === day);
    if (schedule) {
      return {
        start: schedule.start_time.slice(0, 5),
        end: schedule.end_time.slice(0, 5),
        active: schedule.is_active,
        breakStart: schedule.break_start?.slice(0, 5) || '12:00',
        breakEnd: schedule.break_end?.slice(0, 5) || '13:00',
        hasBreak: !!(schedule.break_start && schedule.break_end)
      };
    }
    return { start: '09:00', end: '19:00', active: true, breakStart: '12:00', breakEnd: '13:00', hasBreak: false };
  };

  const updateLocalSchedule = (day: number, field: string, value: string | boolean) => {
    const current = getScheduleForDay(day);
    setLocalSchedules(prev => ({
      ...prev,
      [day]: {
        ...current,
        [field]: value
      }
    }));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    
    const days = [0, 1, 2, 3, 4, 5, 6];
    for (const day of days) {
      const schedule = getScheduleForDay(day);
      await updateSchedule(
        day, 
        schedule.start + ':00', 
        schedule.end + ':00', 
        schedule.active,
        schedule.hasBreak ? schedule.breakStart + ':00' : null,
        schedule.hasBreak ? schedule.breakEnd + ':00' : null
      );
    }
    
    await refetch();
    setSaving(false);
    toast.success('Horários salvos!');
    onClose();
  };

  const handleReset = async () => {
    if (!confirm('Redefinir todos os horários para o padrão?')) return;
    
    setSaving(true);
    await resetToDefault();
    setLocalSchedules({});
    await refetch();
    setSaving(false);
    toast.success('Horários redefinidos!');
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Horários de {barber.name}</DialogTitle>
          <DialogDescription>
            Configure os horários de trabalho e intervalos para cada dia da semana
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {[1, 2, 3, 4, 5, 6, 0].map((day) => {
            const schedule = getScheduleForDay(day);
            return (
              <div 
                key={day}
                className={`p-3 rounded-lg border ${
                  schedule.active ? 'border-border bg-card' : 'border-border/30 bg-muted/30'
                }`}
              >
                <div className="flex flex-col gap-3">
                  {/* Day header and main hours */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={schedule.active}
                        onCheckedChange={(checked) => updateLocalSchedule(day, 'active', checked)}
                      />
                      <span className={`font-medium ${!schedule.active ? 'text-muted-foreground' : ''}`}>
                        {DAY_NAMES[day]}
                      </span>
                    </div>
                    
                    {schedule.active && (
                       <div className="flex items-center gap-2">
                        <Select value={schedule.start} onValueChange={(val) => updateLocalSchedule(day, 'start', val)}>
                          <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                          <SelectContent>{TIME_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                        </Select>
                        <span className="text-muted-foreground text-sm">até</span>
                        <Select value={schedule.end} onValueChange={(val) => updateLocalSchedule(day, 'end', val)}>
                          <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                          <SelectContent>{TIME_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    {!schedule.active && (
                      <span className="text-sm text-muted-foreground">Folga</span>
                    )}
                  </div>

                  {/* Break/Interval section */}
                  {schedule.active && (
                    <div className="flex items-center justify-between pl-10 pt-2 border-t border-border/50">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={schedule.hasBreak}
                          onCheckedChange={(checked) => updateLocalSchedule(day, 'hasBreak', checked)}
                        />
                        <Coffee className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Intervalo</span>
                      </div>
                      
                      {schedule.hasBreak && (
                        <div className="flex items-center gap-2">
                          <Input
                            type="time"
                            value={schedule.breakStart}
                            onChange={(e) => updateLocalSchedule(day, 'breakStart', e.target.value)}
                            className="w-24"
                          />
                          <span className="text-muted-foreground text-sm">até</span>
                          <Input
                            type="time"
                            value={schedule.breakEnd}
                            onChange={(e) => updateLocalSchedule(day, 'breakEnd', e.target.value)}
                            className="w-24"
                          />
                        </div>
                      )}
                      
                      {!schedule.hasBreak && (
                        <span className="text-xs text-muted-foreground">Sem intervalo</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={handleReset}
            disabled={saving}
            className="w-full sm:w-auto"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Redefinir Horários
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button variant="gold" onClick={handleSaveAll} disabled={saving} className="flex-1">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
