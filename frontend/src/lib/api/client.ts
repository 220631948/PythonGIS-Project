import { BaseAPI } from './core';
import { ServicesService } from './services/services';
import { TransportService } from './services/transport';
import { SafetyService } from './services/safety';
import { EnvironmentService } from './services/environment';
import { LandUseService } from './services/land-use';
import { UtilitiesService } from './services/utilities';
import { InfrastructureService } from './services/infrastructure';
import { SpatialService } from './services/spatial';
import { GeocodingService } from './services/geocoding';
import { TemporalService } from './services/temporal';
import { NetworkService } from './services/network';
import { FilterService } from './services/filter';
import { ReportsService } from './services/reports';
import { PortalService } from './services/portal';
import { CollaborationService } from './services/collaboration';
import { ExportService } from './services/export';
import { FieldService } from './services/field';
import { CatalogService } from './services/catalog';
import { AnalysisService } from './services/analysis';
import { RealtimeService } from './services/realtime';
import { DataStatusService } from './services/data-status';
import { Visualization3DService } from './services/visualization-3d';
import { AIService } from './services/ai';
import { CommunityService } from './services/community';
import { NotificationsService } from './services/notifications';
import { DemographicsService } from './services/demographics';
import { DashboardService } from './services/dashboard';
import { ComparisonService } from './services/comparison';
import { WorkspaceService } from './services/workspace';
import { SearchService } from './services/search';
import { PerformanceService } from './services/performance';
import { ExtensionsService } from './services/extensions';

export class APIClient extends BaseAPI {
    public services = new ServicesService();
    public transport = new TransportService();
    public safety = new SafetyService();
    public environment = new EnvironmentService();
    public landUse = new LandUseService();
    public utilities = new UtilitiesService();
    public infrastructure = new InfrastructureService();
    public spatial = new SpatialService();
    public geocoding = new GeocodingService();
    public temporal = new TemporalService();
    public network = new NetworkService();
    public filter = new FilterService();
    public reports = new ReportsService();
    public portal = new PortalService();
    public collaboration = new CollaborationService();
    public export = new ExportService();
    public field = new FieldService();
    public catalog = new CatalogService();
    public analysis = new AnalysisService();
    public realtime = new RealtimeService();
    public dataStatus = new DataStatusService();
    public visualization3d = new Visualization3DService();
    public ai = new AIService();
    public community = new CommunityService();
    public notifications = new NotificationsService();
    public demographics = new DemographicsService();
    public dashboard = new DashboardService();
    public comparison = new ComparisonService();
    public workspace = new WorkspaceService();
    public search = new SearchService();
    public performance = new PerformanceService();
    public extensions = new ExtensionsService();

    // ── Legacy Methods (Deprecated) ──

    /** @deprecated Use services.getAccess() */
    getServiceAccess(simplify = 0.0001) {
        return this.services.getAccess(simplify);
    }

    /** @deprecated Use transport.getAccessibility() */
    getTransportAccessibility(lat: number, lon: number, simplify = 0.0001) {
        return this.transport.getAccessibility(lat, lon, simplify);
    }

    /** @deprecated Use safety.getPrecincts() */
    getSafetyPrecincts(simplify = 0.001) {
        return this.safety.getPrecincts(simplify);
    }

    /** @deprecated Use environment.getFloodRiskLegacy() */
    getFloodRiskLegacy(simplify = 0.0001) {
        return this.environment.getFloodRiskLegacy(simplify);
    }

    /** @deprecated Use landUse.getZoning() */
    getZoning(simplify = 0.001) {
        return this.landUse.getZoning(simplify);
    }

    /** @deprecated Use utilities.getWaste() */
    getWaste(simplify = 0.001) {
        return this.utilities.getWaste(simplify);
    }

    /** @deprecated Use infrastructure.getLayer() */
    getInfrastructureLayer(layerId: string, simplify = 0.0001) {
        return this.infrastructure.getLayer(layerId, simplify);
    }

    /** @deprecated Use spatial.pointInPolygon() */
    pointInPolygon(polygon: unknown, layers: string[]) {
        return this.spatial.pointInPolygon(polygon, layers);
    }

    /** @deprecated Use spatial.getBuffer() */
    getBuffer(lat: number, lon: number, distance = 500) {
        return this.spatial.getBuffer(lat, lon, distance);
    }

    /** @deprecated Use spatial.getNearbyFeatures() */
    getNearbyFeatures(layer: string, lat: number, lon: number, radius = 1000) {
        return this.spatial.getNearbyFeatures(layer, lat, lon, radius);
    }

    /** @deprecated Use geocoding.searchPlaces() */
    searchPlaces(query: string, limit = 10) {
        return this.geocoding.searchPlaces(query, limit);
    }

    /** @deprecated Use geocoding.getAutocomplete() */
    getAutocomplete(query: string, limit = 8) {
        return this.geocoding.getAutocomplete(query, limit);
    }

    /** @deprecated Use geocoding.reverseGeocode() */
    reverseGeocode(lat: number, lon: number) {
        return this.geocoding.reverseGeocode(lat, lon);
    }

    /** @deprecated Use temporal.getDatasets() */
    getTemporalDatasets() {
        return this.temporal.getDatasets();
    }

    /** @deprecated Use temporal.filterByTime() */
    filterByTime(dataset: string, startDate?: string, endDate?: string, timeField: string | null = null) {
        return this.temporal.filterByTime(dataset, startDate, endDate, timeField);
    }

    /** @deprecated Use temporal.getAnimationFrames() */
    getAnimationFrames(dataset: string, startDate: string, endDate: string, interval = 'day', cumulative = false) {
        return this.temporal.getAnimationFrames(dataset, startDate, endDate, interval, cumulative);
    }

    /** @deprecated Use network.calculateRoute() */
    calculateRoute(originLat: number, originLon: number, destLat: number, destLon: number, mode = 'driving') {
        return this.network.calculateRoute(originLat, originLon, destLat, destLon, mode);
    }

    /** @deprecated Use network.calculateIsochrone() */
    calculateIsochrone(lat: number, lon: number, timeMinutes = 15, mode = 'walking', intervals = 3) {
        return this.network.calculateIsochrone(lat, lon, timeMinutes, mode, intervals);
    }

    /** @deprecated Use network.calculateServiceArea() */
    calculateServiceArea(facilityType: string, timeMinutes = 15, mode = 'walking') {
        return this.network.calculateServiceArea(facilityType, timeMinutes, mode);
    }

    /** @deprecated Use network.findNearest() */
    findNearest(lat: number, lon: number, facilityType: string, count = 5) {
        return this.network.findNearest(lat, lon, facilityType, count);
    }

    /** @deprecated Use network.getTransitConnectivity() */
    getTransitConnectivity(lat: number, lon: number, radiusMeters = 1000) {
        return this.network.getTransitConnectivity(lat, lon, radiusMeters);
    }

    /** @deprecated Use filter.getSchema() */
    getFilterSchema(dataset: string) {
        return this.filter.getSchema(dataset);
    }

    /** @deprecated Use filter.filterDataset() */
    filterDataset(dataset: string, conditions: unknown, logic = 'and', simplify = 0.0001) {
        return this.filter.filterDataset(dataset, conditions, logic, simplify);
    }

    /** @deprecated Use filter.getFacets() */
    getFacets(dataset: string, facetFields: string[], filters: unknown = null) {
        return this.filter.getFacets(dataset, facetFields, filters);
    }

    /** @deprecated Use filter.textSearch() */
    textSearch(dataset: string, query: string, fields: string | null = null, limit = 100) {
        return this.filter.textSearch(dataset, query, fields, limit);
    }

    /** @deprecated Use reports.getSummary() */
    getSummaryReport(datasets: string | null = null) {
        return this.reports.getSummary(datasets);
    }

    /** @deprecated Use reports.exportDataset() */
    exportDataset(dataset: string, format = 'csv', columns: string | null = null, limit: number | null = null) {
        return this.reports.exportDataset(dataset, format, columns, limit);
    }

    /** @deprecated Use reports.getAnalysisReport() */
    getAnalysisReport(lat: number, lon: number, radiusMeters = 1000) {
        return this.reports.getAnalysisReport(lat, lon, radiusMeters);
    }

    /** @deprecated Use reports.getDashboardData() */
    getDashboardData() {
        return this.reports.getDashboardData();
    }

    /** @deprecated Use portal.getDatasets() */
    getPortalDatasets(category: string | null = null, search: string | null = null) {
        return this.portal.getDatasets(category, search);
    }

    /** @deprecated Use portal.getCategories() */
    getPortalCategories() {
        return this.portal.getCategories();
    }

    /** @deprecated Use portal.getDatasetGeoJSON() */
    getDatasetGeoJSON(datasetId: string) {
        return this.portal.getDatasetGeoJSON(datasetId);
    }

    /** @deprecated Use collaboration.getAnnotations() */
    getAnnotations(bbox: string | null = null, type: string | null = null, status: string | null = null, page = 1) {
        return this.collaboration.getAnnotations(bbox, type, status, page);
    }

    /** @deprecated Use collaboration.createAnnotation() */
    createAnnotation(annotation: unknown) {
        return this.collaboration.createAnnotation(annotation);
    }

    /** @deprecated Use collaboration.updateAnnotation() */
    updateAnnotation(id: string | number, update: unknown) {
        return this.collaboration.updateAnnotation(id, update);
    }

    /** @deprecated Use collaboration.deleteAnnotation() */
    deleteAnnotation(id: string | number) {
        return this.collaboration.deleteAnnotation(id);
    }

    /** @deprecated Use collaboration.getAnnotationReplies() */
    getAnnotationReplies(annotationId: string | number) {
        return this.collaboration.getAnnotationReplies(annotationId);
    }

    /** @deprecated Use collaboration.createReply() */
    createReply(annotationId: string | number, reply: unknown) {
        return this.collaboration.createReply(annotationId, reply);
    }

    /** @deprecated Use collaboration.getMarkers() */
    getMarkers(bbox: string | null = null) {
        return this.collaboration.getMarkers(bbox);
    }

    /** @deprecated Use collaboration.createMarker() */
    createMarker(marker: unknown) {
        return this.collaboration.createMarker(marker);
    }

    /** @deprecated Use export.exportData() */
    exportData(request: unknown) {
        return this.export.exportData(request);
    }

    /** @deprecated Use export.exportAnalysis() */
    exportAnalysis(request: unknown) {
        return this.export.exportAnalysis(request);
    }

    /** @deprecated Use export.getFormats() */
    getExportFormats() {
        return this.export.getFormats();
    }

    /** @deprecated Use export.getPending() */
    getPendingExports() {
        return this.export.getPending();
    }

    /** @deprecated Use export.getDownloadUrl() */
    getExportDownloadUrl(fileId: string) {
        return this.export.getDownloadUrl(fileId);
    }

    /** @deprecated Use field.getForms() */
    getFieldForms(offlineOnly = false) {
        return this.field.getForms(offlineOnly);
    }

    /** @deprecated Use field.getForm() */
    getFieldForm(formId: string) {
        return this.field.getForm(formId);
    }

    /** @deprecated Use field.submitEntry() */
    submitFieldEntry(entry: unknown) {
        return this.field.submitEntry(entry);
    }

    /** @deprecated Use field.syncEntries() */
    syncFieldEntries(entries: unknown[], syncMode = 'create') {
        return this.field.syncEntries(entries, syncMode);
    }

    /** @deprecated Use field.getEntries() */
    getFieldEntries(formId: string | null = null, status: string | null = null, limit = 100) {
        return this.field.getEntries(formId, status, limit);
    }

    /** @deprecated Use field.createOfflinePackage() */
    createOfflinePackage(forms: unknown = null, layers: unknown = null, bbox: unknown = null) {
        return this.field.createOfflinePackage(forms, layers, bbox);
    }

    /** @deprecated Use catalog.getDatasets() */
    getCatalogDatasets(category: string | null = null, geometryType: string | null = null, keyword: string | null = null) {
        return this.catalog.getDatasets(category, geometryType, keyword);
    }

    /** @deprecated Use catalog.getMetadata() */
    getDatasetMetadata(datasetId: string, refresh = false) {
        return this.catalog.getMetadata(datasetId, refresh);
    }

    /** @deprecated Use catalog.search() */
    searchCatalog(query: unknown) {
        return this.catalog.search(query);
    }

    /** @deprecated Use catalog.getCategories() */
    getCatalogCategories() {
        return this.catalog.getCategories();
    }

    /** @deprecated Use catalog.getStats() */
    getCatalogStats() {
        return this.catalog.getStats();
    }

    /** @deprecated Use analysis.calculateViewshed() */
    calculateViewshed(lat: number, lng: number, observerHeight = 1.7, maxDistance = 5000, resolution = 36) {
        return this.analysis.calculateViewshed(lat, lng, observerHeight, maxDistance, resolution);
    }

    /** @deprecated Use analysis.checkVisibility() */
    checkVisibility(fromLat: number, fromLng: number, toLat: number, toLng: number, fromHeight = 1.7, toHeight = 0) {
        return this.analysis.checkVisibility(fromLat, fromLng, toLat, toLng, fromHeight, toHeight);
    }

    /** @deprecated Use analysis.validateTopology() */
    validateTopology(dataset: string, checkSelfIntersections = true, checkOverlaps = true) {
        return this.analysis.validateTopology(dataset, checkSelfIntersections, checkOverlaps);
    }

    /** @deprecated Use analysis.calculateRouteAdvanced() */
    calculateRouteAdvanced(fromLat: number, fromLng: number, toLat: number, toLng: number, mode = 'driving') {
        return this.analysis.calculateRouteAdvanced(fromLat, fromLng, toLat, toLng, mode);
    }

    /** @deprecated Use analysis.calculateIsochroneAdvanced() */
    calculateIsochroneAdvanced(lat: number, lng: number, timeMinutes = 15, mode = 'driving') {
        return this.analysis.calculateIsochroneAdvanced(lat, lng, timeMinutes, mode);
    }

    /** @deprecated Use analysis.findNearestFacility() */
    findNearestFacility(lat: number, lng: number, facilityType: string, limit = 5) {
        return this.analysis.findNearestFacility(lat, lng, facilityType, limit);
    }

    /** @deprecated Use realtime.getFeeds() */
    getRealtimeFeeds() {
        return this.realtime.getFeeds();
    }

    /** @deprecated Use realtime.getFeed() */
    getRealtimeFeed(feedId: string, forceRefresh = false) {
        return this.realtime.getFeed(feedId, forceRefresh);
    }

    /** @deprecated Use realtime.refreshFeed() */
    refreshRealtimeFeed(feedId: string) {
        return this.realtime.refreshFeed(feedId);
    }

    /** @deprecated Use realtime.getStatus() */
    getRealtimeStatus() {
        return this.realtime.getStatus();
    }

    /** @deprecated Use realtime.getTimestamps() */
    getRealtimeTimestamps() {
        return this.realtime.getTimestamps();
    }

    /** @deprecated Use realtime.getSources() */
    getRealtimeSources() {
        return this.realtime.getSources();
    }

    /** @deprecated Use dataStatus.getHealth() */
    getDataSourcesHealth() {
        return this.dataStatus.getHealth();
    }

    /** @deprecated Use dataStatus.getHealth() */
    getDataSourceHealth(datasetName: string) {
        return this.dataStatus.getHealth(datasetName);
    }

    /** @deprecated Use dataStatus.getSources() */
    getDataSources() {
        return this.dataStatus.getSources();
    }

    /** @deprecated Use dataStatus.getProvenance() */
    getDataProvenance(datasetName: string) {
        return this.dataStatus.getProvenance(datasetName);
    }

    /** @deprecated Use dataStatus.validateDataset() */
    validateDataset(datasetName: string, forceRefresh = false) {
        return this.dataStatus.validateDataset(datasetName, forceRefresh);
    }

    /** @deprecated Use dataStatus.getRetrievalLog() */
    getRetrievalLog(limit = 50) {
        return this.dataStatus.getRetrievalLog(limit);
    }

    /** @deprecated Use visualization3d.extrudeBuildings() */
    extrudeBuildings(request: unknown) {
        return this.visualization3d.extrudeBuildings(request);
    }

    /** @deprecated Use visualization3d.getElevationProfile() */
    getElevationProfile(request: unknown) {
        return this.visualization3d.getElevationProfile(request);
    }

    /** @deprecated Use visualization3d.analyzeShadows() */
    analyzeShadows(request: unknown) {
        return this.visualization3d.analyzeShadows(request);
    }

    /** @deprecated Use visualization3d.calculateViewshed() */
    calculate3DViewshed(request: unknown) {
        return this.visualization3d.calculateViewshed(request);
    }

    /** @deprecated Use visualization3d.getTerrainTile() */
    getTerrainTile(z: number, x: number, y: number) {
        return this.visualization3d.getTerrainTile(z, x, y);
    }

    /** @deprecated Use ai.predictTraffic() */
    predictTraffic(request: unknown) {
        return this.ai.predictTraffic(request);
    }

    /** @deprecated Use ai.predictCrimeHotspots() */
    predictCrimeHotspots(request: unknown) {
        return this.ai.predictCrimeHotspots(request);
    }

    /** @deprecated Use ai.detectLandUseChange() */
    detectLandUseChange(request: unknown) {
        return this.ai.detectLandUseChange(request);
    }

    /** @deprecated Use ai.queryNaturalLanguage() */
    queryNaturalLanguage(request: unknown) {
        return this.ai.queryNaturalLanguage(request);
    }

    /** @deprecated Use ai.getTrendingPredictions() */
    getTrendingPredictions() {
        return this.ai.getTrendingPredictions();
    }

    /** @deprecated Use community.submitFeedback() */
    submitFeedback(feedback: unknown) {
        return this.community.submitFeedback(feedback);
    }

    /** @deprecated Use community.getFeedbackList() */
    getFeedbackList(proposalId?: string, page = 1) {
        return this.community.getFeedbackList(proposalId, page);
    }

    /** @deprecated Use community.reportIssue() */
    reportIssue(issue: unknown) {
        return this.community.reportIssue(issue);
    }

    /** @deprecated Use community.uploadIssuePhoto() */
    uploadIssuePhoto(issueId: string, formData: FormData) {
        return this.community.uploadIssuePhoto(issueId, formData);
    }

    /** @deprecated Use community.getIssuesList() */
    getIssuesList(category?: string, status?: string, page = 1) {
        return this.community.getIssuesList(category, status, page);
    }

    /** @deprecated Use community.voteOnPoll() */
    voteOnPoll(pollId: string, optionId: string, voterId: string) {
        return this.community.voteOnPoll(pollId, optionId, voterId);
    }

    /** @deprecated Use community.getPollsList() */
    getPollsList(status = 'active') {
        return this.community.getPollsList(status);
    }

    /** @deprecated Use community.contributeData() */
    contributeData(contribution: unknown) {
        return this.community.contributeData(contribution);
    }

    /** @deprecated Use community.getContributionsList() */
    getContributionsList(status?: string) {
        return this.community.getContributionsList(status);
    }

    /** @deprecated Use community.getStats() */
    getCommunityStats() {
        return this.community.getStats();
    }

    /** @deprecated Use notifications.subscribe() */
    subscribeToAlerts(subscription: unknown) {
        return this.notifications.subscribe(subscription);
    }

    /** @deprecated Use notifications.getSubscriptions() */
    getSubscriptions(userId: string) {
        return this.notifications.getSubscriptions(userId);
    }

    /** @deprecated Use notifications.updateSubscription() */
    updateSubscription(subscriptionId: string, update: unknown) {
        return this.notifications.updateSubscription(subscriptionId, update);
    }

    /** @deprecated Use notifications.unsubscribe() */
    unsubscribe(subscriptionId: string) {
        return this.notifications.unsubscribe(subscriptionId);
    }

    /** @deprecated Use notifications.registerPushDevice() */
    registerPushDevice(registration: unknown) {
        return this.notifications.registerPushDevice(registration);
    }

    /** @deprecated Use notifications.createAlert() */
    createAlert(alert: unknown) {
        return this.notifications.createAlert(alert);
    }

    /** @deprecated Use notifications.getActiveAlerts() */
    getActiveAlerts(lat?: number, lng?: number, radius?: number) {
        return this.notifications.getActiveAlerts(lat, lng, radius);
    }

    /** @deprecated Use notifications.getUserNotifications() */
    getUserNotifications(userId: string, unreadOnly = false) {
        return this.notifications.getUserNotifications(userId, unreadOnly);
    }

    /** @deprecated Use notifications.markRead() */
    markNotificationRead(notificationId: string) {
        return this.notifications.markRead(notificationId);
    }

    /** @deprecated Use notifications.addLocationWatch() */
    addLocationWatch(watch: unknown) {
        return this.notifications.addLocationWatch(watch);
    }

    /** @deprecated Use notifications.getLocationWatches() */
    getLocationWatches(userId: string) {
        return this.notifications.getLocationWatches(userId);
    }

    /** @deprecated Use demographics.getDensityHeatmap() */
    getDensityHeatmap(request: unknown) {
        return this.demographics.getDensityHeatmap(request);
    }

    /** @deprecated Use demographics.getSocioeconomicIndicators() */
    getSocioeconomicIndicators(areaId: string) {
        return this.demographics.getSocioeconomicIndicators(areaId);
    }

    /** @deprecated Use demographics.getAgeDistribution() */
    getAgeDistribution(areaId: string) {
        return this.demographics.getAgeDistribution(areaId);
    }

    /** @deprecated Use environment.getFloodRisk() */
    getFloodRisk(lat: number, lng: number, scenario = 'current') {
        return this.environment.getFloodRisk(lat, lng, scenario);
    }

    /** @deprecated Use environment.getAirQuality() */
    getAirQuality(lat?: number, lng?: number) {
        return this.environment.getAirQuality(lat, lng);
    }

    /** @deprecated Use environment.getGreenSpaceAccessibility() */
    getGreenSpaceAccessibility(lat: number, lng: number) {
        return this.environment.getGreenSpaceAccessibility(lat, lng);
    }

    /** @deprecated Use environment.getClimateResilience() */
    getClimateResilience(areaId: string) {
        return this.environment.getClimateResilience(areaId);
    }

    /** @deprecated Use dashboard.create() */
    createDashboard(dashboard: unknown) {
        return this.dashboard.create(dashboard);
    }

    /** @deprecated Use dashboard.getUserDashboards() */
    getUserDashboards(userId: string) {
        return this.dashboard.getUserDashboards(userId);
    }

    /** @deprecated Use dashboard.update() */
    updateDashboard(dashboardId: string, update: unknown) {
        return this.dashboard.update(dashboardId, update);
    }

    /** @deprecated Use dashboard.deleteDashboard() */
    deleteDashboard(dashboardId: string) {
        return this.dashboard.deleteDashboard(dashboardId);
    }

    /** @deprecated Use dashboard.getTemplates() */
    getDashboardTemplates() {
        return this.dashboard.getTemplates();
    }

    /** @deprecated Use comparison.compareNeighborhoods() */
    compareNeighborhoods(request: unknown) {
        return this.comparison.compareNeighborhoods(request);
    }

    /** @deprecated Use comparison.compareTemporally() */
    compareTemporally(areaId: string, metric: string, years: number[]) {
        return this.comparison.compareTemporally(areaId, metric, years);
    }

    /** @deprecated Use comparison.benchmarkArea() */
    benchmarkArea(areaId: string, metrics?: string[]) {
        return this.comparison.benchmarkArea(areaId, metrics);
    }

    /** @deprecated Use comparison.findSimilarAreas() */
    findSimilarAreas(areaId: string, limit = 5) {
        return this.comparison.findSimilarAreas(areaId, limit);
    }

    /** @deprecated Use workspace.create() */
    createWorkspace(workspace: unknown) {
        return this.workspace.create(workspace);
    }

    /** @deprecated Use workspace.getUserWorkspaces() */
    getUserWorkspaces(userId: string) {
        return this.workspace.getUserWorkspaces(userId);
    }

    /** @deprecated Use workspace.update() */
    updateWorkspace(workspaceId: string, update: unknown) {
        return this.workspace.update(workspaceId, update);
    }

    /** @deprecated Use workspace.deleteWorkspace() */
    deleteWorkspace(workspaceId: string) {
        return this.workspace.deleteWorkspace(workspaceId);
    }

    /** @deprecated Use workspace.createScenario() */
    createScenario(scenario: unknown) {
        return this.workspace.createScenario(scenario);
    }

    /** @deprecated Use workspace.getScenarios() */
    getWorkspaceScenarios(workspaceId: string) {
        return this.workspace.getScenarios(workspaceId);
    }

    /** @deprecated Use reports.generateReport() */
    generateReport(request: unknown) {
        return this.reports.generateReport(request);
    }

    /** @deprecated Use reports.getReportStatus() */
    getReportStatus(taskId: string) {
        return this.reports.getReportStatus(taskId);
    }

    /** @deprecated Use reports.getReportTemplates() */
    getReportTemplates() {
        return this.reports.getReportTemplates();
    }

    /** @deprecated Use reports.scheduleReport() */
    scheduleReport(schedule: unknown) {
        return this.reports.scheduleReport(schedule);
    }

    /** @deprecated Use reports.getScheduledReports() */
    getScheduledReports(userId: string) {
        return this.reports.getScheduledReports(userId);
    }

    /** @deprecated Use dataStatus.getQualityOverview() */
    getDataQualityOverview() {
        return this.dataStatus.getQualityOverview();
    }

    /** @deprecated Use dataStatus.getDatasetQuality() */
    getDatasetQuality(datasetId: string) {
        return this.dataStatus.getDatasetQuality(datasetId);
    }

    /** @deprecated Use dataStatus.getValidationErrors() */
    getValidationErrors(datasetId: string, severity?: string) {
        return this.dataStatus.getValidationErrors(datasetId, severity);
    }

    /** @deprecated Use search.executeSpatialQuery() */
    executeSpatialQuery(query: unknown) {
        return this.search.executeSpatialQuery(query);
    }

    /** @deprecated Use search.saveSearch() */
    saveSearch(search: unknown) {
        return this.search.saveSearch(search);
    }

    /** @deprecated Use search.getSavedSearches() */
    getSavedSearches(userId: string, publicOnly = false) {
        return this.search.getSavedSearches(userId, publicOnly);
    }

    /** @deprecated Use search.crossDatasetSearch() */
    crossDatasetSearch(query: string, datasets?: string[]) {
        return this.search.crossDatasetSearch(query, datasets);
    }

    /** @deprecated Use search.getRecommendations() */
    getSearchRecommendations(userId: string) {
        return this.search.getRecommendations(userId);
    }

    /** @deprecated Use performance.getVectorTile() */
    getVectorTile(dataset: string, z: number, x: number, y: number) {
        return this.performance.getVectorTile(dataset, z, x, y);
    }

    /** @deprecated Use performance.getClusteredData() */
    getClusteredData(dataset: string, zoom: number, bounds?: string) {
        return this.performance.getClusteredData(dataset, zoom, bounds);
    }

    /** @deprecated Use performance.getLODData() */
    getLODData(dataset: string, zoom: number, simplify = true) {
        return this.performance.getLODData(dataset, zoom, simplify);
    }

    /** @deprecated Use performance.preloadCache() */
    preloadCache(request: unknown) {
        return this.performance.preloadCache(request);
    }

    /** @deprecated Use performance.getCacheStats() */
    getCacheStats() {
        return this.performance.getCacheStats();
    }

    /** @deprecated Use extensions.register() */
    registerExtension(extension: unknown) {
        return this.extensions.register(extension);
    }

    /** @deprecated Use extensions.getMarketplace() */
    getMarketplaceExtensions(category?: string, search?: string) {
        return this.extensions.getMarketplace(category, search);
    }

    /** @deprecated Use extensions.createAPIKey() */
    createAPIKey(request: unknown) {
        return this.extensions.createAPIKey(request);
    }

    /** @deprecated Use extensions.getUserAPIKeys() */
    getUserAPIKeys(userId: string) {
        return this.extensions.getUserAPIKeys(userId);
    }

    /** @deprecated Use extensions.revokeAPIKey() */
    revokeAPIKey(keyId: string) {
        return this.extensions.revokeAPIKey(keyId);
    }

    /** @deprecated Use extensions.getUsage() */
    getAPIUsage(keyId: string) {
        return this.extensions.getUsage(keyId);
    }

    /** @deprecated Use extensions.registerWebhook() */
    registerWebhook(webhook: unknown) {
        return this.extensions.registerWebhook(webhook);
    }

    /** @deprecated Use extensions.getUserWebhooks() */
    getUserWebhooks(userId: string) {
        return this.extensions.getUserWebhooks(userId);
    }

    /** @deprecated Use extensions.deleteWebhook() */
    deleteWebhook(webhookId: string) {
        return this.extensions.deleteWebhook(webhookId);
    }

    /** @deprecated Use extensions.getDocs() */
    getExtensionDocs() {
        return this.extensions.getDocs();
    }
}
