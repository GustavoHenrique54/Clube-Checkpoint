import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import ClubHub from './pages/ClubHub';
import AdminLandingConfig from './pages/AdminLandingConfig';
import SearchProfiles from './pages/SearchProfiles';
import Friends from './pages/Friends';
import Leaderboard from './pages/Leaderboard';
import AdminBatchBadge from './pages/AdminBatchBadge';
import Profile from './pages/Profile';
import Login from './pages/Login';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { Analytics } from '@vercel/analytics/react';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth
  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-4 border-white/20 border-t-ps-blue rounded-full animate-spin"></div>
      </div>
    );
  }

  const isPublicPath = 
    location.pathname === '/' || 
    location.pathname === '/login' || 
    location.pathname === '/PublicProfile' ||
    location.pathname.startsWith('/PublicProfile');

  // If not authenticated and trying to access a private path, redirect to login
  if (!isAuthenticated && !isPublicPath) {
    window.location.href = `/login?redirect=${encodeURIComponent(location.pathname)}`;
    return null;
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="/login" element={<Login />} />
      <Route path="/hub" element={<LayoutWrapper currentPageName="ClubHub"><ClubHub /></LayoutWrapper>} />
      <Route path="/ClubHub" element={<LayoutWrapper currentPageName="ClubHub"><ClubHub /></LayoutWrapper>} />
      <Route path="/perfil" element={<LayoutWrapper currentPageName="Profile"><Profile /></LayoutWrapper>} />
      <Route path="/jogos" element={<LayoutWrapper currentPageName="ConsideredGames"><Pages.ConsideredGames /></LayoutWrapper>} />
      <Route path="/ConsideredGames" element={<LayoutWrapper currentPageName="ConsideredGames"><Pages.ConsideredGames /></LayoutWrapper>} />
      <Route path="/AdminLandingConfig" element={<LayoutWrapper currentPageName="AdminLandingConfig"><AdminLandingConfig /></LayoutWrapper>} />
      <Route path="/SearchProfiles" element={<LayoutWrapper currentPageName="SearchProfiles"><SearchProfiles /></LayoutWrapper>} />
      <Route path="/Friends" element={<LayoutWrapper currentPageName="Friends"><Friends /></LayoutWrapper>} />
      <Route path="/Leaderboard" element={<LayoutWrapper currentPageName="Leaderboard"><Leaderboard /></LayoutWrapper>} />
      <Route path="/AdminBatchBadge" element={<LayoutWrapper currentPageName="AdminBatchBadge"><AdminBatchBadge /></LayoutWrapper>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <Analytics />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App