import { useState } from 'react';

/**
 * useWorkspaceState Hook
 *
 * Manages the state of the current workspace and scenario.
 */
export function useWorkspaceState() {
    const [currentWorkspace, setCurrentWorkspace] = useState<any>(null);
    const [currentScenario, setCurrentScenario] = useState<any>(null);

    return {
        currentWorkspace,
        setCurrentWorkspace,
        currentScenario,
        setCurrentScenario
    };
}
