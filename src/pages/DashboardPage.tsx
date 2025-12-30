import { usePortfolio } from '../context/PortfolioContext';
import { PieChartAllocation } from '../components/PieChartAllocation';
import { calculateTotalValue, formatPercentage, calculateAllDeviations } from '../utils/calculations';
import { ArrowLeft, ArrowRight, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

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

        // Calculate current percentages for deviation analysis
        const percentages = tentaclesWithMarketValue.map(t => ({
            id: t.id,
            label: t.label,
            percentage: totalMarketValue > 0 ? (t.marketValue / totalMarketValue) * 100 : 0
        }));

        return { totalMarketValue, chartData, percentages };
    };

    const professorData = getPortfolioData(professorPortfolio);
    const userData = getPortfolioData(userPortfolio);

    // --- Deviation Analysis ---
    // Compare User's Actual % vs Professor's TARGET % (Ideal), not Professor's Actual
    // because the goal is to follow the Professor's STRATEGY (Targets), which he himself might deviate from slightly.
    const deviations = professorPortfolio.tentacles.map(targetTentacle => {
        const userTentacle = userData.percentages.find(p => p.id === targetTentacle.id);
        const professorTentacle = professorData.percentages.find(p => p.id === targetTentacle.id);

        const userPercentage = userTentacle ? userTentacle.percentage : 0;
        const professorPercentage = professorTentacle ? professorTentacle.percentage : 0;
        const targetPercentage = targetTentacle.targetPercentage;

        const diff = userPercentage - targetPercentage;

        return {
            id: targetTentacle.id,
            label: targetTentacle.label,
            userPercentage,
            professorPercentage, // Added this field
            targetPercentage,
            diff,
            status: Math.abs(diff) <= 2 ? 'ideal' : (diff < 0 ? 'below' : 'above')
        };
    }).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)); // Sort by biggest deviation

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

            {/* Comparative Charts Section */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
            }}>
                <PieChartAllocation
                    title="Carteira do Professor (Alocação Atual)"
                    data={professorData.chartData}
                    totalValue={professorData.totalMarketValue}
                />
                <PieChartAllocation
                    title="Minha Carteira (Alocação Atual)"
                    data={userData.chartData}
                    totalValue={userData.totalMarketValue}
                />
            </div>

            {/* Analysis Section */}
            <section className="glass-panel" style={{ padding: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <TrendingUp size={24} color="var(--color-primary)" />
                    Análise de Aderência à Estratégia
                </h2>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--color-surface-active)', textAlign: 'left' }}>
                                <th style={{ padding: '1rem' }}>Tentáculo</th>
                                <th style={{ padding: '1rem', textAlign: 'center' }}>Objetivo (Prof)</th>
                                <th style={{ padding: '1rem', textAlign: 'center' }}>Sua Carteira</th>
                                <th style={{ padding: '1rem', textAlign: 'center' }}>Desvio</th>
                                <th style={{ padding: '1rem' }}>Ação Recomendada</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deviations.map(dev => (
                                <tr key={dev.id} style={{ borderBottom: '1px solid var(--color-surface-active)' }}>
                                    <td style={{ padding: '1rem', fontWeight: 500 }}>{dev.label}</td>
                                    <td style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                        {formatPercentage(dev.targetPercentage)}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 700 }}>
                                        {formatPercentage(dev.userPercentage)}
                                    </td>
                                    <td style={{
                                        padding: '1rem',
                                        textAlign: 'center',
                                        color: dev.diff > 0 ? 'var(--color-warning)' : (dev.diff < 0 ? 'var(--color-error)' : 'var(--color-success)'),
                                        fontWeight: 600
                                    }}>
                                        {dev.diff > 0 ? '+' : ''}{formatPercentage(dev.diff)}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {dev.status === 'ideal' ? (
                                            <span style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                Tudo certo!
                                            </span>
                                        ) : dev.status === 'below' ? (
                                            <Link to="/wallet" style={{ color: 'var(--color-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 500 }}>
                                                Aportar <ArrowRight size={16} />
                                            </Link>
                                        ) : (
                                            <span style={{ color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                Aguardar / Rebalancear
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
