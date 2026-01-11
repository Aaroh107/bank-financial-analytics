import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { AlertTriangle } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function RiskAssessment() {
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRiskData();
  }, []);

  const fetchRiskData = async () => {
    try {
      const response = await axios.get(`${API}/risk/assessment`);
      setRiskData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching risk assessment:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" data-testid="loading-state">
        <div className="text-muted-foreground">Loading risk assessment...</div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8" data-testid="risk-page">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold heading tracking-tight" data-testid="page-title">Risk Assessment</h1>
        <p className="text-muted-foreground mt-2">Comprehensive risk analysis and scoring</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8" data-testid="risk-summary">
        {riskData?.risk_metrics?.map((risk, index) => (
          <Card
            key={risk.risk_level}
            className={risk.risk_level === 'High' ? 'glow-red' : risk.risk_level === 'Medium' ? 'glow-amber' : 'glow-green'}
            data-testid={`risk-card-${index}`}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {risk.risk_level} Risk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-muted-foreground">Transactions</div>
                  <div className="text-2xl font-bold mono" data-testid={`transactions-${risk.risk_level.toLowerCase()}`}>
                    {risk.transaction_count.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Avg Fraud Score</div>
                  <div className={`text-xl font-bold mono ${
                    risk.risk_level === 'High' ? 'text-destructive' :
                    risk.risk_level === 'Medium' ? 'text-chart-3' : 'text-primary'
                  }`}>
                    {risk.avg_fraud_score}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Total Volume</div>
                  <div className="text-lg font-medium mono">${risk.total_amount.toLocaleString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card data-testid="risk-chart-card">
        <CardHeader>
          <CardTitle className="heading">Risk Analysis by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={riskData?.risk_metrics || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
              <XAxis dataKey="risk_level" stroke="#71717A" style={{ fontSize: '12px' }} />
              <YAxis stroke="#71717A" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#18181B', border: '1px solid #27272A', borderRadius: '8px' }}
              />
              <Bar dataKey="transaction_count" fill="#22C55E" radius={[4, 4, 0, 0]} />
              <Bar dataKey="avg_fraud_score" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}