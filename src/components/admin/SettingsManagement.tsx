import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Phone, MapPin, Clock, Share2 } from 'lucide-react';

interface Setting {
  id: string;
  key: string;
  value: string;
  label: string;
  category: string;
}

export function SettingsManagement() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      setSettings(data || []);
      
      const values: Record<string, string> = {};
      data?.forEach(s => {
        values[s.key] = s.value;
      });
      setEditedValues(values);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as configurações.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const setting of settings) {
        if (editedValues[setting.key] !== setting.value) {
          const { error } = await supabase
            .from('settings')
            .update({ value: editedValues[setting.key] })
            .eq('key', setting.key);

          if (error) throw error;
        }
      }

      toast({
        title: 'Sucesso!',
        description: 'Configurações salvas com sucesso.',
      });
      
      fetchSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as configurações.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'contact':
        return <Phone className="w-5 h-5" />;
      case 'social':
        return <Share2 className="w-5 h-5" />;
      case 'hours':
        return <Clock className="w-5 h-5" />;
      default:
        return <MapPin className="w-5 h-5" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'contact':
        return 'Contato';
      case 'social':
        return 'Redes Sociais';
      case 'hours':
        return 'Horários de Funcionamento';
      default:
        return 'Geral';
    }
  };

  const groupedSettings = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<string, Setting[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-serif font-bold">Configurações</h1>
        <Button variant="gold" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar Alterações
        </Button>
      </div>

      {Object.entries(groupedSettings).map(([category, categorySettings]) => (
        <div key={category} className="p-6 rounded-xl glass-card space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              {getCategoryIcon(category)}
            </div>
            <h2 className="text-xl font-serif font-semibold">{getCategoryLabel(category)}</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {categorySettings.map((setting) => (
              <div key={setting.id} className="space-y-2">
                <Label htmlFor={setting.key}>{setting.label}</Label>
                <Input
                  id={setting.key}
                  value={editedValues[setting.key] || ''}
                  onChange={(e) => setEditedValues({ ...editedValues, [setting.key]: e.target.value })}
                  placeholder={setting.label}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
