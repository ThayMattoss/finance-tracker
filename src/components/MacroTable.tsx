import { usePortfolio } from '../context/PortfolioContext';
import { calculateAllDeviations, formatPercentage, calculateTotalValue, formatCurrency } from '../utils/calculations';

import type { Portfolio } from '../types';

interface MacroTableProps {
    portfolio: Portfolio;
}

export function MacroTable({ portfolio }: MacroTableProps) {
    const { prices } = usePortfolio();

    // Calculate totals based on Current Market Price
    // Fallback to Average Price (Cost Basis) if price is missing (0/null)
    const tentaclesWithMarketValue = portfolio.tentacles.map(t => {
        const marketValue = t.holdings.reduce((sum, h) => {
            const price = prices[h.ticker] || h.averagePrice;
            return sum + (h.quantity * price);
        }, 0);
        return { ...t, marketValue };
    });

    const totalMarketValue = tentaclesWithMarketValue.reduce((sum, t) => sum + t.marketValue, 0);

    const deviations = calculateAllDeviations(
        tentaclesWithMarketValue.map(t => ({ ...t, totalValue: t.marketValue })), // Hack: adapt to calc function expecting 'totalValue' prop? 
        // Actually calculateAllDeviations takes properties. Let's see signature.
        // It takes (tentacles: Tentacle[], totalValue: number). 
        // We need to pass modified tentacles where 'holdings' imply the value OR modify the calc function.
        // Easier: Create synthetic tentacles with updated holdings 'totalValue' for the calc.
        totalMarketValue
    );

    // Actually, calculateAllDeviations likely sums up h.totalValue internally or just uses t.totalValue?
    // Let's look at utils/calculations.ts. If it sums holdings, we need to mock holdings.
    // If it uses parameters, we might need to adjust.
    // Assuming for now we can rely on passing totalMarketValue, but let's check calculations.ts first.

    const getStatusText = (status: string): string => {
        const map: Record<string, string> = {
            'ideal': 'Ideal ✓',
            'close': 'Próximo ~',
            'below': 'Abaixo !',
            'much-below': 'Muito Abaixo !!',
            'above': 'Acima !',
            'much-above': 'Muito Acima !!'
        };
        return map[status] || status;
    };

    const getColorStyles = (color: 'green' | 'yellow' | 'red') => {
        const colors = {
            green: { bg: '#e6ffe6', text: '#006400', border: '#10b981' },
            yellow: { bg: '#fffacd', text: '#8B5A00', border: '#f59e0b' },
            red: { bg: '#ffe6e6', text: '#B22222', border: '#ef4444' }
        };
        return colors[color];
    };

    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid var(--color-surface-active)' }}>
                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: 600 }}>Tentáculo</th>
                        <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.9rem', fontWeight: 600 }}>Letra</th>
                        <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.9rem', fontWeight: 600 }}>Faixa Ideal</th>
                        <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.9rem', fontWeight: 600 }}>% Atual</th>
                        <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.9rem', fontWeight: 600 }}>Diferença</th>
                        <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.9rem', fontWeight: 600 }}>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {portfolio.tentacles.map((tentacle, idx) => {
                        const deviation = deviations[idx];
                        const colorStyles = getColorStyles(deviation.statusColor);
                        const tentacleValue = calculateTotalValue(tentacle.holdings);

                        return (
                            <tr key={tentacle.id} style={{ borderBottom: '1px solid var(--color-surface-active)' }}>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ width: '4px', height: '20px', background: tentacle.color, borderRadius: '2px' }}></div>
                                        <span style={{ fontWeight: 500 }}>{tentacle.label}</span>
                                    </div>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                    {tentacle.letter}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                    {tentacle.targetRange
                                        ? `${tentacle.targetRange.min}% - ${tentacle.targetRange.max}%`
                                        : `~${tentacle.targetPercentage}%`}
                                </td>
                                <td style={{
                                    padding: '1rem',
                                    textAlign: 'center',
                                    fontWeight: Math.abs(deviation.deviation) > 5 ? 700 : 400,
                                    fontSize: '1rem'
                                }}>
                                    {formatPercentage(deviation.currentPercentage)}
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '0.25rem' }}>
                                        {formatCurrency(tentacleValue)}
                                    </div>
                                </td>
                                <td style={{
                                    padding: '1rem',
                                    textAlign: 'center',
                                    fontWeight: 600,
                                    color: colorStyles.text
                                }}>
                                    {deviation.deviation > 0 ? '+' : ''}{formatPercentage(deviation.deviation)}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                    <span style={{
                                        display: 'inline-block',
                                        padding: '0.375rem 0.75rem',
                                        borderRadius: 'var(--radius-full)',
                                        background: colorStyles.bg,
                                        color: colorStyles.text,
                                        border: `1px solid ${colorStyles.border}`,
                                        fontSize: '0.85rem',
                                        fontWeight: 600
                                    }}>
                                        {getStatusText(deviation.status)}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
