/**
 * CommunityDashboard Component
 *
 * Overview of community engagement statistics and recent activity
 */

import React from 'react';
import {
  Users,
  MessageSquare,
  AlertCircle,
  Vote,
  TrendingUp,
  Clock,
  CheckCircle,
  BarChart3
} from 'lucide-react';
import type { CommunityStats, Issue, Poll } from '../../../types/api-2026';

interface CommunityDashboardProps {
  stats: CommunityStats | null;
  recentIssues: Issue[];
  activePolls: Poll[];
  isLoading: boolean;
}

export default function CommunityDashboard({
  stats,
  recentIssues,
  activePolls,
  isLoading
}: CommunityDashboardProps) {
  if (isLoading) {
    return (
      <div className="community-dashboard loading">
        <div className="spinner-lg" />
        <p>Loading community data...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="community-dashboard empty">
        <Users size={48} className="empty-icon" />
        <h3>No Community Data</h3>
        <p>Start engaging with your community!</p>
      </div>
    );
  }

  const issueResolutionRate = stats.total_issues > 0
    ? Math.round(((stats.issues_by_status.resolved || 0) / stats.total_issues) * 100)
    : 0;

  return (
    <div className="community-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h2>
          <Users size={24} />
          Community Engagement
        </h2>
        <p className="dashboard-subtitle">
          Track community participation and municipal responsiveness
        </p>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon issues">
            <AlertCircle size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-value">{stats.total_issues}</div>
            <div className="metric-label">Issues Reported</div>
          </div>
          <div className="metric-trend positive">
            <TrendingUp size={14} />
            <span>{issueResolutionRate}% resolved</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon feedback">
            <MessageSquare size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-value">{stats.total_feedback}</div>
            <div className="metric-label">Feedback Submissions</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon polls">
            <Vote size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-value">{stats.active_polls}</div>
            <div className="metric-label">Active Polls</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon contributions">
            <TrendingUp size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-value">{stats.total_contributions}</div>
            <div className="metric-label">Data Contributions</div>
          </div>
        </div>
      </div>

      {/* Issues Breakdown */}
      <div className="dashboard-section">
        <h3>
          <BarChart3 size={20} />
          Issues by Category
        </h3>
        <div className="category-bars">
          {Object.entries(stats.issues_by_category).map(([category, count]) => {
            const percentage = (count / stats.total_issues) * 100;

            return (
              <div key={category} className="category-bar-item">
                <div className="category-bar-header">
                  <span className="category-name">
                    {category.replace(/_/g, ' ')}
                  </span>
                  <span className="category-count">{count}</span>
                </div>
                <div className="category-bar-track">
                  <div
                    className="category-bar-fill"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Issues Status */}
      <div className="dashboard-section">
        <h3>
          <Clock size={20} />
          Issue Resolution Status
        </h3>
        <div className="status-grid">
          {Object.entries(stats.issues_by_status).map(([status, count]) => {
            const statusConfig: Record<string, { icon: typeof AlertCircle; color: string; label: string }> = {
              new: { icon: AlertCircle, color: '#3b82f6', label: 'New' },
              acknowledged: { icon: Clock, color: '#f59e0b', label: 'Acknowledged' },
              in_progress: { icon: TrendingUp, color: '#8b5cf6', label: 'In Progress' },
              resolved: { icon: CheckCircle, color: '#10b981', label: 'Resolved' },
              closed: { icon: CheckCircle, color: '#6b7280', label: 'Closed' }
            };

            const defaultConfig = { icon: AlertCircle, color: '#3b82f6', label: 'New' };
            const config = statusConfig[status] ?? defaultConfig;
            const Icon = config.icon;

            return (
              <div key={status} className="status-card">
                <div
                  className="status-icon"
                  style={{ backgroundColor: `${config.color}20`, color: config.color }}
                >
                  <Icon size={20} />
                </div>
                <div className="status-content">
                  <div className="status-value">{count}</div>
                  <div className="status-label">{config.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Issues */}
      {recentIssues.length > 0 && (
        <div className="dashboard-section">
          <h3>Recent Issues</h3>
          <div className="recent-issues-list">
            {recentIssues.slice(0, 5).map(issue => (
              <div key={issue.id} className="recent-issue-item">
                <div className="issue-header">
                  <span className={`issue-category ${issue.category}`}>
                    {issue.category.replace(/_/g, ' ')}
                  </span>
                  <span className={`issue-severity ${issue.severity}`}>
                    {issue.severity}
                  </span>
                </div>
                <h4 className="issue-title">{issue.title}</h4>
                <p className="issue-description">{issue.description}</p>
                <div className="issue-footer">
                  <span className="issue-reference">{issue.reference_number}</span>
                  <span className="issue-date">
                    {new Date(issue.reported_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Polls */}
      {activePolls.length > 0 && (
        <div className="dashboard-section">
          <h3>Active Polls</h3>
          <div className="active-polls-list">
            {activePolls.slice(0, 3).map(poll => (
              <div key={poll.id} className="active-poll-item">
                <h4 className="poll-title">{poll.title}</h4>
                <p className="poll-description">{poll.description}</p>
                <div className="poll-meta">
                  <span className="poll-votes">
                    <Users size={14} />
                    {poll.total_votes} votes
                  </span>
                  <span className="poll-deadline">
                    <Clock size={14} />
                    Ends {new Date(poll.end_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Response Time */}
      {stats.average_resolution_time_days > 0 && (
        <div className="dashboard-section">
          <div className="response-time-card">
            <Clock size={32} className="response-icon" />
            <div className="response-content">
              <div className="response-value">
                {stats.average_resolution_time_days.toFixed(1)} days
              </div>
              <div className="response-label">Average Resolution Time</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
