import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, FileText, Search, LogOut, ChevronRight, LayoutDashboard, Edit2, History } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function UserDashboard() {
  const navigate = useNavigate();
  const { certificates, currentUser, logout } = useStore();
  const [search, setSearch] = React.useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.info('Déconnecté');
  };

  const filteredCerts = certificates
    .filter(c => c.userName === currentUser?.name)
    .filter(c => 
      c.id.includes(search) || 
      c.companyName.toLowerCase().includes(search.toLowerCase()) ||
      c.location.toLowerCase().includes(search.toLowerCase())
    )
    .reverse();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src="https://storage.googleapis.com/dala-prod-public-storage/generated-images/600341d3-5b02-41e2-848f-b8732aa88749/amphy-theatre-logo-cc7fb9ff-1783530932595.webp" 
              className="w-10 h-10 object-contain" 
              alt="Logo" 
            />
            <div>
              <h1 className="font-bold text-primary uppercase text-lg leading-tight">Amphy Theatre</h1>
              <p className="text-xs text-slate-500 font-medium">Session: <span className="text-slate-900">{currentUser?.name}</span></p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-red-500 hover:bg-red-50">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 text-white shadow-xl shadow-primary/20">
          <h2 className="text-2xl font-bold mb-2">Bonjour, {currentUser?.name} !</h2>
          <p className="text-white/80 text-sm mb-6">Prêt à générer un nouveau certificat de conformité ?</p>
          <Button 
            className="w-full bg-white text-primary hover:bg-slate-100 font-bold h-12 rounded-xl text-lg shadow-lg"
            onClick={() => navigate('/generate')}
          >
            <Plus className="w-6 h-6 mr-2" />
            Nouveau Certificat
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-white border-none shadow-sm">
            <CardContent className="pt-6">
              <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Mes Certificats</div>
              <div className="text-3xl font-bold text-slate-900">{filteredCerts.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-none shadow-sm">
            <CardContent className="pt-6">
              <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Dernière activité</div>
              <div className="text-sm font-bold text-slate-900 truncate">
                {filteredCerts.length > 0 ? format(new Date(filteredCerts[0].date), 'dd/MM/yyyy') : 'Aucune'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-xl flex items-center uppercase tracking-tight">
              <History className="w-6 h-6 mr-2 text-primary" />
              Mon Historique
            </h3>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Rechercher par ID ou entreprise..." 
              className="pl-10 h-11 bg-white border-slate-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            {filteredCerts.map((cert) => (
              <Card key={cert.id} className="hover:border-primary/50 transition-colors border-slate-200 shadow-sm overflow-hidden group">
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    <div className="w-2 bg-primary"></div>
                    <div className="flex-1 p-4 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-mono text-xs font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600">#{cert.id}</span>
                          <span className="text-xs text-slate-400 font-medium">{format(new Date(cert.date), 'dd MMM yyyy', { locale: fr })}</span>
                        </div>
                        <div className="font-bold text-slate-900 text-base">{cert.companyName}</div>
                        <div className="text-sm text-slate-500 flex items-center">
                           {cert.location}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10" onClick={() => navigate(`/edit/${cert.id}`)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors self-center" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredCerts.length === 0 && (
              <div className="py-20 text-center space-y-4">
                <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                  <FileText className="w-10 h-10 text-slate-300" />
                </div>
                <div>
                  <p className="text-slate-900 font-bold">Aucun certificat trouvé</p>
                  <p className="text-slate-500 text-sm">Commencez par en créer un nouveau.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Navigation bottom for mobile feel */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-lg border border-slate-200 rounded-full shadow-2xl px-6 py-3 flex items-center space-x-8 z-40">
        <button className="text-primary" onClick={() => navigate('/user')}>
          <LayoutDashboard className="w-6 h-6" />
        </button>
        <button className="bg-primary text-white p-3 rounded-full shadow-lg -mt-10" onClick={() => navigate('/generate')}>
          <Plus className="w-8 h-8" />
        </button>
        <button className="text-slate-400" onClick={handleLogout}>
          <LogOut className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
