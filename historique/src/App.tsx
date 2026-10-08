import React from 'react';
import { LoaderCircle } from 'lucide-react';
import { useAuth } from './auth/AuthContext';
import { Layout } from './components/Layout';
import { JourneeProvider } from './lib/JourneeContext';
import { useRoute, type PageId } from './lib/router';
import { ChangePasswordPage, LoginPage, NoAccessPage, OfflinePage } from './pages/AuthScreens';
import { CaPage } from './pages/CaPage';
import { CloturePage } from './pages/CloturePage';
import { ComptagePage } from './pages/ComptagePage';
import { ComptePage } from './pages/ComptePage';
import { CreditsPage } from './pages/CreditsPage';
import { DepensesPage } from './pages/DepensesPage';
import { HistoriquePage } from './pages/HistoriquePage';
import { JournalPage } from './pages/JournalPage';
import { JourneePage } from './pages/JourneePage';
import { MouvementsPage } from './pages/MouvementsPage';
import { NotesPage } from './pages/NotesPage';
import { ParametresPage } from './pages/ParametresPage';
import { VentesPage } from './pages/VentesPage';

const PAGES: Record<PageId, React.FC> = {
  journee: JourneePage,
  ventes: VentesPage,
  depenses: DepensesPage,
  ca: CaPage,
  comptage: ComptagePage,
  mouvements: MouvementsPage,
  cloture: CloturePage,
  notes: NotesPage,
  credits: CreditsPage,
  historique: HistoriquePage,
  journal: JournalPage,
  parametres: ParametresPage,
  compte: ComptePage,
};

export const App: React.FC = () => {
  const { state, reload } = useAuth();
  const { page } = useRoute();

  if (state.kind === 'loading')
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50">
        <LoaderCircle size={22} className="text-emerald-600 animate-spin" />
      </div>
    );
  if (state.kind === 'anonymous') return <LoginPage message={state.message} />;
  if (state.kind === 'no_access') return <NoAccessPage message={state.message} />;
  if (state.kind === 'offline') return <OfflinePage onRetry={() => void reload()} />;
  if (state.user.mustChangePassword) return <ChangePasswordPage />;

  const Page = PAGES[page];
  return (
    <JourneeProvider>
      <Layout>
        <Page key={page} />
      </Layout>
    </JourneeProvider>
  );
};
