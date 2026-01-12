import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Loader2, Shield, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface AdminUser {
  id: string;
  user_id: string;
  role: string;
  email?: string;
}

export function AdminManagement() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('role', 'admin');

    if (!error && data) {
      // Fetch emails for each admin from profiles or auth
      const adminsWithEmail = await Promise.all(
        data.map(async (admin) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', admin.user_id)
            .single();
          
          return {
            ...admin,
            email: profileData?.full_name || admin.user_id.slice(0, 8) + '...'
          };
        })
      );
      setAdmins(adminsWithEmail);
    }
    setLoading(false);
  };

  const handleCreateAdmin = async () => {
    if (!formData.email || !formData.password) {
      setError('Email e senha são obrigatórios');
      return;
    }

    if (formData.password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Create user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: formData.email.split('@')[0],
          }
        }
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('Este email já está cadastrado');
        } else {
          setError(authError.message);
        }
        setSaving(false);
        return;
      }

      if (authData.user) {
        // Add admin role
        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert({
            user_id: authData.user.id,
            role: 'admin'
          }, { 
            onConflict: 'user_id,role' 
          });

        if (roleError) {
          console.error('Error adding admin role:', roleError);
          setError('Erro ao atribuir role de admin');
          setSaving(false);
          return;
        }

        toast.success('Administrador criado com sucesso!');
        setIsDialogOpen(false);
        setFormData({ email: '', password: '' });
        fetchAdmins();
      }
    } catch (err) {
      setError('Erro inesperado ao criar admin');
    }

    setSaving(false);
  };

  const handleRemoveAdmin = async (admin: AdminUser) => {
    if (!confirm('Tem certeza que deseja remover este administrador?')) return;

    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('id', admin.id);

    if (error) {
      toast.error('Erro ao remover administrador');
    } else {
      toast.success('Administrador removido');
      fetchAdmins();
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
        <h2 className="text-2xl font-serif font-bold">Administradores</h2>
        <Button variant="gold" onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Admin
        </Button>
      </div>

      {admins.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-xl">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum administrador cadastrado</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {admins.map((admin) => (
            <div 
              key={admin.id} 
              className="p-4 rounded-xl glass-card flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{admin.email}</p>
                  <p className="text-sm text-muted-foreground">Administrador</p>
                </div>
              </div>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => handleRemoveAdmin(admin)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Administrador</DialogTitle>
            <DialogDescription>
              Crie uma nova conta de administrador
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="admin@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-password">Senha</Label>
              <Input
                id="admin-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDialogOpen(false); setError(null); }}>
              Cancelar
            </Button>
            <Button variant="gold" onClick={handleCreateAdmin} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Criando...
                </>
              ) : (
                'Criar Admin'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
