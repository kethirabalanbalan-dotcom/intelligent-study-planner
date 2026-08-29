import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PlannerProvider, usePlanner } from './context/PlannerContext';
import { AuthView } from './components/AuthView';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { ToastContainer } from './components/ToastContainer';
import { DashboardView } from './components/DashboardView';
import { SubjectsView } from './components/SubjectsView';
import { StudyPlanView } from './components/StudyPlanView';
import { CalendarView } from './components/CalendarView';
import { ProgressView } from './components/ProgressView';
import { RecommendationsView } from './components/RecommendationsView';
import { ReplanningHistoryView } from './components/ReplanningHistoryView';
import { SettingsView } from './components/SettingsView';
import { SubjectDetailsModal } from './components/SubjectDetailsModal';
import { ReplanModal } from './components/ReplanModal';
import { DayDetailModal } from './components/DayDetailModal';

const MainLayout: React.FC = () => {
  const { activeTab } = usePlanner();

  return (
    <div className="min-h-screen bg-slate-50/80 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navigation */}
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-8">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden md:block w-64 shrink-0">
          <div className="sticky top-24">
            <Sidebar />
          </div>
        </aside>

        {/* Dynamic Main View */}
        <main className="flex-1 min-w-0 pb-20 md:pb-6">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'subjects' && <SubjectsView />}
          {activeTab === 'study-plan' && <StudyPlanView />}
          {activeTab === 'calendar' && <CalendarView />}
          {activeTab === 'progress' && <ProgressView />}
          {activeTab === 'recommendations' && <RecommendationsView />}
          {activeTab === 'history' && <ReplanningHistoryView />}
          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Bottom Mobile Navigation */}
      <MobileNav />

      {/* Global Interactive Modals & Toast System */}
      <SubjectDetailsModal />
      <ReplanModal />
      <DayDetailModal />
      <ToastContainer />
    </div>
  );
};

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200">
        <div className="w-10 h-10 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
        <div className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
          Loading Study Planner...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthView />;
  }

  return (
    <PlannerProvider>
      <MainLayout />
    </PlannerProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

