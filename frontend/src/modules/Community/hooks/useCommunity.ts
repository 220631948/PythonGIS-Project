/**
 * useCommunity Hook
 *
 * Manages community engagement data and actions
 */

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../../lib/api';
import type {
  Issue,
  Poll,
  Feedback,
  CommunityStats,
  IssueReport,
  FeedbackSubmission
} from '../../../types/api-2026';

interface UseCommunityReturn {
  issues: Issue[];
  polls: Poll[];
  feedback: Feedback[];
  stats: CommunityStats | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  reportIssue: (issue: IssueReport) => Promise<Issue>;
  uploadIssuePhoto: (issueId: string, file: File) => Promise<void>;
  submitFeedback: (feedback: FeedbackSubmission) => Promise<void>;
  voteOnPoll: (pollId: string, optionId: string, voterId: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

export function useCommunity(): UseCommunityReturn {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch issues
  const fetchIssues = useCallback(async () => {
    try {
      const data = await apiClient.community.getIssuesList() as any;
      if (data && Array.isArray(data.issues)) {
        setIssues(data.issues);
      }
    } catch (err: any) {
      console.error('Failed to fetch issues:', err);
    }
  }, []);

  // Fetch polls
  const fetchPolls = useCallback(async () => {
    try {
      const data = await apiClient.community.getPollsList('active') as any;
      if (data && Array.isArray(data.polls)) {
        setPolls(data.polls);
      }
    } catch (err: any) {
      console.error('Failed to fetch polls:', err);
    }
  }, []);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const data = await apiClient.community.getStats() as CommunityStats;
      setStats(data);
    } catch (err: any) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshData();
  }, []);

  // Refresh all data
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchIssues(),
        fetchPolls(),
        fetchStats()
      ]);
    } catch (err: any) {
      setError(err.message || 'Failed to load community data');
    } finally {
      setIsLoading(false);
    }
  }, [fetchIssues, fetchPolls, fetchStats]);

  // Report issue
  const reportIssue = useCallback(async (issue: IssueReport): Promise<Issue> => {
    try {
      const result = await apiClient.community.reportIssue(issue) as any;
      if (result && result.issue) {
        setIssues(prev => [result.issue, ...prev]);
        await fetchStats();
        return result.issue;
      }
      throw new Error('Invalid response from server');
    } catch (err: any) {
      console.error('Failed to report issue:', err);
      throw err;
    }
  }, [fetchStats]);

  // Upload issue photo
  const uploadIssuePhoto = useCallback(async (issueId: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      await apiClient.community.uploadIssuePhoto(issueId, formData);

      // Update issue with new photo
      await fetchIssues();
    } catch (err: any) {
      console.error('Failed to upload photo:', err);
      throw err;
    }
  }, [fetchIssues]);

  // Submit feedback
  const submitFeedback = useCallback(async (feedbackData: FeedbackSubmission) => {
    try {
      await apiClient.community.submitFeedback(feedbackData);
      await fetchStats();
    } catch (err: any) {
      console.error('Failed to submit feedback:', err);
      throw err;
    }
  }, [fetchStats]);

  // Vote on poll
  const voteOnPoll = useCallback(async (
    pollId: string,
    optionId: string,
    voterId: string
  ) => {
    try {
      const result = await apiClient.community.voteOnPoll(pollId, optionId, voterId) as any;

      // Update poll in state
      setPolls(prev =>
        prev.map(poll =>
          poll.id === pollId
            ? { ...poll, ...result.poll }
            : poll
        )
      );

      await fetchStats();
    } catch (err: any) {
      console.error('Failed to vote on poll:', err);
      throw err;
    }
  }, [fetchStats]);

  return {
    issues,
    polls,
    feedback,
    stats,
    isLoading,
    error,
    reportIssue,
    uploadIssuePhoto,
    submitFeedback,
    voteOnPoll,
    refreshData
  };
}
