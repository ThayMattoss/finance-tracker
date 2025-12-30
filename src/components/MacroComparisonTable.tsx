import { usePortfolio } from '../context/PortfolioContext';
import { formatPercentage, formatCurrency, calculateDeviation, getDeviationColor } from '../utils/calculations';
import type { Portfolio } from '../types';

interface MacroComparisonTableProps {
    professorPortfolio: Portfolio;
    userPortfolio: Portfolio;
}

export function MacroComparisonTable({ professorPortfolio, userPortfolio }: MacroComparisonTableProps) {
    const { prices } = usePortfolio();

    const getPortfolioStats = (portfolio: Portfolio) => {
        const tentaclesWithMarketValue = portfolio.tentacles.map(t => {
            const marketValue = t.holdings.reduce((sum, h) => {
                const price = prices[h.ticker] || h.averagePrice;
                return sum + (h.quantity * price);
            }, 0);
            return { ...t, marketValue };
        });
        const totalMarketValue = tentaclesWithMarketValue.reduce((sum, t) => sum + t.marketValue, 0);
        return { tentaclesWithMarketValue, totalMarketValue };
    };

    const profStats = getPortfolioStats(professorPortfolio);
    const userStats = getPortfolioStats(userPortfolio);

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
            green: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: '#10b981' },
            yellow: { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: '#f59e0b' },
            red: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: '#ef4444' }
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
                        <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.9rem', fontWeight: 600 }}>% Prof (Atual)</th>
                        <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.9rem', fontWeight: 600 }}>% Seu (Atual)</th>
                        <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.9rem', fontWeight: 600 }}>Quanto Falta (R$)</th>
                        <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.9rem', fontWeight: 600 }}>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {professorPortfolio.tentacles.map((tentacle) => {
                        const userTentacle = userStats.tentaclesWithMarketValue.find(t => t.id === tentacle.id);
                        const userMarketValue = userTentacle ? userTentacle.marketValue : 0;
                        const userPercentage = userStats.totalMarketValue > 0 ? (userMarketValue / userStats.totalMarketValue) * 100 : 0;

                        const profTentacle = profStats.tentaclesWithMarketValue.find(t => t.id === tentacle.id);
                        const profPercentage = profStats.totalMarketValue > 0 ? (profTentacle!.marketValue / profStats.totalMarketValue) * 100 : 0;

                        const targetPercentage = tentacle.targetPercentage;

                        // "Quanto falta" logic: (Target% - User%) * TotalPortfolio
                        const missingAmount = Math.max(0, (targetPercentage - userPercentage) / 100 * userStats.totalMarketValue);

                        const status = calculateDeviation(userPercentage, targetPercentage);
                        const colorStyles = getColorStyles(getDeviationColor(status));

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
                                <td style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                    {tentacle.targetRange
                                        ? `${tentacle.targetRange.min}% - ${tentacle.targetRange.max}%`
                                        : `${tentacle.targetPercentage}%`}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
                                    {formatPercentage(profPercentage)}
                                </td>
                                <td style={{
                                    padding: '1rem',
                                    textAlign: 'center',
                                    fontWeight: 700,
                                    fontSize: '1rem',
                                    color: 'var(--color-text-primary)'
                                }}>
                                    {formatPercentage(userPercentage)}
                                </td>
                                <td style={{
                                    padding: '1rem',
                                    textAlign: 'right',
                                    fontSize: '1rem',
                                    fontWeight: 700,
                                    color: missingAmount > 0 ? 'var(--color-warning)' : 'var(--color-text-tertiary)'
                                }}>
                                    {missingAmount > 0 ? formatCurrency(missingAmount) : '-'}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                    <span style={{
                                        display: 'inline-block',
                                        padding: '0.375rem 0.75rem',
                                        borderRadius: 'var(--radius-full)',
                                        background: colorStyles.bg,
                                        color: colorStyles.text,
                                        border: `1px solid ${colorStyles.border}`,
                                        fontSize: '0.8rem',
                                        fontWeight: 700
                                    }}>
                                        {getStatusText(status)}
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
