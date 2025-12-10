import { PotholeReport, User, UserRole } from '../types';

// Keys for LocalStorage
const USERS_KEY = 'roadsense_users';
const REPORTS_KEY = 'roadsense_reports';
const SESSION_KEY = 'roadsense_session';

// Seed initial data
const seedData = () => {
  if (!localStorage.getItem(USERS_KEY)) {
    const users: User[] = [
      { id: '1', name: 'Admin User', email: 'admin@roadsense.com', role: UserRole.ADMIN, avatar: 'https://picsum.photos/100/100' },
      { id: '2', name: 'John Doe', email: 'john@gmail.com', role: UserRole.USER, avatar: 'https://picsum.photos/101/101' },
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
  if (!localStorage.getItem(REPORTS_KEY)) {
    // Generate some fake historical data
    const reports: PotholeReport[] = Array.from({ length: 15 }).map((_, i) => ({
      id: `seed-${i}`,
      userId: i % 2 === 0 ? '2' : '3',
      userName: i % 2 === 0 ? 'John Doe' : 'Jane Smith',
      latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
      longitude: -74.0060 + (Math.random() - 0.5) * 0.1,
      confidence: 0.85 + Math.random() * 0.14,
      imageUrl: `https://picsum.photos/seed/${i}/400/300`,
      timestamp: Date.now() - Math.floor(Math.random() * 1000000000),
      synced: true,
    }));
    localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
  }
};

seedData();

export const StorageService = {
  login: async (email: string): Promise<User | null> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const user = users.find((u: User) => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      return user;
    }
    return null;
  },

  register: async (name: string, email: string, role: UserRole): Promise<User> => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    
    // Check if exists
    if (users.find((u: User) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error("Email already registered");
    }

    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      role,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
    };

    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
    return newUser;
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
  },

  getCurrentUser: (): User | null => {
    const session = localStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
  },

  saveReport: async (report: PotholeReport): Promise<void> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    const reports = JSON.parse(localStorage.getItem(REPORTS_KEY) || '[]');
    reports.unshift(report);
    localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
  },

  getReports: async (): Promise<PotholeReport[]> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return JSON.parse(localStorage.getItem(REPORTS_KEY) || '[]');
  },

  getUserReports: async (userId: string): Promise<PotholeReport[]> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const reports = JSON.parse(localStorage.getItem(REPORTS_KEY) || '[]');
    return reports.filter((r: PotholeReport) => r.userId === userId);
  },
  
  syncOfflineReports: async () => {
     // In a real app, this would iterate over localDB items with synced: false and POST them
     console.log("Syncing offline reports...");
     return true;
  }
};