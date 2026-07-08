import React, { useState } from 'react';
import { useNavigate, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Users, 
  History, 
  Settings as SettingsIcon, 
  LogOut, 
  Plus, 
  Trash2, 
  Edit, 
  CheckCircle2, 
  XCircle,
  Menu,
  X
} from 'lucide-react';
import { useStore, User } from '../store/useStore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// --- Sub-components ---

const UserManagement = () => {
  const { users, addUser, updateUser, deleteUser, currentUser } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{ name: string; password: string; role: 'admin' | 'user' }>({ name: '', password: '', role: 'user' });

  const handleSave = () => {
    if (!formData.name || !formData.password) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    if (editingId) {
      updateUser(editingId, formData);
      toast.success('Utilisateur mis à jour');
      setEditingId(null);
    } else {
      addUser(formData);
      toast.success('Utilisateur créé');
      setIsAdding(false);
    }
    setFormData({ name: '', password: '', role: 'user' });
  };

  const startEdit = (user: User) => {
    setEditingId(user.id);
    setFormData({ name: user.name, password: user.password, role: user.role });
    setIsAdding(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Gestion des Utilisateurs</h2>
        <Button onClick={() => { setIsAdding(true); setEditingId(null); setFormData({ name: '', password: '', role: 'user' }); }}>
          <Plus className="w-4 h-4 mr-2" /> Créer un compte
        </Button>
      </div>

      {isAdding && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>{editingId ? 'Modifier' : 'Créer'} un utilisateur</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom d'utilisateur</Label>
                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Mot de passe</Label>
                <Input type="text" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAdding(false)}>Annuler</Button>
              <Button onClick={handleSave}>Enregistrer</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4">
        {users.map((user) => (
          <Card key={user.id} className="hover:shadow-md transition-shadow">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-4">
                <div className={`w-3 h-3 rounded-full ${user.isOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-slate-300'}`} title={user.isOnline ? 'En ligne' : 'Hors ligne'} />
                <div>
                  <div className="font-semibold text-slate-900">{user.name}</div>
                  <div className="text-sm text-slate-500 capitalize">{user.role}</div>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="ghost" size="icon" onClick={() => startEdit(user)}>
                  <Edit className="w-4 h-4 text-slate-600" />
                </Button>
                {user.id !== currentUser?.id && user.name !== 'admin' && (
                  <Button variant="ghost" size="icon" onClick={() => { deleteUser(user.id); toast.success('Utilisateur supprimé'); }}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

const ActivityLogs = () => {
  const { logs, users } = useStore();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-extrabold text-slate-900 uppercase tracking-tight">Historique des Activités</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-blue-600 uppercase tracking-wider">Total Utilisateurs</div>
            <div className="text-3xl font-bold text-blue-900">{users.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-100">
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-green-600 uppercase tracking-wider">En Ligne</div>
            <div className="text-3xl font-bold text-green-900">{users.filter(u => u.isOnline).length}</div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-100">
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-purple-600 uppercase tracking-wider">Certificats Générés</div>
            <div className="text-3xl font-bold text-purple-900">{logs.filter(l => l.action.includes('Génération')).length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Heure</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Utilisateur</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.slice().reverse().map((log, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm text-slate-600">
                  {format(new Date(log.timestamp), 'dd MMM, HH:mm', { locale: fr })}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-slate-900">{log.userName}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{log.action}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-slate-500 italic">Aucune activité enregistrée</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Settings = () => {
  const { settings, updateSettings, addDropdownOption } = useStore();
  const [newOption, setNewOption] = useState({ type: 'appreciations' as 'appreciations' | 'observations', value: '' });

  const handleUpdateCompany = (field: string, value: string) => {
    updateSettings({
      certifyingCompany: {
        ...settings.certifyingCompany,
        [field]: value
      }
    });
  };

  const handleAddOption = () => {
    if (!newOption.value) return;
    addDropdownOption(newOption.type, newOption.value);
    setNewOption({ ...newOption, value: '' });
    toast.success('Option ajoutée');
  };

  return (
    <div className="space-y-8 pb-12">
      <h2 className="text-2xl font-bold text-slate-900">Paramètres de l'Application</h2>

      <Card>
        <CardHeader>
          <CardTitle>Informations de l'Entreprise Certificatrice</CardTitle>
          <CardDescription>Ces informations apparaîtront au bas de chaque certificat.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nom de l'entreprise</Label>
            <Input 
              value={settings.certifyingCompany.name} 
              onChange={e => handleUpdateCompany('name', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Informations Légales (Loi/Autorisation)</Label>
            <textarea 
              className="w-full min-h-[100px] px-3 py-2 text-sm rounded-md border border-input bg-background"
              value={settings.certifyingCompany.law} 
              onChange={e => handleUpdateCompany('law', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Contacts</Label>
            <Input 
              value={settings.certifyingCompany.contacts} 
              onChange={e => handleUpdateCompany('contacts', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Champs de Certification</CardTitle>
          <CardDescription>Gérez les options disponibles dans les listes déroulantes du certificat.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-base font-semibold">Appréciations</Label>
              <div className="flex flex-wrap gap-2">
                {settings.dropdownOptions.appreciations.map((opt, i) => (
                  <span key={i} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">{opt}</span>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-base font-semibold">Observations</Label>
              <div className="flex flex-wrap gap-2">
                {settings.dropdownOptions.observations.map((opt, i) => (
                  <span key={i} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">{opt}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <Label className="mb-2 block">Ajouter une nouvelle option</Label>
            <div className="flex space-x-2">
              <select 
                className="px-3 py-2 text-sm rounded-md border border-input bg-background"
                value={newOption.type}
                onChange={e => setNewOption({ ...newOption, type: e.target.value as any })}
              >
                <option value="appreciations">Appréciation</option>
                <option value="observations">Observation</option>
              </select>
              <Input 
                placeholder="Nouvelle valeur..." 
                value={newOption.value}
                onChange={e => setNewOption({ ...newOption, value: e.target.value })}
              />
              <Button onClick={handleAddOption}>Ajouter</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useStore(state => state.logout);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { to: '/admin', icon: Users, label: 'Utilisateurs', exact: true },
    { to: '/admin/logs', icon: History, label: 'Historique' },
    { to: '/admin/settings', icon: SettingsIcon, label: 'Paramètres' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.info('Déconnecté');
  };

  const isActive = (path: string, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <img src="https://storage.googleapis.com/dala-prod-public-storage/generated-images/600341d3-5b02-41e2-848f-b8732aa88749/amphy-theatre-logo-cc7fb9ff-1783530932595.webp" className="w-8 h-8 object-contain" alt="Logo" />
          <span className="font-bold text-primary uppercase text-sm">Amphy Theatre</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside className={`
        ${isMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        fixed md:sticky top-0 left-0 bottom-0 z-40 w-64 bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out md:h-screen flex flex-col
      `}>
        <div className="p-6 hidden md:block">
          <div className="flex items-center space-x-3 mb-8">
            <img src="https://storage.googleapis.com/dala-prod-public-storage/generated-images/600341d3-5b02-41e2-848f-b8732aa88749/amphy-theatre-logo-cc7fb9ff-1783530932595.webp" className="w-10 h-10 object-contain" alt="Logo" />
            <div className="font-bold text-xl text-primary uppercase leading-tight">Amphy<br />Theatre</div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4 md:mt-0">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setIsMenuOpen(false)}
              className={`
                flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors
                ${isActive(link.to, link.exact) 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'text-slate-600 hover:bg-slate-100'}
              `}
            >
              <link.icon className={`w-5 h-5 mr-3 ${isActive(link.to, link.exact) ? 'text-white' : 'text-slate-400'}`} />
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 pt-6 md:pt-8 max-w-5xl mx-auto w-full">
        <Routes>
          <Route path="/" element={<UserManagement />} />
          <Route path="/logs" element={<ActivityLogs />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>

      {/* Overlay for mobile menu */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </div>
  );
}
