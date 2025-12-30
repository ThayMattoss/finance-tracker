import { usePortfolio } from '../context/PortfolioContext';
import { PieChartAllocation } from '../components/PieChartAllocation';
import { formatCurrency } from '../utils/calculations';
import { TrendingUp } from 'lucide-react';
import { MacroComparisonTable } from '../components/MacroComparisonTable';

export function DashboardPage() {
    const { professorPortfolio, userPortfolio, prices } = usePortfolio();

    // --- Data Preparation Helper ---
    const getPortfolioData = (portfolio: typeof professorPortfolio) => {
        const tentaclesWithMarketValue = portfolio.tentacles.map(t => {
            const marketValue = t.holdings.reduce((sum, h) => {
                const price = prices[h.ticker] || h.averagePrice;
                return sum + (h.quantity * price);
            }, 0);
            return { ...t, marketValue };
        });

        const totalMarketValue = tentaclesWithMarketValue.reduce((sum, t) => sum + t.marketValue, 0);

        const chartData = tentaclesWithMarketValue.map(t => ({
            name: t.label,
            value: t.marketValue,
            color: t.color,
            letter: t.letter
        }));

        return { totalMarketValue, chartData };
    };

    const professorData = getPortfolioData(professorPortfolio);
    const userData = getPortfolioData(userPortfolio);

    // --- Metrics for Summary Cards ---
    const getDetailedMetrics = (portfolio: typeof professorPortfolio, data: any) => {
        const cashTentacle = portfolio.tentacles.find(t => t.id === 'CAIXA');
        const cashValue = (cashTentacle?.holdings.reduce((sum, h) => {
            const price = prices[h.ticker] || h.averagePrice;
            return sum + (h.quantity * price);
        }, 0)) || 0;

        const investedValue = data.totalMarketValue - cashValue;

        const totalInvestedCost = portfolio.tentacles.reduce((sum, t) =>
            sum + t.holdings.reduce((s, h) => s + (h.quantity * h.averagePrice), 0),
            0);

        const investedCostRisk = totalInvestedCost - cashValue;

        const riskProfit = investedValue - investedCostRisk;
        const consolidatedValuation = investedCostRisk <= 0 ? 0 : ((investedValue / investedCostRisk) - 1) * 100;

        return { cashValue, investedValue, consolidatedValuation, totalMarketValue: data.totalMarketValue, riskProfit };
    };

    const profMetrics = getDetailedMetrics(professorPortfolio, professorData);
    const userMetrics = getDetailedMetrics(userPortfolio, userData);

    return (
        <div style={{ paddingBottom: '4rem' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                    Dashboard
                </h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                    Comparativo da sua alocação vs. Estratégia do Professor.
                </p>
            </header>

            {/* Summary Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
            }}>
                {/* Your Portfolio Card */}
                <div className="glass-panel" style={{ padding: '1.5rem', border: '1px solid rgba(var(--color-primary-rgb), 0.2)', background: 'rgba(var(--color-primary-rgb), 0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-primary)' }}>SUA CARTEIRA</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: userMetrics.riskProfit >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                                {userMetrics.riskProfit >= 0 ? '+' : ''}{formatCurrency(userMetrics.riskProfit)}
                            </span>
                            <div style={{ padding: '0.25rem 0.5rem', background: userMetrics.consolidatedValuation >= 0 ? 'var(--color-success)' : 'var(--color-error)', color: 'white', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 800 }}>
                                {(userMetrics.consolidatedValuation >= 0 ? '+' : '') + userMetrics.consolidatedValuation.toFixed(2)}%
                            </div>
                        </div>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem' }}>{formatCurrency(userMetrics.totalMarketValue)}</div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Investido</div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{formatCurrency(userMetrics.investedValue)}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{((userMetrics.investedValue / userMetrics.totalMarketValue) * 100).toFixed(0)}% Risco</div>
                        </div>
                        <div style={{ flex: 1, borderLeft: '1px solid var(--color-surface-active)', paddingLeft: '1rem' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Caixa</div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-info)' }}>{formatCurrency(userMetrics.cashValue)}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{((userMetrics.cashValue / userMetrics.totalMarketValue) * 100).toFixed(0)}% Oport.</div>
                        </div>
                    </div>
                </div>

                {/* Professor Portfolio Card */}
                <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255, 255, 255, 0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>CARTEIRA PROFESSOR</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: profMetrics.riskProfit >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                                {profMetrics.riskProfit >= 0 ? '+' : ''}{formatCurrency(profMetrics.riskProfit)}
                            </span>
                            <div style={{ padding: '0.25rem 0.5rem', background: 'var(--color-surface-active)', color: 'var(--color-text-primary)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 800 }}>
                                {(profMetrics.consolidatedValuation >= 0 ? '+' : '') + profMetrics.consolidatedValuation.toFixed(2)}%
                            </div>
                        </div>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>{formatCurrency(profMetrics.totalMarketValue)}</div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Investido</div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{formatCurrency(profMetrics.investedValue)}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{((profMetrics.investedValue / profMetrics.totalMarketValue) * 100).toFixed(0)}% Risco</div>
                        </div>
                        <div style={{ flex: 1, borderLeft: '1px solid var(--color-surface-active)', paddingLeft: '1rem' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Caixa</div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-info)' }}>{formatCurrency(profMetrics.cashValue)}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{((profMetrics.cashValue / profMetrics.totalMarketValue) * 100).toFixed(0)}% Oport.</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Comparative Charts Section */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
            }}>
                <PieChartAllocation
                    title="Minha Carteira (Alocação Atual)"
                    data={userData.chartData}
                    totalValue={userData.totalMarketValue}
                />
                <PieChartAllocation
                    title="Carteira do Professor (Alocação Atual)"
                    data={professorData.chartData}
                    totalValue={professorData.totalMarketValue}
                />
            </div>

            {/* Analysis Section */}
            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <TrendingUp size={24} color="var(--color-primary)" />
                    Visão Macro dos Tentáculos (Comparativo)
                </h2>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <MacroComparisonTable
                        professorPortfolio={professorPortfolio}
                        userPortfolio={userPortfolio}
                    />
                </div>
            </section>
        </div>
    );
}
