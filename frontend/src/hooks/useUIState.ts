import { useState } from 'react';

export const useUIState = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isOfflineManagerOpen, setIsOfflineManagerOpen] = useState(false);
    const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
    const [isDashboardOpen, setIsDashboardOpen] = useState(false);
    const [isDataStatusOpen, setIsDataStatusOpen] = useState(false);
    const [isWorkspaceManagerOpen, setIsWorkspaceManagerOpen] = useState(false);
    const [isDashboardBuilderOpen, setIsDashboardBuilderOpen] = useState(false);
    const [isComparativeAnalysisOpen, setIsComparativeAnalysisOpen] = useState(false);

    return {
        isSidebarOpen,
        setIsSidebarOpen,
        isOfflineManagerOpen,
        setIsOfflineManagerOpen,
        isInstallModalOpen,
        setIsInstallModalOpen,
        isDashboardOpen,
        setIsDashboardOpen,
        isDataStatusOpen,
        setIsDataStatusOpen,
        isWorkspaceManagerOpen,
        setIsWorkspaceManagerOpen,
        isDashboardBuilderOpen,
        setIsDashboardBuilderOpen,
        isComparativeAnalysisOpen,
        setIsComparativeAnalysisOpen
    };
};
