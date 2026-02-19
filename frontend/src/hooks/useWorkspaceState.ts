import { useState } from 'react';

export const useWorkspaceState = () => {
    const [currentWorkspace, setCurrentWorkspace] = useState<any>(null);
    const [currentScenario, setCurrentScenario] = useState<any>(null);

    return {
        currentWorkspace,
        setCurrentWorkspace,
        currentScenario,
        setCurrentScenario
    };
};
