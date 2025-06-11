import React, { useState } from 'react';
import LoginForm from './components/LoginForm';
import RegistrationForm from './components/RegistrationForm';

const AuthPage: React.FC = () => {
  const [showLogin, setShowLogin] = useState(true);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-card-background p-8 sm:p-10 rounded-xl shadow-lg">
        {showLogin ? <LoginForm /> : <RegistrationForm />}
        <div className="text-center">
          <button
            onClick={() => setShowLogin(!showLogin)}
            className="font-medium text-primary-accent hover:text-secondary-accent transition-colors"
          >
            {showLogin ? 'Need to create an account?' : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
