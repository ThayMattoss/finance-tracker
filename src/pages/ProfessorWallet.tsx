import { useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { MacroTable } from '../components/MacroTable';
import { ExpandableTentacleCard } from '../components/ExpandableTentacleCard';
import { AddPurchaseModal } from '../components/AddPurchaseModal';
import { formatCurrency } from '../utils/calculations';

export function ProfessorWalletPage() {
    const { professorPortfolio, refreshPrices, isRefreshing, prices } = usePortfolio();
    const portfolio = professorPortfolio; // Alias for easier refactoring
    const [isModalOpen, setIsModalOpen] = useState(false);

    const lastUpdatedDate = portfolio.lastUpdated
        ? new Date(portfolio.lastUpdated).toLocaleDateString('pt-BR')
        : 'Nunca';

    // Calculate Total Market Value
    const totalMarketValue = portfolio.tentacles.reduce((sum, t) => {
        return sum + t.holdings.reduce((hSum, h) => {
            const price = prices[h.ticker] || h.averagePrice;
            return hSum + (h.quantity * price);
        }, 0);
    }, 0);

    return (
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <header
                className="glass-panel"
                style={{
                    padding: '2rem',
                    marginBottom: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1.5rem'
                }}
            >
                <div>
                    <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                        Carteira do Professor
                    </h1>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
                        Referência Kraken · Gerenciamento completo da carteira
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: '0.25rem' }}>
                            Patrimônio Total
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                            {formatCurrency(totalMarketValue)}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', marginTop: '0.25rem' }}>
                            Atualizado em {lastUpdatedDate}
                        </div>
                    </div>


                    <button
                        onClick={() => refreshPrices()}
                        disabled={isRefreshing}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.875rem 1.5rem',
                            background: 'var(--color-surface)',
                            border: '1px solid var(--color-surface-active)',
                            color: isRefreshing ? 'var(--color-text-tertiary)' : 'var(--color-text-secondary)',
                            borderRadius: 'var(--radius-md)',
                            fontWeight: 600,
                            fontSize: '1rem',
                            cursor: isRefreshing ? 'wait' : 'pointer',
                            transition: 'var(--transition-fast)',
                            opacity: isRefreshing ? 0.7 : 1
                        }}
                        title="Atualizar Preços"
                    >
                        <RefreshCw size={20} className={isRefreshing ? 'spin-animation' : ''} />
                        {isRefreshing && <span style={{ fontSize: '0.8rem' }}>Atualizando...</span>}
                    </button>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.875rem 1.5rem',
                            background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                            color: 'white',
                            borderRadius: 'var(--radius-md)',
                            fontWeight: 600,
                            fontSize: '1rem',
                            transition: 'var(--transition-fast)',
                            boxShadow: '0 4px 12px rgba(109, 40, 217, 0.3)'
                        }}
                    >
                        <Plus size={20} />
                        Adicionar Compra
                    </button>
                </div>
            </header>

            {/* Macro Table */}
            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
                    Visão Macro dos Tentáculos
                </h2>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <MacroTable portfolio={portfolio} />
                </div>
            </section>

            {/* Tentacle Cards */}
            <section>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
                    Detalhamento por Tentáculo
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {portfolio.tentacles.map((tentacle) => (
                        <ExpandableTentacleCard key={tentacle.id} tentacle={tentacle} portfolioType="professor" />
                    ))}
                </div>
            </section>

            {/* Modal */}
            <AddPurchaseModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                portfolioType="professor"
            />
        </div>
    );
}
