import React, { useState, useEffect } from 'react';
import apiClient from '../api-client';

/**
 * DataStatusPanel - Displays the health and status of open data sources
 * Shows real-time availability, data freshness, and error logs
 */
const DataStatusPanel = ({ isOpen, onClose }) => {
    const [healthData, setHealthData] = useState(null);
    const [retrievalLog, setRetrievalLog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('health');

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen]);

    const loadData = async () => {
        setLoading(true);
        setError(null);

        try {
            const [health, log] = await Promise.all([
                apiClient.getDataSourcesHealth(),
                apiClient.getRetrievalLog(20)
            ]);
            setHealthData(health);
            setRetrievalLog(log);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const getStatusColor = (accessible) => {
        return accessible ? '#10b981' : '#ef4444';
    };

    const getStatusBadge = (status) => {
        const colors = {
            ok: { bg: '#d1fae5', text: '#065f46' },
            error: { bg: '#fee2e2', text: '#991b1b' },
            pending: { bg: '#fef3c7', text: '#92400e' }
        };
        const style = colors[status] || colors.pending;

        return (
            <span style={{
                backgroundColor: style.bg,
                color: style.text,
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '500'
            }}>
                {status.toUpperCase()}
            </span>
        );
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: '450px',
            height: '100vh',
            backgroundColor: '#fff',
            boxShadow: '-4px 0 20px rgba(0,0,0,0.15)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header */}
            <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#f9fafb'
            }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                        📊 Data Source Status
                    </h2>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b7280' }}>
                        Real open data from official sources
                    </p>
                </div>
                <button
                    onClick={onClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '24px',
                        cursor: 'pointer',
                        color: '#6b7280'
                    }}
                >
                    ×
                </button>
            </div>

            {/* Tabs */}
            <div style={{
                display: 'flex',
                borderBottom: '1px solid #e5e7eb'
            }}>
                {['health', 'log'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            flex: 1,
                            padding: '12px',
                            border: 'none',
                            backgroundColor: activeTab === tab ? '#fff' : '#f9fafb',
                            borderBottom: activeTab === tab ? '2px solid #3b82f6' : 'none',
                            cursor: 'pointer',
                            fontWeight: activeTab === tab ? '600' : '400'
                        }}
                    >
                        {tab === 'health' ? '🟢 Source Health' : '📋 Retrieval Log'}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
                {loading && (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <div className="spinner" style={{ margin: '0 auto 16px' }}>⏳</div>
                        <p>Checking data sources...</p>
                    </div>
                )}

                {error && (
                    <div style={{
                        backgroundColor: '#fee2e2',
                        color: '#991b1b',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '16px'
                    }}>
                        ⚠️ Error: {error}
                    </div>
                )}

                {!loading && activeTab === 'health' && healthData && (
                    <>
                        {/* Summary */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '12px',
                            marginBottom: '20px'
                        }}>
                            <div style={{
                                backgroundColor: '#d1fae5',
                                padding: '12px',
                                borderRadius: '8px',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#065f46' }}>
                                    {healthData.summary.accessible}
                                </div>
                                <div style={{ fontSize: '12px', color: '#065f46' }}>Available</div>
                            </div>
                            <div style={{
                                backgroundColor: '#fee2e2',
                                padding: '12px',
                                borderRadius: '8px',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#991b1b' }}>
                                    {healthData.summary.unavailable}
                                </div>
                                <div style={{ fontSize: '12px', color: '#991b1b' }}>Unavailable</div>
                            </div>
                            <div style={{
                                backgroundColor: '#dbeafe',
                                padding: '12px',
                                borderRadius: '8px',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e40af' }}>
                                    {healthData.summary.health_percentage}%
                                </div>
                                <div style={{ fontSize: '12px', color: '#1e40af' }}>Health</div>
                            </div>
                        </div>

                        {/* Source List */}
                        <div>
                            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
                                Data Sources ({healthData.summary.total_sources})
                            </h3>
                            {Object.entries(healthData.sources).map(([name, status]) => (
                                <div
                                    key={name}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '10px 12px',
                                        backgroundColor: '#f9fafb',
                                        borderRadius: '6px',
                                        marginBottom: '8px',
                                        borderLeft: `4px solid ${getStatusColor(status.accessible)}`
                                    }}
                                >
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '500', fontSize: '13px' }}>
                                            {name.replace(/_/g, ' ')}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#6b7280' }}>
                                            {status.url?.substring(0, 50)}...
                                        </div>
                                    </div>
                                    <div>
                                        {getStatusBadge(status.status)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {!loading && activeTab === 'log' && retrievalLog && (
                    <>
                        {/* Statistics */}
                        <div style={{
                            backgroundColor: '#f9fafb',
                            padding: '12px',
                            borderRadius: '8px',
                            marginBottom: '16px'
                        }}>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                Success Rate: <strong>{retrievalLog.statistics.success_rate}%</strong>
                                {' '} | Total: {retrievalLog.statistics.total_recorded}
                                {' '} | Failed: {retrievalLog.statistics.failed}
                            </div>
                        </div>

                        {/* Log Entries */}
                        <div>
                            {retrievalLog.entries.map((entry, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        padding: '10px 12px',
                                        backgroundColor: entry.success ? '#f0fdf4' : '#fef2f2',
                                        borderRadius: '6px',
                                        marginBottom: '8px',
                                        borderLeft: `4px solid ${entry.success ? '#10b981' : '#ef4444'}`
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <strong style={{ fontSize: '13px' }}>
                                            {entry.dataset}
                                        </strong>
                                        <span style={{ fontSize: '11px', color: '#6b7280' }}>
                                            {new Date(entry.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                                        {entry.message}
                                    </div>
                                </div>
                            ))}
                            {retrievalLog.entries.length === 0 && (
                                <p style={{ color: '#6b7280', textAlign: 'center' }}>
                                    No retrieval logs yet
                                </p>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Footer */}
            <div style={{
                padding: '12px 16px',
                borderTop: '1px solid #e5e7eb',
                backgroundColor: '#f9fafb',
                fontSize: '11px',
                color: '#6b7280'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>
                        🔒 All data from official open data portals
                    </span>
                    <button
                        onClick={loadData}
                        style={{
                            padding: '6px 12px',
                            backgroundColor: '#3b82f6',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                        }}
                    >
                        🔄 Refresh
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DataStatusPanel;
