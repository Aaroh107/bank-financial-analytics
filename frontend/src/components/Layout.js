import { Link, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, TrendingUp, Shield, Users, AlertTriangle, Activity, Cloud } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const navigation = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Transactions", path: "/transactions", icon: TrendingUp },
  { name: "Fraud Detection", path: "/fraud", icon: Shield },
  { name: "Customer Analytics", path: "/customers", icon: Users },
  { name: "Risk Assessment", path: "/risk", icon: AlertTriangle },
  { name: "Processing Monitor", path: "/monitor", icon: Activity },
];

export default function Layout() {
  const location = useLocation();
  const [cloudStatus, setCloudStatus] = useState(null);

  useEffect(() => {
    const fetchCloudStatus = async () => {
      try {
        const response = await axios.get(`${API}/cloud/status`);
        setCloudStatus(response.data);
      } catch (error) {
        console.error('Error fetching cloud status:', error);
      }
    };

    fetchCloudStatus();
    const interval = setInterval(fetchCloudStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen bg-background" data-testid="layout-container">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card" data-testid="sidebar">
        <div className="p-6">
          <h1 className="text-2xl font-bold heading text-primary flex items-center gap-2" data-testid="app-title">
            <Activity className="w-6 h-6" />
            BankAnalytics
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Control Room</p>
        </div>
        
        {/* Cloud Status */}
        {cloudStatus && (
          <div className="mx-4 mb-4 p-3 rounded-lg bg-background/50 border border-border" data-testid="cloud-status-widget">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Cloud Status</span>
              </div>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${
                  cloudStatus.status === 'active' ? 'bg-primary pulse-dot' : 'bg-destructive pulse-dot'
                }`} data-testid="cloud-status-indicator" />
                <span className={`text-xs font-medium mono ${
                  cloudStatus.status === 'active' ? 'text-primary' : 'text-destructive'
                }`}>
                  {cloudStatus.status === 'active' ? 'Active' : 'Warning'}
                </span>
              </div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground mono">
              {cloudStatus.region} • {cloudStatus.uptime}% uptime
            </div>
          </div>
        )}
        
        <nav className="space-y-1 px-3" data-testid="navigation">
          {navigation.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto" data-testid="main-content">
        <Outlet />
      </main>
    </div>
  );
}