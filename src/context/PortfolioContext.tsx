import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type { Portfolio, AssetHolding, AssetCategory } from '../types';
import { INITIAL_PORTFOLIO, KRAKEN_TENTACLES } from '../data/professor';
import { INITIAL_USER_PORTFOLIO } from '../data/user';
import { loadPortfolio, savePortfolio, loadPrices, savePrices, STORAGE_KEYS } from '../utils/storage';
import { calculateWeightedAverage, calculateTotalValue } from '../utils/calculations';
import { fetchPrices } from '../services/priceService';

type PortfolioType = 'professor' | 'user';

interface PortfolioContextType {
    portfolio: Portfolio; // Deprecated: alias for professorPortfolio for backward compatibility temporarily
    professorPortfolio: Portfolio;
    userPortfolio: Portfolio;
    prices: Record<string, number>;
    isRefreshing: boolean;
    loading: boolean;
    refreshPrices: () => Promise<void>;
    addOrUpdateHolding: (holding: Omit<AssetHolding, 'totalValue' | 'lastUpdated'>, target?: PortfolioType) => void;
    updateHolding: (holding: Omit<AssetHolding, 'totalValue' | 'lastUpdated'>, target?: PortfolioType) => void;
    deleteHolding: (category: AssetCategory, ticker: string, target?: PortfolioType) => void;
    resetPortfolio: (target?: PortfolioType) => void;
    importData: (professor: Portfolio, user: Portfolio) => void;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();

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
    const [professorPortfolio, setProfessorPortfolio] = useState<Portfolio>(INITIAL_PORTFOLIO);

    // User Portfolio State
    const [userPortfolio, setUserPortfolio] = useState<Portfolio>(INITIAL_USER_PORTFOLIO);

    const [loading, setLoading] = useState(true);

    // Load data from Supabase on Login
    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const loadCloudData = async () => {
            setLoading(true);
            const { data } = await supabase
                .from('user_data')
                .select('portfolio_data')
                .eq('user_id', user.id)
                .single();

            if (data && data.portfolio_data) {
                if (data.portfolio_data.professor) {
                    setProfessorPortfolio(mergeWithStructure(data.portfolio_data.professor));
                }
                if (data.portfolio_data.user) {
                    setUserPortfolio(mergeWithStructure(data.portfolio_data.user));
                }
            } else {
                // If no cloud data, try local storage (migration scenario)
                const localProf = loadPortfolio(STORAGE_KEYS.PROFESSOR);
                const localUser = loadPortfolio(STORAGE_KEYS.USER);

                if (localProf) setProfessorPortfolio(mergeWithStructure(localProf));
                if (localUser) setUserPortfolio(mergeWithStructure(localUser));
            }
            setLoading(false);
        };

        loadCloudData();
    }, [user]);

    // Persist changes to Cloud (Debounced)
    useEffect(() => {
        if (!user) return;

        const saveData = async () => {
            try {
                await supabase.from('user_data').upsert({
                    user_id: user.id,
                    portfolio_data: {
                        professor: professorPortfolio,
                        user: userPortfolio
                    },
                    updated_at: new Date().toISOString()
                });
            } catch (err) {
                console.error('Error saving to cloud:', err);
            }
        };

        const timeoutId = setTimeout(saveData, 2000); // 2 second debounce
        return () => clearTimeout(timeoutId);
    }, [professorPortfolio, userPortfolio, user]);

    // Keep LocalStorage as backup/cache
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
        // Specific ticker refresh optimization could be added here, 
        // but for now we rely on the periodic update or manual user refresh 
        // to avoid race conditions with state updates.
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

    const importData = (professor: Portfolio, user: Portfolio) => {
        setProfessorPortfolio(professor);
        setUserPortfolio(user);
        // Trigger price refresh after import
        setTimeout(() => refreshPrices(), 100);
    };

    const [prices, setPrices] = useState<Record<string, number>>({
        // Professor Reference Prices to match 30/12/2025 report
        'PROF_FII_01': 413.513, 'PROF_FII_02': 413.513, 'PROF_FII_03': 413.513, 'PROF_FII_04': 413.513, 'PROF_FII_05': 413.513,
        'PROF_FII_06': 413.513, 'PROF_FII_07': 413.513, 'PROF_FII_08': 413.513, 'PROF_FII_09': 413.513, 'PROF_FII_10': 413.513,
        'PROF_ACAO_01': 387.284, 'PROF_ACAO_02': 387.284, 'PROF_ACAO_03': 387.284, 'PROF_ACAO_04': 387.284, 'PROF_ACAO_05': 387.284,
        'SPXB11': 750.60
    });
    const [isRefreshing, setIsRefreshing] = useState(false);

    const refreshPrices = async () => {
        if (isRefreshing) return;
        setIsRefreshing(true);

        // Collect all tickers from BOTH portfolios
        const tickers = new Set<string>();
        [professorPortfolio, userPortfolio].forEach(p => {
            p.tentacles.forEach(t => {
                t.holdings.forEach(h => {
                    // Filter out internal/dummy tickers and empty ones
                    if (h.ticker && !h.ticker.startsWith('PROF_') && h.ticker !== 'INTER') {
                        tickers.add(h.ticker);
                    }
                });
            });
        });

        if (tickers.size === 0) {
            setIsRefreshing(false);
            return;
        }

        try {
            // console.log('Fetching prices for:', Array.from(tickers));
            const newPrices = await fetchPrices(Array.from(tickers));

            setPrices(prev => {
                const updated = { ...prev, ...newPrices };
                savePrices(updated); // Save to cache
                return updated;
            });
        } catch (error) {
            console.error('Failed to update prices:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        refreshPrices();
        const interval = setInterval(refreshPrices, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []); // Fixed: Removed unstable dependencies to prevent infinite loops

    return (
        <PortfolioContext.Provider value={{
            portfolio: professorPortfolio, // Deprecated alias
            professorPortfolio,
            userPortfolio,
            prices,
            isRefreshing,
            loading, // Expose loading state
            refreshPrices,
            addOrUpdateHolding,
            updateHolding,
            deleteHolding,
            resetPortfolio,
            importData
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
