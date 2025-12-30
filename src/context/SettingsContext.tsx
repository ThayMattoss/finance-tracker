import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AssetSettings } from '../types/settings';

interface SettingsContextType {
    settings: Record<string, AssetSettings>;
    getSetting: (ticker: string) => AssetSettings | undefined;
    updateSetting: (ticker: string, changes: Partial<AssetSettings>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<Record<string, AssetSettings>>({});

    // Load from storage on mount
    useEffect(() => {
        const stored = localStorage.getItem('asset_settings');
        if (stored) {
            try {
                setSettings(JSON.parse(stored));
            } catch (e) {
                console.error('Failed to parse asset settings', e);
            }
        }
    }, []);

    // Save to storage whenever settings change
    useEffect(() => {
        if (Object.keys(settings).length > 0) {
            localStorage.setItem('asset_settings', JSON.stringify(settings));
        }
    }, [settings]);

    const getSetting = (ticker: string) => settings[ticker];

    const updateSetting = (ticker: string, changes: Partial<AssetSettings>) => {
        setSettings(prev => {
            const current = prev[ticker] || {
                ticker,
                assetType: 'Unknown', // Caller should ideally provide this if creating new
                allowMultiples: false,
                maxMultiple: 1,
                lastUpdated: new Date().toISOString()
            };

            return {
                ...prev,
                [ticker]: {
                    ...current,
                    ...changes,
                    lastUpdated: new Date().toISOString()
                }
            };
        });
    };

    return (
        <SettingsContext.Provider value={{ settings, getSetting, updateSetting }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
