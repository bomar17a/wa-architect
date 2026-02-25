
import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard.tsx';
import { ActivityEditor } from './components/ActivityEditor.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { Login } from './components/Auth/Login.tsx';
import { Signup } from './components/Auth/Signup.tsx';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import { Activity, ApplicationType, View, ActivityStatus } from './types.ts';
import { Loader2 } from 'lucide-react';
import { activityService } from './services/activityService.ts';

const AppContent: React.FC = () => {
  const { session, user, loading: authLoading } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // --- Auth View State ---
  const [authView, setAuthView] = useState<'LANDING' | 'LOGIN' | 'SIGNUP'>('LANDING');

  // Reset to Landing page on logout
  useEffect(() => {
    if (!session) {
      setAuthView('LANDING');
    }
  }, [session]);

  // Load activities when session is available
  useEffect(() => {
    if (user) {
      setDataLoading(true);
      activityService.fetchActivities()
        .then(data => setActivities(data))
        .catch(console.error)
        .finally(() => setDataLoading(false));
    } else {
      setActivities([]);
    }
  }, [user]);

  const [currentView, setCurrentView] = useState<View>('LANDING');
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
  const [appType, setAppType] = useState<ApplicationType>(() => {
    // Keep appType in localStorage as it's a UI preference
    const savedType = localStorage.getItem('wa-architect-appType');
    return savedType ? (savedType as ApplicationType) : ApplicationType.AMCAS;
  });
  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');

  useEffect(() => {
    localStorage.setItem('wa-architect-appType', appType);
    if (appType === ApplicationType.AACOMAS) {
      setActivities(prev => prev.map(a => ({ ...a, isMostMeaningful: false })));
    }
  }, [appType]);


  const handleSelectActivity = (activityId: number) => {
    const existingActivity = activities.find(a => a.id === activityId);

    if (!existingActivity) {
      // Create new activity
      // We generate a temp ID for the UI. Real ID will be confirmed on save if we let DB generate it,
      // but here we are using Date.now().
      const newActivity: Activity = {
        id: Date.now(), // Use a timestamp as a fairly unique ID for new items
        title: '',
        organization: '',
        city: '',
        country: '',
        experienceType: '',
        dateRanges: [{
          id: `dr-${Date.now()}`,
          startDateMonth: '',
          startDateYear: '',
          endDateMonth: '',
          endDateYear: '',
          hours: '',
          isAnticipated: false
        }],
        contactName: '',
        contactTitle: '',
        contactEmail: '',
        contactPhone: '',
        status: ActivityStatus.EMPTY,
        isMostMeaningful: false,
        description: '',
        competencies: [],
        mmeAction: '',
        mmeResult: '',
        mmeEssay: ''
      };

      setActivities(prev => [...prev, newActivity]);
      setSelectedActivityId(newActivity.id); // Select the new ID
    } else {
      setSelectedActivityId(activityId);
    }

    setCurrentView('EDITOR');
  };

  const handleBackToDashboard = () => {
    setSelectedActivityId(null);
    setCurrentView('DASHBOARD');
    // Refresh to ensure sync? Optional.
    if (user) {
      activityService.fetchActivities().then(setActivities).catch(console.error);
    }
  };

  const handleStartApp = () => {
    setCurrentView('DASHBOARD');
  };

  const handleSaveActivity = async (updatedActivity: Activity) => {
    // Optimistic update
    setActivities(prevActivities =>
      prevActivities.map(activity =>
        activity.id === updatedActivity.id ? updatedActivity : activity
      )
    );

    try {
      const saved = await activityService.saveActivity(updatedActivity);
      // Update with the real record from DB (updates ID if it changed, though we use timestamp so it shouldn't)
      setActivities(prev => prev.map(a => a.id === updatedActivity.id ? saved : a));
    } catch (e) {
      console.error("Failed to save activity:", e);
      alert("Failed to save changes. Please try again.");
    }
  };

  const handleDeleteActivity = async (activityId: number) => {
    if (window.confirm("Are you sure you want to delete this activity? This action cannot be undone.")) {
      // Optimistic delete
      const previousActivities = [...activities];
      setActivities(prev => prev.filter(a => a.id !== activityId));

      try {
        await activityService.deleteActivity(activityId);
      } catch (e) {
        console.error("Failed to delete activity:", e);
        alert("Failed to delete activity.");
        setActivities(previousActivities); // Revert
      }
    }
  };

  const handleToggleMME = async (activityId: number) => {
    const activityToToggle = activities.find(a => a.id === activityId);
    if (!activityToToggle) return;

    if (appType === ApplicationType.AACOMAS) {
      alert("Most Meaningful Experiences are an AMCAS-specific designation.");
      return;
    }

    const mmeCount = activities.filter(a => a.isMostMeaningful).length;
    if (!activityToToggle.isMostMeaningful && mmeCount >= 3) {
      alert("You can select a maximum of 3 Most Meaningful Experiences for AMCAS.");
      return;
    }

    const updated = { ...activityToToggle, isMostMeaningful: !activityToToggle.isMostMeaningful };

    // Optimistic update
    setActivities(prev =>
      prev.map(a => a.id === activityId ? updated : a)
    );

    try {
      await activityService.saveActivity(updated);
    } catch (e) {
      console.error("Failed to update MME status:", e);
      // Revert (lazy way: just fetch all again or toggle back)
    }
  };

  const selectedActivity = activities.find(a => a.id === selectedActivityId);

  if (authLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-brand-teal animate-spin" />
      </div>
    );
  }

  // If authenticated...
  if (session) {
    if (dataLoading && activities.length === 0) {
      return (
        <div className="h-screen w-full flex items-center justify-center bg-brand-light flex-col gap-4">
          <Loader2 className="w-8 h-8 text-brand-teal animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">Loading your workspace...</p>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-100">
        {/* Helper to show Landing Page if selected, but usually dashboard is home for auth users */}
        {currentView === 'LANDING' || currentView === 'DASHBOARD' ? (
          <Dashboard
            activities={activities}
            onSelectActivity={handleSelectActivity}
            appType={appType}
            onAppTypeChange={setAppType}
            onToggleMME={handleToggleMME}
            onDeleteActivity={handleDeleteActivity}
            onImportActivities={(newActivities) => {
              // Add imported activities to state and save them
              const activitiesToSave = newActivities.map(a => ({
                ...a,
                // Ensure ID is unique if mostly temp
                id: Date.now() + Math.floor(Math.random() * 10000),
                status: ActivityStatus.DRAFT
              }));

              setActivities(prev => [...prev, ...activitiesToSave]);

              // Persist each one
              activitiesToSave.forEach(activity => {
                activityService.saveActivity(activity).catch(console.error);
              });
            }}
          />
        ) : (
          selectedActivity && (
            <ActivityEditor
              activity={selectedActivity}
              onSave={handleSaveActivity}
              onBack={handleBackToDashboard}
              appType={appType}
            />
          )
        )}
      </div>
    );
  }

  // If NOT authenticated...
  if (authView === 'LOGIN') {
    return (
      <div className="min-h-screen bg-brand-light flex items-center justify-center p-4">
        <Login onSwitchToSignup={() => setAuthView('SIGNUP')} />
        {/* Optional: Add a back button mechanism here if desired */}
      </div>
    );
  }

  if (authView === 'SIGNUP') {
    return (
      <div className="min-h-screen bg-brand-light flex items-center justify-center p-4">
        <Signup onSwitchToLogin={() => setAuthView('LOGIN')} />
      </div>
    );
  }

  // Default unauthenticated view is Landing Page
  return (
    <LandingPage
      onLogin={() => setAuthView('LOGIN')}
      onSignup={() => setAuthView('SIGNUP')}
    />
  );
};

import { ToastProvider } from './contexts/ToastContext.tsx';

const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;