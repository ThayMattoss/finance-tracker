export type AssetCategory = 'CAIXA' | 'FII' | 'ACAO_BR' | 'EXTERIOR' | 'CRIPTO' | 'NEGOCIOS';

export interface Asset {
    ticker: string;
    name: string;
    category: AssetCategory;
    targetWeight: number; // Weight within the category (0-100 or relative)
    currentPrice?: number;
}

// Actual holdings with purchase data
export interface AssetHolding {
    ticker: string;
    name: string;
    category: AssetCategory;
    quantity: number;
    averagePrice: number; // Weighted average
    totalValue: number; // quantity * averagePrice
    lastUpdated?: string; // ISO date
}

export interface Tentacle {
    id: AssetCategory;
    label: string;
    letter: string; // K, R, A, E, C, N
    targetPercentage: number; // % of total portfolio
    targetRange?: { min: number; max: number }; // Optional range
    color: string;
    description?: string;
    assets: Asset[]; // Template assets
    holdings: AssetHolding[]; // Actual holdings
}

export interface Portfolio {
    totalValue: number;
    lastUpdated?: string;
    tentacles: Tentacle[];
}

// For deviation tracking
export interface DeviationStatus {
    tentacleId: AssetCategory;
    currentPercentage: number;
    targetPercentage: number;
    deviation: number; // current - target
    status: 'ideal' | 'close' | 'below' | 'much-below' | 'above' | 'much-above';
    statusColor: 'green' | 'yellow' | 'red';
}
