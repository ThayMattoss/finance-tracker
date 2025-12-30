import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Portfolio, AssetHolding, AssetCategory } from '../types';
import { INITIAL_PORTFOLIO, KRAKEN_TENTACLES } from '../data/professor';
import { loadPortfolio, savePortfolio, STORAGE_KEYS } from '../utils/storage';
import { calculateWeightedAverage, calculateTotalValue } from '../utils/calculations';
import { fetchPrices } from '../services/priceService';

type PortfolioType = 'professor' | 'user';

interface PortfolioContextType {
    portfolio: Portfolio; // Deprecated: alias for professorPortfolio for backward compatibility temporarily
    professorPortfolio: Portfolio;
    userPortfolio: Portfolio;
    prices: Record<string, number>;
    isRefreshing: boolean;
    refreshPrices: () => Promise<void>;
    addOrUpdateHolding: (holding: Omit<AssetHolding, 'totalValue' | 'lastUpdated'>, target?: PortfolioType) => void;
    updateHolding: (holding: Omit<AssetHolding, 'totalValue' | 'lastUpdated'>, target?: PortfolioType) => void;
    deleteHolding: (category: AssetCategory, ticker: string, target?: PortfolioType) => void;
    resetPortfolio: (target?: PortfolioType) => void;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
    // Helper to merge saved data with current structure
    const mergeWithStructure = (loaded: Portfolio) => {
        const mergedTentacles = KRAKEN_TENTACLES.map(templateTentacle => {
            const loadedTentacle = loaded.tentacles.find(t => t.id === templateTentacle.id);
            return {
                ...templateTentacle,
                holdings: loadedTentacle ? loadedTentacle.holdings : []
            };
        });
        return { ...loaded, tentacles: mergedTentacles };
    };

    // Professor Portfolio State
    const [professorPortfolio, setProfessorPortfolio] = useState<Portfolio>(() => {
        const loaded = loadPortfolio(STORAGE_KEYS.PROFESSOR);
        if (loaded) return mergeWithStructure(loaded);
        return INITIAL_PORTFOLIO;
    });

    // User Portfolio State
    const [userPortfolio, setUserPortfolio] = useState<Portfolio>(() => {
        const loaded = loadPortfolio(STORAGE_KEYS.USER);
        if (loaded) return mergeWithStructure(loaded);
        return INITIAL_PORTFOLIO;
    });

    // Persist changes
    useEffect(() => {
        savePortfolio(professorPortfolio, STORAGE_KEYS.PROFESSOR);
    }, [professorPortfolio]);

    useEffect(() => {
        savePortfolio(userPortfolio, STORAGE_KEYS.USER);
    }, [userPortfolio]);

    // Generic State Setter
    const setPortfolioByType = (type: PortfolioType, updateFn: (prev: Portfolio) => Portfolio) => {
        if (type === 'professor') {
            setProfessorPortfolio(updateFn);
        } else {
            setUserPortfolio(updateFn);
        }
    };

    const addOrUpdateHolding = (newHolding: Omit<AssetHolding, 'totalValue' | 'lastUpdated'>, target: PortfolioType = 'professor') => {
        setPortfolioByType(target, prev => {
            const tentacles = prev.tentacles.map(tentacle => {
                if (tentacle.id !== newHolding.category) return tentacle;

                const existingIndex = tentacle.holdings.findIndex(h => h.ticker === newHolding.ticker);
                let updatedHoldings;

                if (existingIndex >= 0) {
                    const existing = tentacle.holdings[existingIndex];
                    const newAvgPrice = calculateWeightedAverage(
                        existing.quantity,
                        existing.averagePrice,
                        newHolding.quantity,
                        newHolding.averagePrice
                    );
                    const newQuantity = existing.quantity + newHolding.quantity;

                    updatedHoldings = [...tentacle.holdings];
                    updatedHoldings[existingIndex] = {
                        ...existing,
                        quantity: newQuantity,
                        averagePrice: newAvgPrice,
                        totalValue: newQuantity * newAvgPrice,
                        lastUpdated: new Date().toISOString()
                    };
                } else {
                    updatedHoldings = [
                        ...tentacle.holdings,
                        {
                            ...newHolding,
                            totalValue: newHolding.quantity * newHolding.averagePrice,
                            lastUpdated: new Date().toISOString()
                        }
                    ];
                }
                return { ...tentacle, holdings: updatedHoldings };
            });

            // Note: Total value here is Invested Value, but UI uses Market Value where possible.
            const totalValue = tentacles.reduce((sum, t) => sum + calculateTotalValue(t.holdings), 0);

            return { ...prev, tentacles, totalValue, lastUpdated: new Date().toISOString() };
        });
    };

    const updateHolding = (updatedHolding: Omit<AssetHolding, 'totalValue' | 'lastUpdated'>, target: PortfolioType = 'professor') => {
        setPortfolioByType(target, prev => {
            const tentacles = prev.tentacles.map(tentacle => {
                if (tentacle.id !== updatedHolding.category) return tentacle;

                const updatedHoldings = tentacle.holdings.map(h => {
                    if (h.ticker === updatedHolding.ticker) {
                        return {
                            ...h,
                            name: updatedHolding.name,
                            quantity: updatedHolding.quantity,
                            averagePrice: updatedHolding.averagePrice,
                            totalValue: updatedHolding.quantity * updatedHolding.averagePrice,
                            lastUpdated: new Date().toISOString()
                        };
                    }
                    return h;
                });
                return { ...tentacle, holdings: updatedHoldings };
            });

            const totalValue = tentacles.reduce((sum, t) => sum + calculateTotalValue(t.holdings), 0);
            return { ...prev, tentacles, totalValue, lastUpdated: new Date().toISOString() };
        });
    };

    const deleteHolding = (category: AssetCategory, ticker: string, target: PortfolioType = 'professor') => {
        setPortfolioByType(target, prev => {
            const tentacles = prev.tentacles.map(tentacle => {
                if (tentacle.id !== category) return tentacle;
                return {
                    ...tentacle,
                    holdings: tentacle.holdings.filter(h => h.ticker !== ticker)
                };
            });
            const totalValue = tentacles.reduce((sum, t) => sum + calculateTotalValue(t.holdings), 0);
            return { ...prev, tentacles, totalValue, lastUpdated: new Date().toISOString() };
        });
    };

    const resetPortfolio = (target: PortfolioType = 'professor') => {
        setPortfolioByType(target, () => INITIAL_PORTFOLIO);
    };

    const [prices, setPrices] = useState<Record<string, number>>({});
    const [isRefreshing, setIsRefreshing] = useState(false);

    const refreshPrices = async () => {
        if (isRefreshing) return;
        setIsRefreshing(true);

        // Collect all tickers from BOTH portfolios
        const tickers = new Set<string>();
        [professorPortfolio, userPortfolio].forEach(p => {
            p.tentacles.forEach(t => {
                t.holdings.forEach(h => {
                    if (h.ticker) tickers.add(h.ticker);
                });
            });
        });

        if (tickers.size === 0) {
            setIsRefreshing(false);
            return;
        }

        console.log('Fetching prices for:', Array.from(tickers));
        const newPrices = await fetchPrices(Array.from(tickers));
        setPrices(prev => ({ ...prev, ...newPrices }));
        setIsRefreshing(false);
    };

    useEffect(() => {
        refreshPrices();
        const interval = setInterval(refreshPrices, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [professorPortfolio.tentacles, userPortfolio.tentacles]);

    return (
        <PortfolioContext.Provider value={{
            portfolio: professorPortfolio, // Deprecated alias
            professorPortfolio,
            userPortfolio,
            prices,
            isRefreshing,
            refreshPrices,
            addOrUpdateHolding,
            updateHolding,
            deleteHolding,
            resetPortfolio
        }}>
            {children}
        </PortfolioContext.Provider>
    );
}

export function usePortfolio() {
    const context = useContext(PortfolioContext);
    if (!context) {
        throw new Error('usePortfolio must be used within PortfolioProvider');
    }
    return context;
}
