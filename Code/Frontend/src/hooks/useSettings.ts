import { useState, useEffect } from 'react';
import { SettingsConfig, ModelData } from '../types/settings';
import { encryptKey, decryptKey } from '../utils/security';
import { api } from '../services/api';

const STORAGE_KEY = 'autologic_settings';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useModelCache = () => {
    const [cache, setCache] = useState<{ data: ModelData | null; timestamp: number }>({
        data: null,
        timestamp: 0
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchModels = async (force = false) => {
        const now = Date.now();
        if (!force && cache.data && (now - cache.timestamp < CACHE_DURATION)) {
            return cache.data;
        }

        setLoading(true);
        try {
            const data = await api.getModels();
            // Transform backend data to match frontend ModelData interface if needed
            // Assuming api.getModels returns compatible structure or we adjust here
            // For now, casting or simple assignment
            const modelData = data as unknown as ModelData;

            setCache({ data: modelData, timestamp: now });
            setError(null);
            return modelData;
        } catch (err) {
            console.error('Failed to fetch models:', err);
            setError('Failed to load models');
            return null;
        } finally {
            setLoading(false);
        }
    };

    return { models: cache.data, loading, error, fetchModels };
};

export const usePersistedSettings = (initialConfig: SettingsConfig) => {
    const [settings, setSettings] = useState<SettingsConfig>(initialConfig);
    const [loaded, setLoaded] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);

                // Decrypt sensitive keys
                if (parsed.apiKey) parsed.apiKey = decryptKey(parsed.apiKey);
                if (parsed.workerApiKey) parsed.workerApiKey = decryptKey(parsed.workerApiKey);
                if (parsed.auditApiKey) parsed.auditApiKey = decryptKey(parsed.auditApiKey);

                // Merge with initialConfig to ensure new fields are present
                setSettings(prev => ({ ...prev, ...parsed }));
            }
        } catch (e) {
            console.error('Failed to load settings:', e);
        } finally {
            setLoaded(true);
        }
    }, []);

    // Save to localStorage whenever settings change
    useEffect(() => {
        if (!loaded) return;

        const toSave = { ...settings };
        // Encrypt sensitive keys before saving
        if (toSave.apiKey) toSave.apiKey = encryptKey(toSave.apiKey);
        if (toSave.workerApiKey) toSave.workerApiKey = encryptKey(toSave.workerApiKey);
        if (toSave.auditApiKey) toSave.auditApiKey = encryptKey(toSave.auditApiKey);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    }, [settings, loaded]);

    return [settings, setSettings, loaded] as const;
};
