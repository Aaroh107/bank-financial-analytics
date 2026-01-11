import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COLORS = ['#22C55E', '#3B82F6', '#F59E0B'];

export default function CustomerAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [analyticsRes, customersRes] = await Promise.all([
        axios.get(`${API}/customers/analytics`),
        axios.get(`${API}/customers?limit=20`)
      ]);
      setAnalytics(analyticsRes.data);
      setCustomers(customersRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching customer analytics:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" data-testid="loading-state">
        <div className="text-muted-foreground">Loading customer analytics...</div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8" data-testid="customers-page">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold heading tracking-tight" data-testid="page-title">Customer Analytics</h1>
        <p className="text-muted-foreground mt-2">Customer segmentation and behavior insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8" data-testid="analytics-charts">
        {/* Segment Distribution */}
        <Card data-testid="segment-distribution-card">
          <CardHeader>
            <CardTitle className="heading">Customer Segments</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics?.segment_distribution || []}
                  dataKey="count"
                  nameKey="segment"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.segment}: ${entry.count}`}
                >
                  {analytics?.segment_distribution?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181B', border: '1px solid #27272A', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Risk Distribution */}
        <Card data-testid="risk-distribution-card">
          <CardHeader>
            <CardTitle className="heading">Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics?.risk_distribution || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                <XAxis dataKey="risk_level" stroke="#71717A" style={{ fontSize: '12px' }} />
                <YAxis stroke="#71717A" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181B', border: '1px solid #27272A', borderRadius: '8px' }}
                />
                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Customer List */}
      <Card data-testid="customers-table-card">
        <CardHeader>
          <CardTitle className="heading">Customer Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="customers-table">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Customer ID</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Name</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Email</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Balance</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Segment</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Risk Level</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer, index) => (
                  <tr key={customer.id} className="border-b border-border table-row" data-testid={`customer-row-${index}`}>
                    <td className="py-3 px-4 mono text-xs">{customer.id}</td>
                    <td className="py-3 px-4">{customer.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{customer.email}</td>
                    <td className="py-3 px-4 mono font-medium">${customer.account_balance.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        customer.segment === 'Premium' ? 'bg-primary/10 text-primary' :
                        customer.segment === 'Standard' ? 'bg-chart-2/10 text-chart-2' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {customer.segment}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        customer.risk_level === 'High' ? 'bg-destructive/10 text-destructive' :
                        customer.risk_level === 'Medium' ? 'bg-chart-3/10 text-chart-3' :
                        'bg-primary/10 text-primary'
                      }`}>
                        {customer.risk_level}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}