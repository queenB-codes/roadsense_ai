import React, { useState } from 'react';
import { MobileView } from './components/MobileView';
import { AdminView } from './components/AdminView';
import { User, UserRole } from './types';
import { StorageService } from './services/storage';
import { ShieldCheck, Smartphone, UserPlus, LogIn } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(StorageService.getCurrentUser());
  const [isLogin, setIsLogin] = useState(true);
  
  // Form State
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.USER);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isLogin) {
        // Login Logic
        const loggedUser = await StorageService.login(email);
        if (loggedUser) {
          setUser(loggedUser);
        } else {
          setError('Invalid email. Try "admin@roadsense.com" or Sign Up.');
        }
      } else {
        // Sign Up Logic
        if (!name || !email) {
          setError('Please fill in all fields');
          setIsLoading(false);
          return;
        }
        const newUser = await StorageService.register(name, email, role);
        setUser(newUser);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    StorageService.logout();
    setUser(null);
    setEmail('');
    setName('');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-indigo-600 p-8 text-center relative">
            <h1 className="text-3xl font-bold text-white mb-2">RoadSense AI</h1>
            <p className="text-indigo-200">Pothole Detection System</p>
          </div>
          
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h2>
              <button 
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="text-sm text-indigo-600 font-medium hover:text-indigo-800 flex items-center"
              >
                {isLogin ? <><UserPlus size={16} className="mr-1"/> Sign Up</> : <><LogIn size={16} className="mr-1"/> Login</>}
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="John Doe"
                    required={!isLogin}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="email@example.com"
                  required
                />
              </div>

              {!isLogin && (
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                   <div className="grid grid-cols-2 gap-3">
                      <button 
                        type="button"
                        onClick={() => setRole(UserRole.USER)}
                        className={`p-3 rounded-lg border flex flex-col items-center justify-center text-sm ${role === UserRole.USER ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500'}`}
                      >
                        <Smartphone size={20} className="mb-1" /> Mobile User
                      </button>
                      <button 
                        type="button"
                        onClick={() => setRole(UserRole.ADMIN)}
                        className={`p-3 rounded-lg border flex flex-col items-center justify-center text-sm ${role === UserRole.ADMIN ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500'}`}
                      >
                        <ShieldCheck size={20} className="mb-1" /> Admin
                      </button>
                   </div>
                </div>
              )}
              
              {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded border border-red-100">{error}</p>}
              
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 rounded-lg text-white font-bold text-lg shadow-md transition-all ${
                  isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg'
                }`}
              >
                {isLoading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
              </button>
            </form>

            {isLogin && (
              <div className="mt-8 pt-6 border-t border-gray-100">
                <p className="text-xs text-center text-gray-400 mb-4 uppercase tracking-widest">Quick Demo Login</p>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setEmail('john@gmail.com')} className="text-xs p-2 bg-gray-50 rounded hover:bg-gray-100 text-gray-600 border border-gray-200">
                     User: john@gmail.com
                  </button>
                  <button onClick={() => setEmail('admin@roadsense.com')} className="text-xs p-2 bg-gray-50 rounded hover:bg-gray-100 text-gray-600 border border-gray-200">
                     Admin: admin@roadsense.com
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Route based on role
  if (user.role === UserRole.ADMIN) {
    return <AdminView user={user} onLogout={handleLogout} />;
  }

  return <MobileView user={user} onLogout={handleLogout} />;
};

export default App;