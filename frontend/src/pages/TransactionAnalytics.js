import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function TransactionAnalytics() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get(`${API}/transactions?limit=50`);
      setTransactions(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" data-testid="loading-state">
        <div className="text-muted-foreground">Loading transactions...</div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8" data-testid="transactions-page">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold heading tracking-tight" data-testid="page-title">Transaction Analytics</h1>
        <p className="text-muted-foreground mt-2">Detailed transaction history and patterns</p>
      </div>

      <Card data-testid="transactions-table-card">
        <CardHeader>
          <CardTitle className="heading">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="transactions-table">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Transaction ID</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Customer</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Amount</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Type</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Merchant</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Category</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Fraud Score</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Location</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn, index) => (
                  <tr key={txn.id} className="border-b border-border table-row" data-testid={`transaction-row-${index}`}>
                    <td className="py-3 px-4 mono text-xs">{txn.id}</td>
                    <td className="py-3 px-4 mono text-xs">{txn.customer_id}</td>
                    <td className="py-3 px-4 mono font-medium">${txn.amount.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <Badge variant={txn.transaction_type === 'credit' ? 'default' : 'secondary'}>
                        {txn.transaction_type}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">{txn.merchant}</td>
                    <td className="py-3 px-4">{txn.category}</td>
                    <td className="py-3 px-4">
                      <span className={`mono font-medium ${
                        txn.fraud_score > 70 ? 'text-destructive' : 
                        txn.fraud_score > 40 ? 'text-chart-3' : 'text-primary'
                      }`}>
                        {txn.fraud_score.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{txn.location}</td>
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