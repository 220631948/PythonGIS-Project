import { BaseAPI } from '../core';
import { API_BASE_URL } from '../config';

export class CommunityService extends BaseAPI {
    submitFeedback(feedback: unknown) {
        return this.post('/api/community/feedback/submit', feedback);
    }

    getFeedbackList(proposalId?: string, page = 1) {
        let url = `/api/community/feedback/list?page=${page}`;
        if (proposalId) url += `&proposal_id=${proposalId}`;
        return this.get(url);
    }

    reportIssue(issue: unknown) {
        return this.post('/api/community/issues/report', issue);
    }

    uploadIssuePhoto(issueId: string, formData: FormData) {
        return fetch(`${API_BASE_URL}/api/community/issues/upload-photo?issue_id=${issueId}`, {
            method: 'POST',
            body: formData
        });
    }

    getIssuesList(category?: string, status?: string, page = 1) {
        let url = `/api/community/issues/list?page=${page}`;
        if (category) url += `&category=${category}`;
        if (status) url += `&status=${status}`;
        return this.get(url);
    }

    voteOnPoll(pollId: string, optionId: string, voterId: string) {
        return this.post('/api/community/polls/vote', {
            poll_id: pollId,
            option_id: optionId,
            voter_id: voterId
        });
    }

    getPollsList(status = 'active') {
        return this.get(`/api/community/polls/list?status=${status}`);
    }

    contributeData(contribution: unknown) {
        return this.post('/api/community/contribute/data', contribution);
    }

    getContributionsList(status?: string) {
        let url = '/api/community/contribute/list';
        if (status) url += `?status=${status}`;
        return this.get(url);
    }

    getStats() {
        return this.get('/api/community/stats');
    }
}
