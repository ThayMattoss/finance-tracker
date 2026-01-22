import type { Portfolio } from '../types';
import { KRAKEN_TENTACLES } from './professor';

export const INITIAL_USER_PORTFOLIO: Portfolio = {
    totalValue: 0,
    lastUpdated: new Date().toISOString(),
    tentacles: KRAKEN_TENTACLES.map(t => ({
        ...t,
        holdings: []
    }))
};
