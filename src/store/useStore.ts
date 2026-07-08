import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  name: string;
  password: string;
  role: 'admin' | 'user';
  isOnline: boolean;
}

export interface Certificate {
  id: string; // Format: 000001
  uniqueId: string;
  date: string;
  time: string;
  location: string;
  userName: string;
  equipmentPhoto: string;
  logoUrl: string;
  companyName: string;
  companyAddress: string;
  companyContact: string;
  qrCodeData: string;
  appreciation: string;
  observations: string;
  certifierName: string;
  certifierLaw: string;
  certifierContact: string;
  versoPhotos: string[];
}

export interface AppSettings {
  certifyingCompany: {
    name: string;
    law: string;
    contacts: string;
  };
  dropdownOptions: {
    appreciations: string[];
    observations: string[];
  };
}

interface AppState {
  users: User[];
  certificates: Certificate[];
  logs: { timestamp: string; action: string; userName: string }[];
  currentUser: User | null;
  settings: AppSettings;
  
  // User Actions
  addUser: (user: Omit<User, 'id' | 'isOnline'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  setOnlineStatus: (id: string, status: boolean) => void;
  
  // Auth Actions
  login: (name: string, password: string, expectedRole?: 'admin' | 'user') => boolean;
  logout: () => void;
  
  // Certificate Actions
  addCertificate: (cert: Omit<Certificate, 'id'>) => void;
  getNextCertId: () => string;
  updateCertificate: (id: string, updates: Partial<Certificate>) => void;
  
  // Settings Actions
  updateSettings: (updates: Partial<AppSettings>) => void;
  addDropdownOption: (type: 'appreciations' | 'observations', value: string) => void;
}

const DEFAULT_ADMIN: User = {
  id: 'admin-id',
  name: 'admin',
  password: 'admin',
  role: 'admin',
  isOnline: false,
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      users: [DEFAULT_ADMIN],
      certificates: [],
      logs: [],
      currentUser: null,
      settings: {
        certifyingCompany: {
          name: 'AMPHY THEATRE INSPECTION',
          law: 'Conforme à la loi N° 92/007 du 14 Août 1992 relative aux établissements classés dangereux, insalubres ou incommodes.',
          contacts: '+237 600 000 000 | contact@amphytheatre.com',
        },
        dropdownOptions: {
          appreciations: ['Satisfaisant', 'À surveiller', 'Non satisfaisant'],
          observations: ['Aucune anomalie', 'Pièces à remplacer', 'Entretien requis'],
        },
      },

      addUser: (user) => set((state) => ({
        users: [...state.users, { ...user, id: crypto.randomUUID(), isOnline: false }]
      })),

      updateUser: (id, updates) => set((state) => ({
        users: state.users.map((u) => (u.id === id ? { ...u, ...updates } : u))
      })),

      deleteUser: (id) => set((state) => ({
        users: state.users.filter((u) => u.id !== id)
      })),

      setOnlineStatus: (id, status) => set((state) => ({
        users: state.users.map((u) => (u.id === id ? { ...u, isOnline: status } : u))
      })),

      login: (name, password, expectedRole) => {
        const { users } = get();
        const user = users.find((u) => u.name === name && u.password === password);
        if (user) {
          if (expectedRole && user.role !== expectedRole) {
            return false;
          }
          set({ currentUser: user });
          get().setOnlineStatus(user.id, true);
          return true;
        }
        return false;
      },

      logout: () => {
        const { currentUser } = get();
        if (currentUser) {
          get().setOnlineStatus(currentUser.id, false);
        }
        set({ currentUser: null });
      },

      addCertificate: (cert) => set((state) => {
        const newCert = { ...cert, id: get().getNextCertId() };
        return {
          certificates: [...state.certificates, newCert],
          logs: [
            ...state.logs,
            {
              timestamp: new Date().toISOString(),
              action: `Génération du certificat ${newCert.id}`,
              userName: state.currentUser?.name || 'Inconnu',
            },
          ],
        };
      }),

      getNextCertId: () => {
        const { certificates } = get();
        const lastId = certificates.length > 0 
          ? parseInt(certificates[certificates.length - 1].id) 
          : 0;
        return (lastId + 1).toString().padStart(6, '0');
      },

      updateCertificate: (id, updates) => set((state) => ({
        certificates: state.certificates.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        logs: [
          ...state.logs,
          {
            timestamp: new Date().toISOString(),
            action: `Modification du certificat ${id}`,
            userName: state.currentUser?.name || 'Inconnu',
          },
        ],
      })),

      updateSettings: (updates) => set((state) => ({
        settings: { ...state.settings, ...updates }
      })),

      addDropdownOption: (type, value) => set((state) => ({
        settings: {
          ...state.settings,
          dropdownOptions: {
            ...state.settings.dropdownOptions,
            [type]: [...state.settings.dropdownOptions[type], value]
          }
        }
      })),
    }),
    {
      name: 'amphy-theatre-storage',
    }
  )
);
