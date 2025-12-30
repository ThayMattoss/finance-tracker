import type { AnalysisResult } from './analysis';

export interface InvestmentSuggestion {
    ticker: string;
    suggestedAmount: number;
    suggestedQuantity: number;
    reason: string;
    priority: number;
    phase: 'reserve' | 'proportional';
}

export interface InvestmentPlan {
    suggestions: InvestmentSuggestion[];
    totalAllocated: number;
    totalReserved: number;
    reservedForMissingAssets: number;
    availableForProportional: number;
    reserveReason: string;
}

const MIN_INVESTMENT = 100;

export function calculateInvestmentPlan(
    availableCash: number,
    analysisResults: AnalysisResult[],
    professorCash: number = 0
): InvestmentPlan {
    const totalRequiredParity = analysisResults.reduce((sum, a) => sum + a.valueToParity, 0);
    const availableForProportional = availableCash - professorCash - totalRequiredParity;
    const netAvailableForInvestment = Math.max(0, availableCash - professorCash);

    if (netAvailableForInvestment <= 0 && availableCash >= 0) {
        return {
            suggestions: [],
            totalAllocated: 0,
            totalReserved: availableCash,
            reservedForMissingAssets: 0,
            availableForProportional: availableForProportional,
            reserveReason: 'Caixa mantido para paridade com professor'
        };
    }

    const suggestions: InvestmentSuggestion[] = [];

    // ===== PHASE 1: Allocate for Physical Parity (Missing/Below Assets) =====
    const assetsNeedingParity = analysisResults.filter(a => a.valueToParity > 0);

    let allocatedForParity = 0;
    let remainingNetCash = netAvailableForInvestment;

    for (const asset of assetsNeedingParity) {
        const needed = asset.valueToParity;

        // Even if the theoretical reserve is higher (using Max Price), 
        // we only allocate based on current price/limit for the suggestions.
        const maxAllowedValue = asset.professorTotalValue * asset.maxMultiple;
        const maxSuggestedByLimit = Math.max(0, maxAllowedValue - asset.userTotalValue);
        const finalAssetNeed = Math.min(needed, maxSuggestedByLimit);

        if (remainingNetCash >= 1 && finalAssetNeed > 0) {
            const amount = Math.min(remainingNetCash, finalAssetNeed);
            if (amount >= 1) {
                allocatedForParity += amount;
                remainingNetCash -= amount;
                suggestions.push({
                    ticker: asset.ticker,
                    suggestedAmount: amount,
                    suggestedQuantity: Math.floor(amount / asset.currentPrice),
                    reason: asset.userQuantity === 0 ? 'Reserva para ativo faltante' : 'Aporte para paridade física',
                    priority: 100,
                    phase: 'reserve'
                });
            }
        }
    }

    // ===== PHASE 2: Proportional Growth =====
    if (availableForProportional >= MIN_INVESTMENT && remainingNetCash >= MIN_INVESTMENT) {
        const growthAssets = analysisResults.filter(a =>
            a.userPercentage < a.professorPercentage &&
            a.userTotalValue < (a.professorTotalValue * a.maxMultiple) &&
            (a.recommendation === 'BUY' || a.recommendation === 'MODERATE')
        );

        if (growthAssets.length > 0) {
            const opportunities = growthAssets.map(asset => {
                const gap = asset.professorPercentage - asset.userPercentage;
                let priority = gap * 100;
                if (asset.recommendation === 'BUY') priority *= 2;

                const maxAllowedValue = asset.professorTotalValue * asset.maxMultiple;
                const maxSuggestedByLimit = Math.max(0, maxAllowedValue - asset.userTotalValue);

                return {
                    ...asset,
                    gap,
                    priority: Math.max(0, priority),
                    maxSuggestedByLimit
                };
            }).sort((a, b) => b.priority - a.priority);

            const totalPriority = opportunities.reduce((sum, o) => sum + o.priority, 0);

            for (const opp of opportunities) {
                if (remainingNetCash < MIN_INVESTMENT) break;

                // Only distribute based on available cash for proportional
                // The priority logic is fine, but we use remainingNetCash to limit actual spending
                const proportionalAmount = (opp.priority / totalPriority) * Math.max(0, availableForProportional);
                const suggestedAmount = Math.min(
                    Math.floor(proportionalAmount),
                    remainingNetCash,
                    opp.maxSuggestedByLimit
                );

                if (suggestedAmount >= MIN_INVESTMENT) {
                    remainingNetCash -= suggestedAmount;
                    suggestions.push({
                        ticker: opp.ticker,
                        suggestedAmount,
                        suggestedQuantity: Math.floor(suggestedAmount / opp.currentPrice),
                        reason: opp.recommendation === 'BUY' ? 'Oportunidade de compra' : 'Crescimento proporcional',
                        priority: opp.priority,
                        phase: 'proportional'
                    });
                }
            }
        }
    }

    const totalAllocated = netAvailableForInvestment - remainingNetCash;
    const totalReserved = availableCash - totalAllocated;

    return {
        suggestions,
        totalAllocated,
        totalReserved,
        reservedForMissingAssets: allocatedForParity,
        availableForProportional: availableForProportional,
        reserveReason: totalReserved > professorCash
            ? 'Reservado para paridade e caixa'
            : 'Caixa mantido para paridade com professor'
    };
}
