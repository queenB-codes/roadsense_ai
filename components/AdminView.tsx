import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Map as MapIcon, Database, FileText, UserCircle, LogOut, Search, Download } from 'lucide-react';
import { User, PotholeReport } from '../types';
import { StorageService } from '../services/storage';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AdminViewProps {
  user: User;
  onLogout: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ user, onLogout }) => {
  const [activePage, setActivePage] = useState<'dashboard' | 'reports' | 'map'>('dashboard');
  const [reports, setReports] = useState<PotholeReport[]>([]);

  useEffect(() => {
    StorageService.getReports().then(setReports);
  }, []);

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col flex-shrink-0 transition-all">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold tracking-tight text-indigo-400">RoadSense<span className="text-white">Admin</span></h1>
          <p className="text-xs text-slate-400 mt-1">Pothole Detection System</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activePage === 'dashboard'} onClick={() => setActivePage('dashboard')} />
          <SidebarItem icon={Database} label="Reports Management" active={activePage === 'reports'} onClick={() => setActivePage('reports')} />
          <SidebarItem icon={MapIcon} label="Global Map" active={activePage === 'map'} onClick={() => setActivePage('map')} />
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold mr-3">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-slate-400">Administrator</p>
            </div>
          </div>
          <button onClick={onLogout} className="flex items-center w-full px-2 py-2 text-sm text-red-400 hover:bg-slate-800 rounded-md transition-colors">
            <LogOut size={16} className="mr-2" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <h2 className="text-xl font-semibold text-gray-800">
            {activePage === 'dashboard' && 'System Overview'}
            {activePage === 'reports' && 'Detection Records'}
            {activePage === 'map' && 'Geospatial Analysis'}
          </h2>
          <div className="flex items-center space-x-4">
             <span className="text-sm text-gray-500">Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </header>

        <div className="p-8">
          {activePage === 'dashboard' && <DashboardHome reports={reports} />}
          {activePage === 'reports' && <ReportsTable reports={reports} />}
          {activePage === 'map' && <AdminMap reports={reports} />}
        </div>
      </main>
    </div>
  );
};

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
      active ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`}
  >
    <Icon size={18} className="mr-3" />
    {label}
  </button>
);

// --- Sub Views ---

const DashboardHome = ({ reports }: { reports: PotholeReport[] }) => {
  const chartData = [
    { name: 'Mon', count: 12 },
    { name: 'Tue', count: 19 },
    { name: 'Wed', count: 3 },
    { name: 'Thu', count: 5 },
    { name: 'Fri', count: 22 },
    { name: 'Sat', count: 15 },
    { name: 'Sun', count: 8 },
  ];
  
  const pieData = [
    { name: 'High Confidence', value: reports.filter(r => r.confidence > 0.9).length },
    { name: 'Med Confidence', value: reports.filter(r => r.confidence <= 0.9 && r.confidence > 0.7).length },
    { name: 'Low Confidence', value: reports.filter(r => r.confidence <= 0.7).length },
  ];
  const COLORS = ['#4f46e5', '#818cf8', '#c7d2fe'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Detections" value={reports.length.toString()} icon={Database} color="bg-blue-500" />
        <StatCard title="Active Users" value="24" icon={UserCircle} color="bg-emerald-500" />
        <StatCard title="High Severity" value={pieData[0].value.toString()} icon={FileText} color="bg-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Weekly Detections</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 12}} />
                <YAxis tick={{fontSize: 12}} />
                <Tooltip cursor={{fill: '#f3f4f6'}} />
                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Confidence Distribution</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-xs text-gray-500 mt-2">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center"><div className="w-3 h-3 rounded-full mr-1" style={{backgroundColor: COLORS[i]}}></div>{d.name}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center">
    <div className={`w-12 h-12 rounded-lg ${color} bg-opacity-10 text-white flex items-center justify-center mr-4`}>
       <div className={`p-2 rounded-lg ${color}`}>
         <Icon size={24} />
       </div>
    </div>
    <div>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
    </div>
  </div>
);

const ReportsTable = ({ reports }: { reports: PotholeReport[] }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Search ID or User..." className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <button className="flex items-center px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors">
          <Download size={18} className="mr-2" /> Export CSV
        </button>
      </div>
      <table className="w-full text-left text-sm text-gray-600">
        <thead className="bg-gray-100 text-gray-700 font-semibold">
          <tr>
            <th className="px-6 py-3">Report ID</th>
            <th className="px-6 py-3">Image</th>
            <th className="px-6 py-3">User</th>
            <th className="px-6 py-3">Location (Lat, Lon)</th>
            <th className="px-6 py-3">Confidence</th>
            <th className="px-6 py-3">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {reports.map((report) => (
            <tr key={report.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 font-mono text-xs">{report.id.substring(0, 8)}...</td>
              <td className="px-6 py-4">
                <img src={report.imageUrl} alt="Pothole" className="w-12 h-12 rounded object-cover border border-gray-200" />
              </td>
              <td className="px-6 py-4">{report.userName}</td>
              <td className="px-6 py-4">{report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}</td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${report.confidence > 0.9 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                  {(report.confidence * 100).toFixed(1)}%
                </span>
              </td>
              <td className="px-6 py-4">{new Date(report.timestamp).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const AdminMap = ({ reports }: { reports: PotholeReport[] }) => {
  return (
    <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 h-[600px] relative overflow-hidden group">
      {/* Simulated Map Background */}
      <div className="w-full h-full bg-slate-100 bg-[url('https://picsum.photos/seed/adminmap/1200/800')] bg-cover filter grayscale group-hover:grayscale-0 transition-all duration-700 opacity-80"></div>
      
      {/* Overlay Markers Simulation */}
      <div className="absolute inset-0 p-10">
         {reports.slice(0, 8).map((r, i) => (
           <div 
             key={r.id} 
             className="absolute w-4 h-4 bg-red-500 border-2 border-white rounded-full shadow-lg transform hover:scale-150 transition-transform cursor-pointer"
             style={{ top: `${20 + (i * 10) + Math.random() * 10}%`, left: `${10 + (i * 12) + Math.random() * 10}%` }}
             title={`Confidence: ${(r.confidence * 100).toFixed(0)}%`}
           ></div>
         ))}
      </div>
      
      <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg">
        <h3 className="font-bold text-gray-800">Geospatial Heatmap</h3>
        <p className="text-xs text-gray-500">Visualizing 150+ incidents</p>
      </div>
    </div>
  );
};