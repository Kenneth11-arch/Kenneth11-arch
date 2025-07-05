import React, { useState } from "react";
import "./App.css";
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import Header from './components/Header/Header';
import SportsBetting from './components/Sports/SportsBetting';
import BetHistory from './components/History/BetHistory';
import SettledMatches from './components/Settled/SettledMatches';
import Wallet from './components/Wallet/Wallet';

const AuthenticatedApp = () => {
  const [activeSection, setActiveSection] = useState('sports');
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'sports':
        return <SportsBetting />;
      case 'history':
        return <BetHistory />;
      case 'settled':
        return <SettledMatches />;
      case 'wallet':
        return <Wallet />;
      default:
        return <SportsBetting />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header 
        onSectionChange={setActiveSection} 
        activeSection={activeSection}
      />
      <main className="pb-8">
        {renderSection()}
      </main>
    </div>
  );
};

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {isLogin ? (
          <LoginForm onToggleForm={() => setIsLogin(false)} />
        ) : (
          <RegisterForm onToggleForm={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

export default App;
