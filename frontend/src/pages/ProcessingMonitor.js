import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Zap, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ProcessingMonitor() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await axios.get(`${API}/spark/jobs`);
      setJobs(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching Spark jobs:', error);
      setLoading(false);
    }
  };

  const triggerJob = async (jobName) => {
    try {
      await axios.post(`${API}/spark/jobs/trigger?job_name=${jobName}`);
      toast.success(`${jobName} triggered successfully`);
      fetchJobs();
    } catch (error) {
      console.error('Error triggering job:', error);
      toast.error('Failed to trigger job');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" data-testid="loading-state">
        <div className="text-muted-foreground">Loading processing monitor...</div>
      </div>
    );
  }

  const jobTypes = [
    'Transaction Aggregation',
    'Fraud Detection',
    'Customer Segmentation',
    'Risk Analysis'
  ];

  return (
    <div className="p-6 md:p-8" data-testid="monitor-page">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold heading tracking-tight" data-testid="page-title">Processing Monitor</h1>
        <p className="text-muted-foreground mt-2">PySpark job monitoring and SQL query tracking</p>
      </div>

      {/* Trigger Jobs */}
      <Card className="mb-8" data-testid="trigger-jobs-card">
        <CardHeader>
          <CardTitle className="heading">Trigger PySpark Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3" data-testid="job-triggers">
            {jobTypes.map((jobType) => (
              <Button
                key={jobType}
                onClick={() => triggerJob(jobType)}
                className="flex items-center gap-2"
                data-testid={`trigger-${jobType.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <Zap className="w-4 h-4" />
                {jobType}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Jobs */}
      <Card data-testid="active-jobs-card">
        <CardHeader>
          <CardTitle className="heading flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Active & Recent Jobs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="text-center text-muted-foreground py-8" data-testid="no-jobs-message">
              No jobs running. Trigger a job to see activity.
            </div>
          ) : (
            <div className="space-y-4" data-testid="jobs-list">
              {jobs.map((job, index) => (
                <div
                  key={job.job_id}
                  className="p-4 rounded-lg border border-border bg-card/50 table-row"
                  data-testid={`job-item-${index}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {job.status === 'running' ? (
                        <Activity className="w-5 h-5 text-primary pulse-dot" />
                      ) : job.status === 'completed' ? (
                        <CheckCircle className="w-5 h-5 text-primary" />
                      ) : (
                        <Clock className="w-5 h-5 text-chart-3" />
                      )}
                      <div>
                        <div className="font-medium">{job.job_name}</div>
                        <div className="text-xs text-muted-foreground mono">{job.job_id}</div>
                      </div>
                    </div>
                    <Badge
                      variant={job.status === 'completed' ? 'default' : 'secondary'}
                      data-testid={`job-status-${index}`}
                    >
                      {job.status}
                    </Badge>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Progress</span>
                      <span className="text-xs mono font-medium">{job.progress.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${job.progress}%` }}
                        data-testid={`job-progress-${index}`}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Started: {new Date(job.started_at).toLocaleTimeString()}</span>
                    {job.duration && <span>Duration: {job.duration}s</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}