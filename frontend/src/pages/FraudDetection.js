import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function FraudDetection() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await axios.get(`${API}/fraud/alerts`);
      setAlerts(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching fraud alerts:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" data-testid="loading-state">
        <div className="text-muted-foreground">Loading fraud alerts...</div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8" data-testid="fraud-page">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold heading tracking-tight flex items-center gap-3" data-testid="page-title">
          <AlertTriangle className="w-10 h-10 text-destructive" />
          Fraud Detection
        </h1>
        <p className="text-muted-foreground mt-2">Real-time anomaly detection and suspicious activity monitoring</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8" data-testid="alert-stats">
        <Card className="glow-red">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">High Priority Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mono text-destructive" data-testid="high-priority-count">
              {alerts.filter(a => a.fraud_score > 85).length}
            </div>
          </CardContent>
        </Card>
        <Card className="glow-amber">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Medium Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mono text-chart-3" data-testid="medium-priority-count">
              {alerts.filter(a => a.fraud_score > 70 && a.fraud_score <= 85).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mono text-primary" data-testid="total-alerts-count">{alerts.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="fraud-alerts-card">
        <CardHeader>
          <CardTitle className="heading">Active Fraud Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4" data-testid="alerts-list">
            {alerts.map((alert, index) => (
              <div
                key={alert.transaction_id}
                className="p-4 rounded-lg border border-border bg-card/50 table-row"
                data-testid={`alert-item-${index}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className={`w-5 h-5 ${
                      alert.fraud_score > 85 ? 'text-destructive' : 'text-chart-3'
                    }`} />
                    <div>
                      <div className="text-sm font-medium mono">{alert.transaction_id}</div>
                      <div className="text-xs text-muted-foreground mono">{alert.customer_id}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold mono">${alert.amount.toLocaleString()}</div>
                    <Badge variant="destructive" className="mt-1">
                      Score: {alert.fraud_score.toFixed(1)}
                    </Badge>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">{alert.reason}</div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">
                    {new Date(alert.timestamp).toLocaleString()}
                  </span>
                  <Badge variant="outline">{alert.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}