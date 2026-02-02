import React, { useState } from 'react';
import TabNavigation from './TabNavigation';
import type { TabId } from './TabNavigation';
import GeneralPanel from './panels/GeneralPanel';
import StrategicPanel from './panels/StrategicPanel';
import TacticalPanel from './panels/TacticalPanel';
import AuditPanel from './panels/AuditPanel';
import { motion, AnimatePresence } from 'framer-motion';
import type { SettingsConfig, ModelData } from '../../types/settings';

interface SystemConfigurationPanelProps {
    config: SettingsConfig;
    onConfigChange: (config: SettingsConfig) => void;
    modelData: ModelData | null;
    modelsLoading: boolean;
}

const SystemConfigurationPanel: React.FC<SystemConfigurationPanelProps> = ({ config, onConfigChange, modelData, modelsLoading }) => {
    const [activeTab, setActiveTab] = useState<TabId>('general');

    const handleConfigChange = (key: keyof SettingsConfig, value: unknown) => {
        onConfigChange({ ...config, [key]: value });
    };

    const renderPanel = () => {
        switch (activeTab) {
            case 'general':
                return <GeneralPanel config={config} onChange={handleConfigChange} />;
            case 'strategic':
                return <StrategicPanel config={config} onChange={handleConfigChange} modelData={modelData} loading={modelsLoading} />;
            case 'tactical':
                return <TacticalPanel config={config} onChange={handleConfigChange} modelData={modelData} loading={modelsLoading} />;
            case 'audit':
                return <AuditPanel config={config} onChange={handleConfigChange} modelData={modelData} loading={modelsLoading} />;
            default:
                return <GeneralPanel />;
        }
    };

    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="shrink-0 pt-2 px-1">
                <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
            </div>

            <div className="flex-1 relative min-h-[400px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 10, filter: 'blur(4px)' }}
                        animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, x: -10, filter: 'blur(4px)' }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="h-full"
                    >
                        {renderPanel()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default SystemConfigurationPanel;
