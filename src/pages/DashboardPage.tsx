import { usePortfolio } from '../context/PortfolioContext';
import { PieChartAllocation } from '../components/PieChartAllocation';
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
