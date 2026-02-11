/**
 * TypeScript Types for Cape Town GeoHub 2026 New Features
 *
 * This file contains all type definitions for the 14 new API modules
 * added in February 2026 (67 new endpoints).
 */

// ==========================================
// 1. 3D VISUALIZATION TYPES
// ==========================================

export interface Building3D {
  type: 'Feature';
  geometry: GeoJSON.Geometry;
  properties: {
    height?: number;
    base_height?: number;
    building_type?: string;
    [key: string]: any;
  };
}

export interface BuildingExtrusionRequest {
  bounds: {
    minLat: number;
    minLng: number;
    maxLat: number;
    maxLng: number;
  };
  height_attribute?: string;
  default_height?: number;
}

export interface ElevationPoint {
  lat: number;
  lng: number;
  elevation: number;
  distance: number;
}

export interface ElevationProfileResponse {
  points: ElevationPoint[];
  total_distance: number;
  elevation_gain: number;
  elevation_loss: number;
  min_elevation: number;
  max_elevation: number;
}

export interface ShadowAnalysisRequest {
  bounds: {
    minLat: number;
    minLng: number;
    maxLat: number;
    maxLng: number;
  };
  datetime: string;
  building_height?: number;
}

export interface ShadowAnalysisResponse {
  shadows: GeoJSON.FeatureCollection;
  sun_elevation: number;
  sun_azimuth: number;
  time: string;
}

export interface ViewshedRequest {
  lat: number;
  lng: number;
  observer_height?: number;
  max_distance?: number;
  resolution?: number;
}

export interface ViewshedResponse {
  visible_area: GeoJSON.FeatureCollection;
  visibility_percentage: number;
  total_area_analyzed: number;
  observer_location: { lat: number; lng: number };
}

// ==========================================
// 2. AI INSIGHTS TYPES
// ==========================================

export interface TrafficPredictionRequest {
  location: { lat: number; lng: number };
  datetime: string;
}

export interface TrafficPredictionResponse {
  traffic_score: number;
  traffic_level: 'low' | 'moderate' | 'high' | 'severe';
  predicted_at: string;
  confidence: number;
  factors: {
    hour_of_day: number;
    day_of_week: number;
    historical_pattern: string;
  };
  alternative_routes: Array<{
    description: string;
    estimated_delay: number;
  }>;
}

export interface CrimeHotspotRequest {
  bounds: {
    minLat: number;
    minLng: number;
    maxLat: number;
    maxLng: number;
  };
  crime_types?: string[];
  time_period?: string;
}

export interface CrimeHotspot {
  location: { lat: number; lng: number };
  intensity: number;
  risk_level: 'low' | 'moderate' | 'high' | 'very_high';
  crime_types: string[];
  incidents_count: number;
}

export interface CrimeHotspotResponse {
  hotspots: CrimeHotspot[];
  heatmap: GeoJSON.FeatureCollection;
  time_period: string;
  total_incidents: number;
}

export interface LandUseChangeRequest {
  bounds: {
    minLat: number;
    minLng: number;
    maxLat: number;
    maxLng: number;
  };
  start_date: string;
  end_date: string;
}

export interface LandUseChangeResponse {
  changes: GeoJSON.FeatureCollection;
  change_summary: {
    total_area_changed: number;
    change_types: Record<string, number>;
  };
  significant_changes: Array<{
    location: { lat: number; lng: number };
    change_type: string;
    area: number;
  }>;
}

export interface NLPQueryRequest {
  query: string;
  context?: Record<string, any>;
}

export interface NLPQueryResponse {
  structured_query: {
    intent: string;
    entities: Record<string, any>;
    filters: Record<string, any>;
  };
  suggested_datasets: string[];
  confidence: number;
  interpretation: string;
}

export interface TrendingPrediction {
  type: 'traffic' | 'crime' | 'land_use' | 'environmental';
  title: string;
  description: string;
  location: { lat: number; lng: number };
  confidence: number;
  timestamp: string;
}

// ==========================================
// 3. COMMUNITY ENGAGEMENT TYPES
// ==========================================

export interface FeedbackSubmission {
  proposal_id: string;
  author_name?: string;
  author_email?: string;
  feedback_text: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  tags?: string[];
}

export interface Feedback {
  id: string;
  proposal_id: string;
  author_name?: string;
  feedback_text: string;
  sentiment?: string;
  tags: string[];
  submitted_at: string;
  upvotes: number;
}

export interface IssueReport {
  title: string;
  description: string;
  category: 'pothole' | 'streetlight' | 'water_leak' | 'illegal_dumping' | 'other';
  location: { lat: number; lng: number };
  severity: 'low' | 'medium' | 'high' | 'critical';
  reporter_name?: string;
  reporter_email?: string;
  reporter_phone?: string;
}

export interface Issue {
  id: string;
  reference_number: string;
  title: string;
  description: string;
  category: string;
  location: { lat: number; lng: number };
  severity: string;
  status: 'new' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed';
  photos: string[];
  reported_at: string;
  updated_at: string;
  reporter_contact?: string;
}

export interface Poll {
  id: string;
  title: string;
  description: string;
  options: Array<{
    id: string;
    text: string;
    votes: number;
  }>;
  total_votes: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'closed';
  location?: { lat: number; lng: number };
}

export interface DataContribution {
  data_type: string;
  description: string;
  geojson?: GeoJSON.FeatureCollection;
  location?: { lat: number; lng: number };
  contributor_name?: string;
  contributor_email?: string;
}

export interface CommunityStats {
  total_feedback: number;
  total_issues: number;
  total_polls: number;
  total_contributions: number;
  issues_by_category: Record<string, number>;
  issues_by_status: Record<string, number>;
  average_resolution_time_days: number;
  active_polls: number;
}

// ==========================================
// 4. NOTIFICATIONS TYPES
// ==========================================

export interface NotificationSubscription {
  user_id: string;
  user_email?: string;
  user_phone?: string;
  alert_types: Array<'traffic' | 'safety' | 'weather' | 'construction' | 'events'>;
  location: { lat: number; lng: number };
  radius_meters: number;
  channels: Array<'push' | 'email' | 'sms'>;
  frequency: 'immediate' | 'daily' | 'weekly';
}

export interface Subscription {
  id: string;
  user_id: string;
  alert_types: string[];
  location: { lat: number; lng: number };
  radius_meters: number;
  channels: string[];
  frequency: string;
  active: boolean;
  created_at: string;
}

export interface Alert {
  id: string;
  alert_type: string;
  title: string;
  message: string;
  location: { lat: number; lng: number };
  radius_meters: number;
  severity: 'info' | 'warning' | 'critical';
  created_at: string;
  expires_at?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: string;
  read: boolean;
  created_at: string;
  action_url?: string;
}

export interface LocationWatch {
  location: { lat: number; lng: number };
  location_name?: string;
  watch_types: Array<'development' | 'zoning' | 'infrastructure'>;
  digest_frequency: 'daily' | 'weekly' | 'monthly';
}

// ==========================================
// 5. DEMOGRAPHICS TYPES
// ==========================================

export interface DensityHeatmapRequest {
  bounds: {
    minLat: number;
    minLng: number;
    maxLat: number;
    maxLng: number;
  };
  resolution?: number;
}

export interface DensityHeatmapResponse {
  heatmap: GeoJSON.FeatureCollection;
  grid_cells: Array<{
    bounds: number[][];
    population: number;
    density: number;
  }>;
  total_population: number;
}

export interface SocioeconomicIndicators {
  area_id: string;
  area_name: string;
  population: number;
  median_income: number;
  unemployment_rate: number;
  education_level: {
    no_schooling: number;
    primary: number;
    secondary: number;
    tertiary: number;
  };
  poverty_rate: number;
  gini_coefficient: number;
  housing_quality: {
    formal: number;
    informal: number;
  };
}

export interface AgeDistribution {
  area_id: string;
  age_groups: Record<string, number>;
  total_population: number;
  vulnerable_population: {
    children_under_5: number;
    elderly_over_65: number;
    disabled: number;
  };
}

// ==========================================
// 6. ENVIRONMENTAL TYPES
// ==========================================

export interface FloodRiskRequest {
  location: { lat: number; lng: number };
  scenario?: 'current' | '2030' | '2050' | '2100';
}

export interface FloodRiskResponse {
  risk_score: number;
  risk_level: 'low' | 'moderate' | 'high' | 'very_high';
  return_period_years: number;
  depth_meters: number;
  scenario: string;
  recommendations: string[];
}

export interface AirQualityResponse {
  location: { lat: number; lng: number };
  aqi: number;
  category: 'good' | 'moderate' | 'unhealthy_sensitive' | 'unhealthy' | 'very_unhealthy' | 'hazardous';
  pollutants: {
    pm25: number;
    pm10: number;
    no2: number;
    o3: number;
    co: number;
  };
  health_advice: string;
  timestamp: string;
}

export interface GreenSpaceAccessibility {
  location: { lat: number; lng: number };
  nearest_park_distance_meters: number;
  parks_within_1km: number;
  green_space_per_capita_sqm: number;
  accessibility_score: number;
}

export interface ClimateResilience {
  area_id: string;
  overall_score: number;
  components: {
    heat_stress_vulnerability: number;
    drought_resilience: number;
    flood_defense_rating: number;
    green_infrastructure: number;
  };
  recommendations: string[];
}

// ==========================================
// 7. DASHBOARD BUILDER TYPES
// ==========================================

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'map' | 'metric' | 'table' | 'text';
  title: string;
  config: Record<string, any>;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

export interface Dashboard {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  layout: 'grid' | 'flex';
  public: boolean;
  created_at: string;
  updated_at: string;
}

export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  widgets: DashboardWidget[];
  preview_image?: string;
}

// ==========================================
// 8. COMPARISON TYPES
// ==========================================

export interface NeighborhoodComparisonRequest {
  area_ids: string[];
  metrics?: string[];
}

export interface NeighborhoodComparisonResponse {
  areas: Array<{
    area_id: string;
    area_name: string;
    metrics: Record<string, number>;
    rank: Record<string, number>;
  }>;
  rankings: Array<{
    metric: string;
    ranked_areas: Array<{ area_id: string; value: number; rank: number }>;
  }>;
}

export interface TemporalComparisonRequest {
  area_id: string;
  metric: string;
  years: number[];
}

export interface TemporalComparisonResponse {
  area_id: string;
  area_name: string;
  metric: string;
  data_points: Array<{
    year: number;
    value: number;
    change_from_previous?: number;
  }>;
  total_change: number;
  growth_rate: number;
}

export interface BenchmarkResponse {
  area_id: string;
  area_name: string;
  metrics: Record<string, {
    area_value: number;
    city_average: number;
    difference: number;
    percentile: number;
    performance: 'above_average' | 'average' | 'below_average';
  }>;
}

export interface SimilarArea {
  area_id: string;
  area_name: string;
  similarity_score: number;
  matching_characteristics: string[];
  key_differences: string[];
}

// ==========================================
// 9. WORKSPACE TYPES
// ==========================================

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  owner_user_id: string;
  team_members: string[];
  public: boolean;
  created_at: string;
  updated_at: string;
}

export interface Scenario {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  map_state: {
    center: { lat: number; lng: number };
    zoom: number;
    layers: string[];
  };
  filters: Record<string, any>;
  analysis_results?: Record<string, any>;
  created_by: string;
  created_at: string;
  version: number;
}

// ==========================================
// 10. PDF REPORTS TYPES
// ==========================================

export interface ReportGenerationRequest {
  template_id: string;
  title: string;
  format: 'pdf' | 'docx';
  sections: Array<{
    type: 'text' | 'map' | 'chart' | 'table';
    title?: string;
    content: Record<string, any>;
  }>;
}

export interface ReportGenerationResponse {
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  estimated_time_seconds: number;
  download_url?: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  sections: Array<{
    id: string;
    type: string;
    title: string;
    required: boolean;
  }>;
}

export interface ScheduledReport {
  report_id: string;
  template_id: string;
  schedule: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  last_generated?: string;
  next_generation: string;
}

// ==========================================
// 11. DATA QUALITY TYPES
// ==========================================

export interface DataQualityOverview {
  overall_score: number;
  total_datasets: number;
  datasets_by_health: {
    healthy: number;
    warning: number;
    critical: number;
  };
  quality_metrics: {
    completeness: number;
    accuracy: number;
    timeliness: number;
    consistency: number;
  };
}

export interface DatasetQuality {
  dataset_id: string;
  dataset_name: string;
  quality_score: number;
  status: 'healthy' | 'warning' | 'critical';
  metrics: {
    freshness: {
      last_updated: string;
      update_frequency_days: number;
      days_since_update: number;
    };
    completeness: {
      overall_percentage: number;
      field_completeness: Record<string, number>;
    };
    validation: {
      total_errors: number;
      error_types: Record<string, number>;
    };
  };
}

export interface ValidationError {
  id: string;
  dataset_id: string;
  error_type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  affected_records: number;
  example_record_id?: string;
}

// ==========================================
// 12. ADVANCED SEARCH TYPES
// ==========================================

export interface SpatialQueryRequest {
  layers: string[];
  spatial_predicate: 'intersects' | 'within' | 'contains' | 'near';
  geometry?: GeoJSON.Geometry;
  location?: { lat: number; lng: number };
  buffer_meters?: number;
  attribute_filters?: Array<{
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'lt' | 'in' | 'contains';
    value: any;
  }>;
}

export interface SavedSearch {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  query: SpatialQueryRequest;
  public: boolean;
  created_at: string;
}

export interface CrossDatasetSearchResult {
  dataset_id: string;
  dataset_name: string;
  matches: Array<{
    feature_id: string;
    score: number;
    matched_fields: string[];
    highlight: Record<string, string>;
  }>;
  total_matches: number;
}

export interface SearchRecommendation {
  search_text: string;
  description: string;
  category: string;
  popularity_score: number;
}

// ==========================================
// 13. PERFORMANCE TYPES
// ==========================================

export interface CacheStats {
  cache_name: string;
  hit_rate: number;
  total_requests: number;
  cache_hits: number;
  cache_misses: number;
  size_mb: number;
  avg_response_time_ms: number;
}

// ==========================================
// 14. EXTENSIONS TYPES
// ==========================================

export interface Extension {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  category: string;
  permissions: string[];
  install_count: number;
  rating: number;
  status: 'pending' | 'approved' | 'rejected';
}

export interface APIKey {
  id: string;
  user_id: string;
  key_prefix: string;
  name: string;
  permissions: string[];
  rate_limit: number;
  created_at: string;
  expires_at?: string;
  last_used?: string;
}

export interface APIUsage {
  api_key_id: string;
  total_requests: number;
  requests_today: number;
  quota_limit: number;
  quota_remaining: number;
  rate_limit_per_hour: number;
  endpoints_used: Record<string, number>;
}

export interface Webhook {
  id: string;
  user_id: string;
  url: string;
  events: Array<'data_updated' | 'alert_created' | 'report_generated'>;
  active: boolean;
  secret: string;
  created_at: string;
  last_triggered?: string;
}
