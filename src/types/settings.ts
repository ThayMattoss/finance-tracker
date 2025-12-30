export type AssetType = 'ACAO_BR' | 'FII' | 'ETF' | 'EXTERIOR' | 'CRIPTO' | 'Unknown';

export interface AssetSettings {
    ticker: string;
    assetType: AssetType;

    // Strategic Rules
    manualAcceptablePercentage?: number; // Override default
    allowMultiples: boolean;
    maxMultiple: number; // 1, 1.5, 2, 3...

    notes?: string;

    lastUpdated: string; // ISO Date
}

export const DEFAULT_SETTINGS: Partial<AssetSettings> = {
    allowMultiples: false,
    maxMultiple: 1
};

export const DEFAULT_PERCENTAGES: Record<string, number> = {
    'ACAO_BR': 5,
    'FII': 2,
    'ETF': 10,
    'EXTERIOR': 10,
    'CRIPTO': 3,
    'Unknown': 5
};
