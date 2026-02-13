/**
 * Apple HIG System Configuration Panel
 *
 * Desktop: Sidebar + Content layout (macOS System Settings)
 * Mobile: Segmented control + full-width scrolling content
 */

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
        <div className="flex flex-col md:flex-row gap-6 h-full">
            {/* Sidebar (Desktop) / Segmented control (Mobile) */}
            <div className="md:w-[200px] shrink-0">
                <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
            </div>

            {/* Content */}
            <div className="flex-1 relative min-h-[400px] overflow-y-auto custom-scrollbar">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
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
