import type { AssetSettings } from '../types/settings';

export type RecommendationStatus = 'BUY' | 'MODERATE' | 'AVOID';
export type AlignmentStatus = 'aligned' | 'above' | 'below';
export type PriceStatus = 'good' | 'neutral' | 'bad';
export type MultipleStatus = 'ok' | 'exceeded';

export interface AnalysisResult {
    ticker: string;
    assetType: string;

    // Portfolio Data
    userQuantity: number;
    userAveragePrice: number;
    userTotalValue: number;
    userPercentage: number;

    professorQuantity: number;
    professorAveragePrice: number;
    professorTotalValue: number;
    professorPercentage: number;

    currentPrice: number;

    // Analysis
    percentageDiff: number; // User% - Prof%
    multipleCurrent: number; // UserValue / ProfValue (if Prof > 0)

    // Statuses
    alignmentStatus: AlignmentStatus;
    priceStatus: PriceStatus;
    multipleStatus: MultipleStatus;

    // Final Recommendation
    recommendation: RecommendationStatus;
    reason: string[];
    maxMultiple: number;
    maxQuantity: number;
    targetQuantity: number;
    valueToParity: number;
    maxPrice: number;
}

export function analyzeAsset(
    ticker: string,
    assetType: string,
    userHolding: { quantity: number; averagePrice: number; totalValue: number; percentage: number } | undefined,
    professorHolding: { quantity: number; averagePrice: number; totalValue: number; percentage: number } | undefined,
    currentPrice: number,
    settings: AssetSettings,
    globalIncreasePercentage: number = 0
): AnalysisResult {
    const userQ = userHolding?.quantity || 0;
    const userAvg = userHolding?.averagePrice || 0;
    const userVal = userHolding?.totalValue || 0;
    const userPct = userHolding?.percentage || 0;

    const profQ = professorHolding?.quantity || 0;
    const profAvg = professorHolding?.averagePrice || 0;
    const profVal = professorHolding?.totalValue || 0;
    const profPct = professorHolding?.percentage || 0;

    const reasons: string[] = [];

    // --- Calculate total portfolio values to determine alignment gaps ---
    // User Value Needed = (professorPercentage / 100) * UserTotalValue
    // However, we don't have UserTotalValue directly here, but we have userVal and userPct
    // So UserTotalValue = userVal / (userPct / 100)
    // To be more precise, we use the professor's total value as reference, or better, calculate it in the page.
    // For now, let's use the percentage diff approach which is more robust.

    // We'll calculate valueToParity in the Page component instead, or pass a reference value.
    // Actually, analyzeAsset already receives percentages.
    // Value To Parity = (profPct - userPct) / userPct * userVal (if userPct > 0)
    // Or we simply add it to the interface and let the page populate it.

    // --- 1. Alignment Analysis ---
    // Compare User% vs Prof%
    const percentageDiff = userPct - profPct;
    let alignmentStatus: AlignmentStatus = 'aligned';

    // Logic: If user has more % than professor, they are "above" target direction
    if (percentageDiff > 0.5) { // Tolerance of 0.5%
        alignmentStatus = 'above';
        reasons.push('Percentual acima da referência');
    } else if (percentageDiff < -0.5) {
        alignmentStatus = 'below';
    } else {
        alignmentStatus = 'aligned';
    }

    // --- 2. Price Analysis ---
    // Use the configured acceptable percentage from Settings
    // If manual override exists, use it; otherwise use default for asset type
    const acceptablePercentage = settings.manualAcceptablePercentage || 5; // Fallback to 5% if not configured
    const acceptableMultiplier = 1 + (acceptablePercentage / 100);
    const maxPrice = profAvg * acceptableMultiplier;
    let priceStatus: PriceStatus = 'neutral';

    // Target Quantity = Professor Quantity + Global Percentage Increase
    const targetQuantity = Math.ceil(profQ * (1 + globalIncreasePercentage / 100));

    // Value To Parity = Total value needed to reach TARGET quantity (Physical Parity + Global Increase)
    // Considering the Max Price user is willing to pay
    const quantityGap = Math.max(0, targetQuantity - userQ);
    const valueToParity = quantityGap * maxPrice;

    if (profAvg > 0) {
        if (currentPrice < profAvg) {
            priceStatus = 'good';
        } else if (currentPrice > profAvg * acceptableMultiplier) {
            priceStatus = 'bad';
            reasons.push(`Preço esticado (>${acceptablePercentage}% vs Professor)`);
        } else {
            priceStatus = 'neutral';
        }
    } else {
        // If professor doesn't have it (or avg is 0), fallback to user avg or neutral
        if (userAvg > 0 && currentPrice < userAvg) priceStatus = 'good';
    }

    // --- 3. Multiple Analysis ---
    let multipleCurrent = 0;
    let multipleStatus: MultipleStatus = 'ok';

    // The user wants the Global Increase to be the NEW 1:1 baseline.
    // So if Target Quantity is 22 and user has 22, Multiple = 1.0x.
    if (targetQuantity > 0) {
        multipleCurrent = userQ / targetQuantity;
    } else if (userQ > 0) {
        multipleCurrent = 999;
    }

    const maxMultiple = settings.allowMultiples ? settings.maxMultiple : 1.0;
    // Max Quantity is now (Professor + Global Increase) * Max Multiple
    const maxQuantity = Math.floor(targetQuantity * maxMultiple);

    if (settings.allowMultiples) {
        if (multipleCurrent > settings.maxMultiple) {
            multipleStatus = 'exceeded';
            reasons.push(`Múltiplo excedido (${multipleCurrent.toFixed(1)}x > ${settings.maxMultiple}x)`);
        }
    } else {
        // If multiples NOT allowed, strictly cap at 1.0 (or close to it)
        // Using 1.05 tolerance
        if (multipleCurrent > 1.05) {
            multipleStatus = 'exceeded';
            reasons.push('Múltiplo excedido (Max 1.0x)');
        }
    }

    // --- 4. Final Recommendation ---
    let recommendation: RecommendationStatus = 'MODERATE';

    // Strictness: If multiple is very close to limit (e.g. > 98%), considering it "full"
    // even if not strictly "exceeded" yet.
    const limit = settings.allowMultiples ? settings.maxMultiple : 1.0;
    const isAtLimit = multipleCurrent >= (limit * 0.98);
    const reachedMaxQuantity = userQ >= maxQuantity && maxQuantity > 0;

    // Logic Tree
    if (multipleStatus === 'exceeded') {
        recommendation = 'AVOID';
    } else if (reachedMaxQuantity) {
        recommendation = 'AVOID';
        reasons.push('Quantidade máxima atingida');
    } else if (alignmentStatus === 'above') {
        recommendation = 'AVOID';
    } else if (priceStatus === 'bad') {
        recommendation = 'AVOID';
    } else if (isAtLimit) {
        recommendation = 'MODERATE';
        reasons.push('No limite do múltiplo');
    } else {
        // We are within limits and price is not 'bad' (> maxPrice)
        // Now differentiate between BUY (below average) and MODERATE (above average but below max)
        if (priceStatus === 'good') {
            // Price < Professor Average
            recommendation = 'BUY';
        } else {
            // Price is 'neutral' (between Average and MaxPrice)
            recommendation = 'MODERATE';
            reasons.push('Preço acima da média (Moderar)');
        }
    }

    return {
        ticker,
        assetType,
        userQuantity: userQ,
        userAveragePrice: userAvg,
        userTotalValue: userVal,
        userPercentage: userPct,
        professorQuantity: profQ,
        professorAveragePrice: profAvg,
        professorTotalValue: profVal,
        professorPercentage: profPct,
        currentPrice,
        percentageDiff,
        multipleCurrent,
        alignmentStatus,
        priceStatus,
        multipleStatus,
        recommendation,
        reason: reasons,
        maxMultiple,
        maxQuantity,
        targetQuantity,
        valueToParity,
        maxPrice
    };
}
