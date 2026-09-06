import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import InviteCaretakerScreen from './src/screens/InviteCaretakerScreen';

export default function App() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState('dashboard');

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    setScreen('dashboard');
  };

  if (!user) {
    return (
      <>
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
        <StatusBar style="auto" />
      </>
    );
  }

  return (
    <>
      {screen === 'dashboard' && (
        <DashboardScreen
          user={user}
          onNavigateInvite={() => setScreen('invite')}
        />
      )}
      {screen === 'invite' && (
        <InviteCaretakerScreen onBack={() => setScreen('dashboard')} />
      )}
      <StatusBar style="auto" />
    </>
  );
}
