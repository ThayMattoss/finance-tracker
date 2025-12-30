import type { Portfolio } from '../types';

export const STORAGE_KEYS = {
    PROFESSOR: 'professor_portfolio',
    USER: 'user_portfolio'
};

/**
 * Load portfolio from localStorage
 */
export function loadPortfolio(key: string = STORAGE_KEYS.PROFESSOR): Portfolio | null {
    try {
        const stored = localStorage.getItem(key);
        if (!stored) return null;
        return JSON.parse(stored) as Portfolio;
    } catch (error) {
        console.error(`Error loading portfolio (${key}) from localStorage:`, error);
        return null;
    }
}

/**
 * Save portfolio to localStorage
 */
export function savePortfolio(portfolio: Portfolio, key: string = STORAGE_KEYS.PROFESSOR): void {
    try {
        localStorage.setItem(key, JSON.stringify(portfolio));
    } catch (error) {
        console.error(`Error saving portfolio (${key}) to localStorage:`, error);
    }
}

/**
 * Clear portfolio from localStorage
 */
export function clearPortfolio(key: string = STORAGE_KEYS.PROFESSOR): void {
    localStorage.removeItem(key);
}
