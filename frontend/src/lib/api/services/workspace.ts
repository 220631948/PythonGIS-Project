import { BaseAPI } from '../core';

export class WorkspaceService extends BaseAPI {
    create(workspace: unknown) {
        return this.post('/api/workspace/workspaces', workspace);
    }

    getUserWorkspaces(userId: string) {
        return this.get(`/api/workspace/workspaces/${userId}`);
    }

    update(workspaceId: string, update: unknown) {
        return this.patch(`/api/workspace/workspaces/${workspaceId}`, update);
    }

    deleteWorkspace(workspaceId: string) {
        return this.delete(`/api/workspace/workspaces/${workspaceId}`);
    }

    createScenario(scenario: unknown) {
        return this.post('/api/workspace/scenarios', scenario);
    }

    getScenarios(workspaceId: string) {
        return this.get(`/api/workspace/scenarios/${workspaceId}`);
    }
}
