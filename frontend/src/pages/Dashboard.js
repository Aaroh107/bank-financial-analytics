import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, AlertTriangle, DollarSign, Activity, Shield } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, analyticsRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/transactions/analytics`)
      ]);
      setStats(statsRes.data);
      setAnalytics(analyticsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" data-testid="loading-state">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  const statCards = [
    { title: "Total Transactions", value: stats?.total_transactions.toLocaleString(), icon: Activity, color: "text-primary" },
    { title: "Transaction Volume", value: `$${stats?.total_volume.toLocaleString()}`, icon: DollarSign, color: "text-chart-2" },
    { title: "Active Customers", value: stats?.active_customers.toLocaleString(), icon: Users, color: "text-chart-3" },
    { title: "Fraud Alerts", value: stats?.fraud_alerts, icon: Shield, color: "text-destructive" },
    { title: "Avg Transaction", value: `$${stats?.avg_transaction.toLocaleString()}`, icon: TrendingUp, color: "text-primary" },
    { title: "High Risk Accounts", value: stats?.high_risk_accounts, icon: AlertTriangle, color: "text-chart-3" },
  ];

  return (
    <div className="p-6 md:p-8" data-testid="dashboard-page">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold heading tracking-tight" data-testid="page-title">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-2">Real-time banking analytics and insights</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8" data-testid="stats-grid">
        {statCards.map((card, index) => (
          <Card key={index} className="stat-card" data-testid={`stat-card-${index}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold mono ${card.color}`} data-testid={`stat-value-${index}`}>{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid="charts-grid">
        {/* Transaction Trends */}
        <Card data-testid="transaction-trends-card">
          <CardHeader>
            <CardTitle className="heading">Transaction Trends (30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics?.daily_trends || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                <XAxis dataKey="date" stroke="#71717A" style={{ fontSize: '12px' }} />
                <YAxis stroke="#71717A" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181B', border: '1px solid #27272A', borderRadius: '8px' }}
                  labelStyle={{ color: '#FAFAFA' }}
                />
                <Line type="monotone" dataKey="count" stroke="#22C55E" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card data-testid="category-breakdown-card">
          <CardHeader>
            <CardTitle className="heading">Transaction Volume by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics?.category_breakdown || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                <XAxis dataKey="category" stroke="#71717A" style={{ fontSize: '11px' }} />
                <YAxis stroke="#71717A" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181B', border: '1px solid #27272A', borderRadius: '8px' }}
                  labelStyle={{ color: '#FAFAFA' }}
                />
                <Bar dataKey="volume" fill="#22C55E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}