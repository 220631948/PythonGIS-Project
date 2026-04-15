/**
 * PollVoting Component
 *
 * Display and vote on municipal polls and initiatives
 * with real-time results visualization
 */

import React, { useState } from 'react';
import {
  X,
  Vote,
  CheckCircle,
  Clock,
  Users,
  MapPin,
  TrendingUp,
  Info
} from 'lucide-react';
import type { Poll } from '../../../types/api-2026';

interface PollVotingProps {
  isOpen: boolean;
  onClose: () => void;
  polls: Poll[];
  onVote: (pollId: string, optionId: string, voterId: string) => Promise<void>;
  userId?: string;
}

export default function PollVoting({
  isOpen,
  onClose,
  polls,
  onVote,
  userId = 'anonymous_' + Date.now()
}: PollVotingProps) {
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [votedPolls, setVotedPolls] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const handleVote = async () => {
    if (!selectedPoll || !selectedOption) return;

    setIsVoting(true);
    setError(null);

    try {
      await onVote(selectedPoll.id, selectedOption, userId);
      setVotedPolls(prev => new Set(prev).add(selectedPoll.id));
      setSelectedOption(null);

      // Show success message
      setTimeout(() => {
        setSelectedPoll(null);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit vote');
    } finally {
      setIsVoting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculatePercentage = (votes: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((votes / total) * 100);
  };

  const hasVoted = (pollId: string) => votedPolls.has(pollId);

  if (!isOpen) return null;

  return (
    <div className="poll-voting-overlay" onClick={onClose}>
      <div className="poll-voting-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>
            <Vote size={24} />
            Community Polls
          </h2>
          <button onClick={onClose} className="close-btn" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-content">
          {!selectedPoll ? (
            /* Poll List */
            <div className="polls-list">
              {polls.length === 0 ? (
                <div className="empty-state">
                  <Vote size={48} className="empty-icon" />
                  <h3>No Active Polls</h3>
                  <p>There are currently no polls available for voting</p>
                </div>
              ) : (
                <div className="poll-cards">
                  {polls.map(poll => {
                    const voted = hasVoted(poll.id);
                    const isActive = poll.status === 'active';

                    return (
                      <div
                        key={poll.id}
                        className={`poll-card ${!isActive ? 'closed' : ''} ${voted ? 'voted' : ''}`}
                        onClick={() => isActive && setSelectedPoll(poll)}
                      >
                        <div className="poll-header">
                          <h3 className="poll-title">{poll.title}</h3>
                          {voted && (
                            <span className="voted-badge">
                              <CheckCircle size={14} />
                              Voted
                            </span>
                          )}
                        </div>

                        <p className="poll-description">{poll.description}</p>

                        <div className="poll-meta">
                          <div className="meta-item">
                            <Users size={14} />
                            <span>{poll.total_votes} votes</span>
                          </div>

                          <div className="meta-item">
                            <Clock size={14} />
                            <span>Ends {formatDate(poll.end_date)}</span>
                          </div>

                          {poll.location && (
                            <div className="meta-item">
                              <MapPin size={14} />
                              <span>Location-specific</span>
                            </div>
                          )}
                        </div>

                        {!isActive && (
                          <div className="poll-status closed">
                            Poll Closed
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Poll Detail & Voting */
            <div className="poll-detail">
              <button
                onClick={() => {
                  setSelectedPoll(null);
                  setSelectedOption(null);
                  setError(null);
                }}
                className="back-btn"
              >
                ← Back to Polls
              </button>

              <div className="poll-content">
                <h2 className="poll-title-large">{selectedPoll.title}</h2>
                <p className="poll-description-large">{selectedPoll.description}</p>

                <div className="poll-info-bar">
                  <div className="info-item">
                    <Users size={16} />
                    <span>{selectedPoll.total_votes} total votes</span>
                  </div>
                  <div className="info-item">
                    <Clock size={16} />
                    <span>Ends {formatDate(selectedPoll.end_date)}</span>
                  </div>
                </div>

                {error && (
                  <div className="error-banner">
                    <Info size={16} />
                    <span>{error}</span>
                    <button onClick={() => setError(null)} aria-label="Dismiss error" title="Dismiss error"><X size={16} /></button>
                  </div>
                )}

                {/* Options */}
                <div className="poll-options">
                  {selectedPoll.options.map(option => {
                    const percentage = calculatePercentage(
                      option.votes,
                      selectedPoll.total_votes
                    );
                    const isSelected = selectedOption === option.id;
                    const voted = hasVoted(selectedPoll.id);

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => !voted && setSelectedOption(option.id)}
                        disabled={voted || isVoting}
                        className={`poll-option ${isSelected ? 'selected' : ''} ${voted ? 'voted' : ''}`}
                      >
                        <div className="option-content">
                          <div className="option-header">
                            <span className="option-text">{option.text}</span>
                            {voted && (
                              <span className="option-percentage">{percentage}%</span>
                            )}
                          </div>

                          {voted && (
                            <div className="option-bar-container">
                              <div
                                className="option-bar"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          )}

                          {voted && (
                            <div className="option-votes">
                              {option.votes} {option.votes === 1 ? 'vote' : 'votes'}
                            </div>
                          )}
                        </div>

                        {isSelected && !voted && (
                          <CheckCircle size={20} className="selected-icon" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Vote Button */}
                {!hasVoted(selectedPoll.id) && (
                  <div className="vote-actions">
                    <button
                      onClick={handleVote}
                      disabled={!selectedOption || isVoting}
                      className="btn-primary btn-large"
                    >
                      {isVoting ? (
                        <>
                          <span className="spinner-sm" />
                          Submitting Vote...
                        </>
                      ) : (
                        <>
                          <Vote size={20} />
                          Cast Your Vote
                        </>
                      )}
                    </button>
                  </div>
                )}

                {hasVoted(selectedPoll.id) && (
                  <div className="vote-success">
                    <CheckCircle size={32} className="success-icon" />
                    <h3>Thank you for voting!</h3>
                    <p>Your voice helps shape our community</p>
                  </div>
                )}

                {/* Poll Stats */}
                {hasVoted(selectedPoll.id) && (
                  <div className="poll-stats">
                    <h4>
                      <TrendingUp size={18} />
                      Poll Statistics
                    </h4>
                    <div className="stats-grid">
                      <div className="stat-card">
                        <span className="stat-value">{selectedPoll.total_votes}</span>
                        <span className="stat-label">Total Votes</span>
                      </div>
                      <div className="stat-card">
                        <span className="stat-value">
                          {selectedPoll.options.reduce((max, opt) =>
                            opt.votes > max.votes ? opt : max
                          ).text}
                        </span>
                        <span className="stat-label">Leading Option</span>
                      </div>
                      <div className="stat-card">
                        <span className="stat-value">
                          {Math.max(...selectedPoll.options.map(opt =>
                            calculatePercentage(opt.votes, selectedPoll.total_votes)
                          ))}%
                        </span>
                        <span className="stat-label">Top Percentage</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
