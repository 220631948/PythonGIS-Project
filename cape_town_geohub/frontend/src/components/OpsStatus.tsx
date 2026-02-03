import React, { useEffect, useState } from 'react';
import { Activity, Server, Database, ShieldCheck } from 'lucide-react';
import '../styles/OpsStatus.css';

interface SystemHealth {
  api: boolean;
  database: boolean;
  latency: number;
}

const OpsStatus: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth>({
    api: false,
    database: false,
    latency: 0,
  });

  const checkHealth = async () => {
    const start = Date.now();
    try {
      // In a real scenario, this would hit the /health endpoint
      // For this demo/local mode without backend, we simulate a check
      const response = await fetch('/api/health', { method: 'GET', signal: AbortSignal.timeout(2000) });
      const end = Date.now();
      
      if (response.ok) {
        setHealth({
           api: true,
           database: true, // Assumed if API is up for this demo
           latency: end - start
        });
      } else {
        throw new Error('API Error');
      }
    } catch (error) {
      console.warn('OpsStatus health check failed:', error);
      setHealth({
        api: false,
        database: false,
        latency: 0
      });
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="ops-status-card">
      <div className="ops-header">
        <ShieldCheck size={18} className="ops-icon-main" />
        <h4>System Operations</h4>
      </div>
      
      <div className="ops-grid">
        <div className={`ops-item ${health.api ? 'status-ok' : 'status-err'}`}>
          <Server size={14} />
          <span>API Gateway</span>
          <div className="status-indicator"></div>
        </div>

        <div className={`ops-item ${health.database ? 'status-ok' : 'status-err'}`}>
          <Database size={14} />
          <span>PostGIS Cluster</span>
          <div className="status-indicator"></div>
        </div>

        <div className="ops-metrics">
          <Activity size={14} />
          <span>Latency: {health.api ? `${health.latency}ms` : '--'}</span>
        </div>
      </div>
    </div>
  );
};

export default OpsStatus;
