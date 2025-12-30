import { useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { ExpandableTentacleCard } from '../components/ExpandableTentacleCard';
import { AddPurchaseModal } from '../components/AddPurchaseModal';
import { formatCurrency } from '../utils/calculations';

export function MyWalletPage() {
    const { userPortfolio, refreshPrices, isRefreshing, prices } = usePortfolio();
    const portfolio = userPortfolio;
    const [isModalOpen, setIsModalOpen] = useState(false);

    const lastUpdatedDate = portfolio.lastUpdated
        ? new Date(portfolio.lastUpdated).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
        : 'Nunca';

    // Calculate Total Wealth based on Current Market Price
    // Fallback to AveragePrice if market price is missing
    const totalMarketValue = portfolio.tentacles.reduce((total, tentacle) => {
        const tentacleValue = tentacle.holdings.reduce((tTotal, h) => {
            const price = prices[h.ticker] || h.averagePrice;
            return tTotal + (h.quantity * price);
        }, 0);
        return total + tentacleValue;
    }, 0);

    return (
        <div style={{ paddingBottom: '4rem' }}>
            {/* Header */}
            <header style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '0.5rem' }}>
                            Minha Carteira
                        </h1>
                        <p style={{ color: 'var(--color-text-secondary)' }}>
                            Gerencie seus investimentos pessoais seguindo o Método Kraken.
                        </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                            Patrimônio Total
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                            {formatCurrency(totalMarketValue)}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', marginTop: '0.5rem' }}>
                            Última atualização: {lastUpdatedDate}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1.5rem',
                            background: 'var(--color-primary)',
                            color: 'white',
                            borderRadius: 'var(--radius-full)',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'var(--transition-fast)'
                        }}
                    >
                        <Plus size={20} />
                        Nova Compra
                    </button>

                    <button
                        onClick={refreshPrices}
                        disabled={isRefreshing}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1.5rem',
                            background: 'var(--color-surface)',
                            color: 'var(--color-text-primary)',
                            border: '1px solid var(--color-surface-active)',
                            borderRadius: 'var(--radius-full)',
                            fontWeight: 600,
                            cursor: isRefreshing ? 'wait' : 'pointer',
                            transition: 'var(--transition-fast)',
                            opacity: isRefreshing ? 0.7 : 1
                        }}
                    >
                        <RefreshCw size={20} className={isRefreshing ? 'spin-animation' : ''} />
                        {isRefreshing ? 'Atualizando...' : 'Atualizar Preços'}
                    </button>
                </div>
            </header>


            {/* Tentacle Cards */}
            <section>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
                    Detalhamento por Tentáculo
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {portfolio.tentacles.map((tentacle) => (
                        <ExpandableTentacleCard key={tentacle.id} tentacle={tentacle} portfolioType="user" />
                    ))}
                </div>
            </section>

            {/* Add Purchase Modal */}
            <AddPurchaseModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                portfolioType="user"
            />
        </div>
    );
}
