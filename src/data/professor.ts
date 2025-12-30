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

const now = "2025-12-30T14:00:00.000Z";

export const INITIAL_PORTFOLIO: Portfolio = {
    totalValue: 6564.06,
    lastUpdated: now,
    tentacles: KRAKEN_TENTACLES.map(t => {
        if (t.id === 'FII') {
            return {
                ...t,
                holdings: [
                    { ticker: 'PROF_FII_01', name: 'Ref Professor FII 01', category: 'FII', quantity: 1, averagePrice: 397.898, totalValue: 397.898, lastUpdated: now },
                    { ticker: 'PROF_FII_02', name: 'Ref Professor FII 02', category: 'FII', quantity: 1, averagePrice: 397.898, totalValue: 397.898, lastUpdated: now },
                    { ticker: 'PROF_FII_03', name: 'Ref Professor FII 03', category: 'FII', quantity: 1, averagePrice: 397.898, totalValue: 397.898, lastUpdated: now },
                    { ticker: 'PROF_FII_04', name: 'Ref Professor FII 04', category: 'FII', quantity: 1, averagePrice: 397.898, totalValue: 397.898, lastUpdated: now },
                    { ticker: 'PROF_FII_05', name: 'Ref Professor FII 05', category: 'FII', quantity: 1, averagePrice: 397.898, totalValue: 397.898, lastUpdated: now },
                    { ticker: 'PROF_FII_06', name: 'Ref Professor FII 06', category: 'FII', quantity: 1, averagePrice: 397.898, totalValue: 397.898, lastUpdated: now },
                    { ticker: 'PROF_FII_07', name: 'Ref Professor FII 07', category: 'FII', quantity: 1, averagePrice: 397.898, totalValue: 397.898, lastUpdated: now },
                    { ticker: 'PROF_FII_08', name: 'Ref Professor FII 08', category: 'FII', quantity: 1, averagePrice: 397.898, totalValue: 397.898, lastUpdated: now },
                    { ticker: 'PROF_FII_09', name: 'Ref Professor FII 09', category: 'FII', quantity: 1, averagePrice: 397.898, totalValue: 397.898, lastUpdated: now },
                    { ticker: 'PROF_FII_10', name: 'Ref Professor FII 10', category: 'FII', quantity: 1, averagePrice: 397.898, totalValue: 397.898, lastUpdated: now }
                ]
            };
        }
        if (t.id === 'ACAO_BR') {
            return {
                ...t,
                holdings: [
                    { ticker: 'PROF_ACAO_01', name: 'Ref Professor Ação 01', category: 'ACAO_BR', quantity: 1, averagePrice: 367.436, totalValue: 367.436, lastUpdated: now },
                    { ticker: 'PROF_ACAO_02', name: 'Ref Professor Ação 02', category: 'ACAO_BR', quantity: 1, averagePrice: 367.436, totalValue: 367.436, lastUpdated: now },
                    { ticker: 'PROF_ACAO_03', name: 'Ref Professor Ação 03', category: 'ACAO_BR', quantity: 1, averagePrice: 367.436, totalValue: 367.436, lastUpdated: now },
                    { ticker: 'PROF_ACAO_04', name: 'Ref Professor Ação 04', category: 'ACAO_BR', quantity: 1, averagePrice: 367.436, totalValue: 367.436, lastUpdated: now },
                    { ticker: 'PROF_ACAO_05', name: 'Ref Professor Ação 05', category: 'ACAO_BR', quantity: 1, averagePrice: 367.436, totalValue: 367.436, lastUpdated: now }
                ]
            };
        }
        if (t.id === 'EXTERIOR') {
            return {
                ...t,
                holdings: [
                    { ticker: 'SPXB11', name: 'SPXB11 ETF', category: 'EXTERIOR', quantity: 1, averagePrice: 747.90, totalValue: 747.90, lastUpdated: now }
                ]
            };
        }
        return t;
    })
};
