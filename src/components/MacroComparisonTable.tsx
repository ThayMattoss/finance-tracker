import { usePortfolio } from '../context/PortfolioContext';
import { formatPercentage, formatCurrency } from '../utils/calculations';
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

    const getStatusInfo = (diff: number) => {
        // diff = Ideal - Actual
        // Positive diff means we need to BUY (under-allocated)

        if (diff > 1) return { label: 'Comprar', color: 'var(--color-success)', bg: 'rgba(16, 185, 129, 0.1)' };
        // If not strictly "Buy", we consider it simply "OK" or "Balanced" for now to reduce noise.
        // User is accumulating, so "Wait" is less relevant.
        return { label: '---', color: 'var(--color-text-tertiary)', bg: 'transparent' };
    };

    return (
        <div style={{ overflowX: 'auto', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: '0.5rem' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
                <thead>
                    <tr>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Tentáculo de Investimento</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Sua Alocação</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Meta Kraken</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Aporte Necessário</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Status</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', opacity: 0.6 }}>Ref. Professor</th>
                    </tr>
                </thead>
                <tbody>
                    {professorPortfolio.tentacles.map((tentacle) => {
                        const userTentacle = userStats.tentaclesWithMarketValue.find(t => t.id === tentacle.id);
                        const userMarketValue = userTentacle ? userTentacle.marketValue : 0;
                        const userPercentage = userStats.totalMarketValue > 0 ? (userMarketValue / userStats.totalMarketValue) * 100 : 0;

                        const profTentacle = profStats.tentaclesWithMarketValue.find(t => t.id === tentacle.id);
                        const profMarketValue = profTentacle ? profTentacle.marketValue : 0;
                        const profPercentage = profStats.totalMarketValue > 0 ? (profMarketValue / profStats.totalMarketValue) * 100 : 0;

                        // Calculation: Target - User. 
                        // If result is positive, we need to ADD this % to the portfolio.
                        const diffPercentage = tentacle.targetPercentage - userPercentage;

                        // Value to add = Total Portfolio Value * (Diff% / 100)
                        // If Diff% is negative (over-allocated), result is negative (Surplus).
                        // We only show positive amounts as "Necessary Contribution".
                        const amountToAdjust = (diffPercentage / 100) * userStats.totalMarketValue;

                        const status = getStatusInfo(diffPercentage);

                        return (
                            <tr key={tentacle.id} style={{ background: 'rgba(255,255,255,0.02)', transition: 'background 0.2s' }}>
                                <td style={{ padding: '1rem', borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: '4px', height: '32px', background: tentacle.color, borderRadius: '4px' }}></div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{tentacle.label}</div>
                                        </div>
                                    </div>
                                </td>

                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>
                                        {formatPercentage(userPercentage)}
                                    </div>
                                </td>

                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: tentacle.color }}>
                                        {formatPercentage(tentacle.targetPercentage)}
                                    </div>
                                </td>

                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    <div style={{ fontWeight: 700, fontSize: '1rem', color: amountToAdjust > 0 ? 'var(--color-success)' : 'var(--color-text-tertiary)' }}>
                                        {amountToAdjust > 0 ? formatCurrency(amountToAdjust) : '-'}
                                    </div>
                                    {amountToAdjust > 0 && (
                                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
                                            Falta para atingir {formatPercentage(tentacle.targetPercentage)}
                                        </div>
                                    )}
                                </td>

                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                    <span style={{
                                        display: 'inline-block',
                                        padding: '0.4rem 0.8rem',
                                        borderRadius: '6px',
                                        background: status.bg,
                                        color: status.color,
                                        fontSize: '0.8rem',
                                        fontWeight: 800,
                                        border: `1px solid ${status.color}30`
                                    }}>
                                        {status.label.toUpperCase()}
                                    </span>
                                </td>

                                <td style={{ padding: '1rem', textAlign: 'center', borderTopRightRadius: '8px', borderBottomRightRadius: '8px', opacity: 0.6 }}>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                        {formatPercentage(profPercentage)}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(var(--color-primary-rgb), 0.05)', borderRadius: '8px', display: 'flex', gap: '2rem', alignItems: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                    <strong>Legenda:</strong>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-success)' }}></span>
                    <span style={{ fontSize: '0.8rem' }}>Comprar (Aporte Necessário)</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', opacity: 0.5 }}>
                    <span style={{ fontSize: '0.8rem' }}>--- (Sem ação necessária)</span>
                </div>
            </div>
        </div>
    );
}
