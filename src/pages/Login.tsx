import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useStore } from '../store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Lock, User, ShieldCheck, UserCircle, ArrowLeft } from 'lucide-react';

export default function Login() {
  const [loginType, setLoginType] = useState<'selection' | 'admin' | 'user'>('selection');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useStore((state) => state.login);
  const currentUser = useStore((state) => state.currentUser);
  const navigate = useNavigate();

  // Redirect if already logged in
  React.useEffect(() => {
    if (currentUser) {
      navigate(currentUser.role === 'admin' ? '/admin' : '/user');
    }
  }, [currentUser, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      const success = login(name, password, loginType === 'admin' ? 'admin' : 'user');
      if (success) {
        toast.success('Connexion réussie');
      } else {
        toast.error("Nom d'utilisateur ou mot de passe incorrect");
        setLoading(false);
      }
    }, 500);
  };

  if (loginType === 'selection') {
    return (
      <div className="flex items-center justify-center min-h-screen px-4 py-12 bg-slate-50">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <img 
              src="https://storage.googleapis.com/dala-prod-public-storage/generated-images/600341d3-5b02-41e2-848f-b8732aa88749/amphy-theatre-logo-cc7fb9ff-1783530932595.webp" 
              alt="AMPHY THEATRE" 
              className="h-24 w-24 object-contain mx-auto mb-6"
            />
            <h1 className="text-3xl font-extrabold text-slate-900 uppercase tracking-tight text-center">Amphy Theatre</h1>
            <p className="mt-2 text-slate-600">Choisissez votre type de connexion</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <Button 
              variant="outline" 
              className="h-32 flex flex-col items-center justify-center space-y-2 border-2 hover:border-primary hover:bg-primary/5 group transition-all"
              onClick={() => setLoginType('admin')}
            >
              <ShieldCheck className="w-10 h-10 text-slate-400 group-hover:text-primary" />
              <span className="text-lg font-bold">Administrateur</span>
            </Button>

            <Button 
              variant="outline" 
              className="h-32 flex flex-col items-center justify-center space-y-2 border-2 hover:border-primary hover:bg-primary/5 group transition-all"
              onClick={() => setLoginType('user')}
            >
              <UserCircle className="w-10 h-10 text-slate-400 group-hover:text-primary" />
              <span className="text-lg font-bold">Utilisateur</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12 bg-slate-50">
      <Card className="w-full max-w-md shadow-xl border-slate-200">
        <CardHeader className="space-y-1 text-center relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute left-4 top-4"
            onClick={() => setLoginType('selection')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-2 rounded-full">
              <img 
                src="https://storage.googleapis.com/dala-prod-public-storage/generated-images/600341d3-5b02-41e2-848f-b8732aa88749/amphy-theatre-logo-cc7fb9ff-1783530932595.webp" 
                alt="AMPHY THEATRE" 
                className="h-16 w-16 object-contain"
              />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 uppercase">
            {loginType === 'admin' ? 'Connexion Admin' : 'Connexion Utilisateur'}
          </CardTitle>
          <CardDescription className="text-slate-500">
            Entrez vos identifiants pour accéder à {loginType === 'admin' ? "l'administration" : "votre espace"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nom d'utilisateur {loginType === 'admin' && '(admin)'}</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  id="username" 
                  placeholder={loginType === 'admin' ? 'admin' : 'Votre nom'} 
                  className="pl-10" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full text-lg font-medium" disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
