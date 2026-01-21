import React, { useState, useEffect, useCallback } from 'react';
import {
    Droplets, Building2, GraduationCap, Heart,
    RefreshCw, AlertCircle, CheckCircle, AlertTriangle,
    MapPin, BarChart3
} from 'lucide-react';
import apiClient from '../../api-client';
import { calculateAccessScore, getCentroid, calculateNearestDistance } from '../../lib/spatial/analysis';

/**
 * ServicesModule - Analyzes service access for informal settlements
 * Calculates access scores based on distance to water, sanitation, clinics, schools
 */
const ServicesModule = ({ onHighlightSettlement }) => {
    const [settlements, setSettlements] = useState([]);
    const [facilities, setFacilities] = useState({
        water: null,
        clinics: null,
        schools: null
    });
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedSettlement, setSelectedSettlement] = useState(null);

    // Load data on mount
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError(null);

        try {
            // Load facilities data from backend
            const [waterData, clinicsData, schoolsData, settlementsData] = await Promise.all([
                apiClient.getDatasetGeoJSON('water_facilities').catch(() => null),
                apiClient.getDatasetGeoJSON('clinics').catch(() => null),
                apiClient.getDatasetGeoJSON('schools').catch(() => null),
                apiClient.getDatasetGeoJSON('suburbs').catch(() => null) // Using suburbs as settlement proxy
            ]);

            setFacilities({
                water: waterData,
                clinics: clinicsData,
                schools: schoolsData
            });

            if (settlementsData?.features) {
                setSettlements(settlementsData.features.slice(0, 50)); // Limit for performance
            }
        } catch (err) {
            setError('Failed to load service data. Please try again.');
            console.error('Services data load error:', err);
        } finally {
            setLoading(false);
        }
    };

    const runAnalysis = useCallback(() => {
        if (!settlements.length) {
            setError('No settlement data available for analysis');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const results = settlements.map(settlement => {
                const centroid = getCentroid(settlement);

                const distances = {
                    water: facilities.water ? calculateNearestDistance(centroid, facilities.water) : Infinity,
                    sanitation: facilities.water ? calculateNearestDistance(centroid, facilities.water) : Infinity, // Using water as proxy
                    clinic: facilities.clinics ? calculateNearestDistance(centroid, facilities.clinics) : Infinity,
                    school: facilities.schools ? calculateNearestDistance(centroid, facilities.schools) : Infinity
                };

                const accessResult = calculateAccessScore(distances);

                return {
                    id: settlement.properties?.OBJECTID || settlement.properties?.id || Math.random(),
                    name: settlement.properties?.OFC_SBRB_NAME || settlement.properties?.NAME || 'Unknown',
                    centroid,
                    distances,
                    ...accessResult,
                    feature: settlement
                };
            });

            // Sort by score
            results.sort((a, b) => a.score - b.score);

            // Calculate summary
            const summary = {
                total: results.length,
                high: results.filter(r => r.level === 'HIGH').length,
                medium: results.filter(r => r.level === 'MEDIUM').length,
                low: results.filter(r => r.level === 'LOW').length,
                avgScore: Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
            };

            setAnalysis({ results, summary });
        } catch (err) {
            setError('Analysis failed. Please check data availability.');
            console.error('Analysis error:', err);
        } finally {
            setLoading(false);
        }
    }, [settlements, facilities]);

    const handleSettlementClick = (settlement) => {
        setSelectedSettlement(settlement);
        if (onHighlightSettlement) {
            onHighlightSettlement(settlement);
        }
    };

    const getScoreIcon = (level) => {
        switch (level) {
            case 'HIGH': return <CheckCircle size={16} style={{ color: '#10b981' }} />;
            case 'MEDIUM': return <AlertTriangle size={16} style={{ color: '#f59e0b' }} />;
            case 'LOW': return <AlertCircle size={16} style={{ color: '#ef4444' }} />;
            default: return null;
        }
    };

    return (
        <div className="services-module">
            <div className="module-header" style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Building2 size={20} />
                    Service Access Analysis
                </h3>
                <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#6b7280' }}>
                    Analyze access to water, health, and education services
                </p>
            </div>

            {/* Action Button */}
            <div style={{ padding: '16px' }}>
                <button
                    onClick={runAnalysis}
                    disabled={loading || !settlements.length}
                    style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: loading ? '#9ca3af' : '#3b82f6',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}
                >
                    {loading ? (
                        <>
                            <RefreshCw size={16} className="animate-spin" />
                            Analyzing...
                        </>
                    ) : (
                        <>
                            <BarChart3 size={16} />
                            Analyze Service Access
                        </>
                    )}
                </button>
            </div>

            {/* Error Display */}
            {error && (
                <div style={{
                    margin: '0 16px 16px',
                    padding: '12px',
                    backgroundColor: '#fef2f2',
                    color: '#991b1b',
                    borderRadius: '8px',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {/* Analysis Results */}
            {analysis && (
                <>
                    {/* Summary Cards */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '12px',
                        padding: '0 16px 16px'
                    }}>
                        <div style={{ backgroundColor: '#d1fae5', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#065f46' }}>{analysis.summary.high}</div>
                            <div style={{ fontSize: '11px', color: '#065f46' }}>High Access</div>
                        </div>
                        <div style={{ backgroundColor: '#fef3c7', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#92400e' }}>{analysis.summary.medium}</div>
                            <div style={{ fontSize: '11px', color: '#92400e' }}>Medium Access</div>
                        </div>
                        <div style={{ backgroundColor: '#fee2e2', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#991b1b' }}>{analysis.summary.low}</div>
                            <div style={{ fontSize: '11px', color: '#991b1b' }}>Low Access</div>
                        </div>
                        <div style={{ backgroundColor: '#dbeafe', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e40af' }}>{analysis.summary.avgScore}</div>
                            <div style={{ fontSize: '11px', color: '#1e40af' }}>Avg Score</div>
                        </div>
                    </div>

                    {/* Service Indicators */}
                    <div style={{ padding: '0 16px 16px' }}>
                        <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Services Analyzed</h4>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#3b82f6' }}>
                                <Droplets size={14} /> Water
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#10b981' }}>
                                <Heart size={14} /> Health
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#8b5cf6' }}>
                                <GraduationCap size={14} /> Education
                            </span>
                        </div>
                    </div>

                    {/* Results List */}
                    <div style={{ maxHeight: '300px', overflowY: 'auto', padding: '0 16px' }}>
                        <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                            Areas by Access Level ({analysis.results.length})
                        </h4>
                        {analysis.results.slice(0, 20).map((result) => (
                            <div
                                key={result.id}
                                onClick={() => handleSettlementClick(result)}
                                style={{
                                    padding: '10px 12px',
                                    backgroundColor: selectedSettlement?.id === result.id ? '#eff6ff' : '#f9fafb',
                                    borderRadius: '6px',
                                    marginBottom: '8px',
                                    cursor: 'pointer',
                                    borderLeft: `4px solid ${result.color}`,
                                    transition: 'background-color 0.2s'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {getScoreIcon(result.level)}
                                        <span style={{ fontWeight: '500', fontSize: '13px' }}>{result.name}</span>
                                    </div>
                                    <span style={{
                                        backgroundColor: result.color,
                                        color: '#fff',
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '11px',
                                        fontWeight: '600'
                                    }}>
                                        {result.score}
                                    </span>
                                </div>
                                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                                    Water: {Math.round(result.distances.water)}m |
                                    Clinic: {Math.round(result.distances.clinic)}m |
                                    School: {Math.round(result.distances.school)}m
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Empty State */}
            {!analysis && !loading && (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: '#6b7280' }}>
                    <MapPin size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                    <p style={{ fontSize: '13px', margin: 0 }}>
                        Click "Analyze Service Access" to calculate access scores for settlements
                    </p>
                </div>
            )}
        </div>
    );
};

export default ServicesModule;
