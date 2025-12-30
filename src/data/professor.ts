import type { Portfolio, Tentacle } from '../types';

export const KRAKEN_TENTACLES: Tentacle[] = [
    {
        id: 'CAIXA',
        label: 'Caixa / Oportunidade',
        letter: 'K',
        targetPercentage: 12,
        targetRange: { min: 10, max: 15 },
        color: '#10b981',
        assets: [
            { ticker: 'CDB', name: 'CDB Liquidez Diária', category: 'CAIXA', targetWeight: 100 }
        ],
        holdings: []
    },
    {
        id: 'FII',
        label: 'Fundos Imobiliários (FIIs)',
        letter: 'R',
        targetPercentage: 25,
        color: '#f59e0b',
        assets: [
            { ticker: 'HGLG11', name: 'CSHG Logística', category: 'FII', targetWeight: 10 },
            { ticker: 'KNIP11', name: 'Kinea Índices', category: 'FII', targetWeight: 10 },
            { ticker: 'VISC11', name: 'Vinci Shopping', category: 'FII', targetWeight: 10 }
        ],
        holdings: []
    },
    {
        id: 'ACAO_BR',
        label: 'Ações Brasil',
        letter: 'A',
        targetPercentage: 25,
        color: '#3b82f6',
        assets: [
            { ticker: 'WEGE3', name: 'WEG', category: 'ACAO_BR', targetWeight: 10 },
            { ticker: 'VALE3', name: 'Vale', category: 'ACAO_BR', targetWeight: 10 },
            { ticker: 'ITUB4', name: 'Itaú Unibanco', category: 'ACAO_BR', targetWeight: 10 }
        ],
        holdings: []
    },
    {
        id: 'CRIPTO',
        label: 'Criptomoedas',
        letter: 'K',
        targetPercentage: 3,
        targetRange: { min: 1, max: 5 },
        color: '#ec4899',
        assets: [
            { ticker: 'BTC', name: 'Bitcoin', category: 'CRIPTO', targetWeight: 70 },
            { ticker: 'ETH', name: 'Ethereum', category: 'CRIPTO', targetWeight: 30 }
        ],
        holdings: []
    },
    {
        id: 'EXTERIOR',
        label: 'Exterior / Stocks',
        letter: 'E',
        targetPercentage: 25,
        color: '#8b5cf6',
        assets: [
            { ticker: 'VT', name: 'Vanguard Total World', category: 'EXTERIOR', targetWeight: 50 },
            { ticker: 'VOO', name: 'S&P 500 ETF', category: 'EXTERIOR', targetWeight: 50 }
        ],
        holdings: []
    },
    {
        id: 'NEGOCIOS',
        label: 'Negócios',
        letter: 'N',
        targetPercentage: 10,
        targetRange: { min: 10, max: 15 },
        color: '#06b6d4',
        assets: [],
        holdings: []
    }
];

export const INITIAL_PORTFOLIO: Portfolio = {
    totalValue: 0,
    lastUpdated: new Date().toISOString(),
    tentacles: KRAKEN_TENTACLES
};
