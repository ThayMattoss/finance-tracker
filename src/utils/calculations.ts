import type { AssetHolding, DeviationStatus, Tentacle } from '../types';

/**
 * Calculate weighted average price when adding new purchase
 */
export function calculateWeightedAverage(
    currentQuantity: number,
    currentAvgPrice: number,
    newQuantity: number,
    newPrice: number
): number {
    const totalCost = currentQuantity * currentAvgPrice + newQuantity * newPrice;
    const totalQuantity = currentQuantity + newQuantity;
    return totalCost / totalQuantity;
}

/**
 * Calculate total value of all holdings
 */
export function calculateTotalValue(holdings: AssetHolding[]): number {
    return holdings.reduce((sum, holding) => sum + holding.totalValue, 0);
}

/**
 * Calculate deviation status for a tentacle
 */
export function calculateDeviation(
    currentPercentage: number,
    targetPercentage: number
): DeviationStatus['status'] {
    const deviation = Math.abs(currentPercentage - targetPercentage);

    // Special case: If the user has 0% (nothing invested) and the target is relevant (>1%),
    // it should be considered "Below" (Abaixo), not "Ideal", even if the deviation is small (e.g., 3%).
    if (currentPercentage === 0 && targetPercentage > 1) {
        return 'below';
    }

    if (deviation <= 5) return 'ideal';
    if (deviation <= 10) return 'close';

    if (currentPercentage < targetPercentage) {
        return deviation > 15 ? 'much-below' : 'below';
    } else {
        return deviation > 15 ? 'much-above' : 'above';
    }
}

/**
 * Get color based on deviation status
 */
export function getDeviationColor(status: DeviationStatus['status']): DeviationStatus['statusColor'] {
    if (status === 'ideal') return 'green';
    if (status === 'close') return 'yellow';
    return 'red';
}

/**
 * Calculate all deviations for tentacles
 */
export function calculateAllDeviations(
    tentacles: Tentacle[],
    totalValue: number
): DeviationStatus[] {
    return tentacles.map(tentacle => {
        const tentacleValue = calculateTotalValue(tentacle.holdings);
        const currentPercentage = totalValue > 0 ? (tentacleValue / totalValue) * 100 : 0;
        const deviation = currentPercentage - tentacle.targetPercentage;
        const status = calculateDeviation(currentPercentage, tentacle.targetPercentage);

        return {
            tentacleId: tentacle.id,
            currentPercentage,
            targetPercentage: tentacle.targetPercentage,
            deviation,
            status,
            statusColor: getDeviationColor(status)
        };
    });
}

/**
 * Format currency to BRL
 */
export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals = 1): string {
    return `${value.toFixed(decimals)}%`;
}
