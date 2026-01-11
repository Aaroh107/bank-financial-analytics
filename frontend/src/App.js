import { useEffect, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import TransactionAnalytics from "./pages/TransactionAnalytics";
import FraudDetection from "./pages/FraudDetection";
import CustomerAnalytics from "./pages/CustomerAnalytics";
import RiskAssessment from "./pages/RiskAssessment";
import ProcessingMonitor from "./pages/ProcessingMonitor";
import Layout from "./components/Layout";

function App() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="transactions" element={<TransactionAnalytics />} />
            <Route path="fraud" element={<FraudDetection />} />
            <Route path="customers" element={<CustomerAnalytics />} />
            <Route path="risk" element={<RiskAssessment />} />
            <Route path="monitor" element={<ProcessingMonitor />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;