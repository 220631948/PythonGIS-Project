import { BaseAPI } from '../core';

export class DashboardService extends BaseAPI {
    create(dashboard: unknown) {
        return this.post('/api/dashboard-builder/dashboards', dashboard);
    }

    getUserDashboards(userId: string) {
        return this.get(`/api/dashboard-builder/dashboards/${userId}`);
    }

    update(dashboardId: string, update: unknown) {
        return this.patch(`/api/dashboard-builder/dashboards/${dashboardId}`, update);
    }

    deleteDashboard(dashboardId: string) {
        return this.delete(`/api/dashboard-builder/dashboards/${dashboardId}`);
    }

    getTemplates() {
        return this.get('/api/dashboard-builder/templates');
    }
}
