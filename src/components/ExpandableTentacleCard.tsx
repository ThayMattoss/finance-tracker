import { useState } from 'react';
import { ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react';
import type { Tentacle, AssetHolding } from '../types';
import { formatCurrency } from '../utils/calculations';
import { usePortfolio } from '../context/PortfolioContext';
import { EditHoldingModal } from './EditHoldingModal';

interface ExpandableTentacleCardProps {
    tentacle: Tentacle;
    portfolioType: 'professor' | 'user';
}

export function ExpandableTentacleCard({ tentacle, portfolioType }: ExpandableTentacleCardProps) {
    const { deleteHolding, prices } = usePortfolio();
    const [isExpanded, setIsExpanded] = useState(false);
    const [editingHolding, setEditingHolding] = useState<AssetHolding | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const tentacleMarketValue = tentacle.holdings.reduce((sum, h) => {
        const price = prices[h.ticker] || h.averagePrice;
        return sum + (h.quantity * price);
    }, 0);

    return (
        <div
            className="glass-panel"
            style={{
                borderTop: `4px solid ${tentacle.color}`,
                overflow: 'hidden'
            }}
        >
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                    width: '100%',
                    padding: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'var(--transition-fast)',
                    background: isExpanded ? 'var(--color-surface-hover)' : 'transparent'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: 'var(--radius-md)',
                        background: tentacle.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: '#000'
                    }}>
                        {tentacle.letter}
                    </div>
                    <div style={{ textAlign: 'left' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--color-text-primary)' }}>
                            {tentacle.label}
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                            {tentacle.holdings.length} {tentacle.holdings.length === 1 ? 'ativo' : 'ativos'}
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>Valor Atual</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: tentacle.color }}>
                            {formatCurrency(tentacleMarketValue)}
                        </div>
                    </div>
                    {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                </div>
            </button>

            {/* Expanded Content */}
            {isExpanded && (
                <div style={{ padding: '0 1.5rem 1.5rem' }}>
                    {tentacle.holdings.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--color-surface-active)' }}>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Ticker</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Nome</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>Qtd</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>Preço Médio</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>Preço Atual</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>Valorização</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>Total Investido</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>Total Atual</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'right', width: '100px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tentacle.holdings.map((holding) => {
                                        const currentPrice = prices[holding.ticker] || 0;
                                        const currentTotal = holding.quantity * currentPrice;
                                        const appreciation = currentPrice > 0
                                            ? ((currentPrice - holding.averagePrice) / holding.averagePrice) * 100
                                            : 0;
                                        const appreciationColor = appreciation >= 0 ? 'var(--color-success)' : 'var(--color-error)';

                                        return (
                                            <tr key={holding.ticker} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                                <td style={{ padding: '0.75rem', fontWeight: 600 }}>{holding.ticker}</td>
                                                <td style={{ padding: '0.75rem', color: 'var(--color-text-secondary)' }}>{holding.name}</td>
                                                <td style={{ padding: '0.75rem', textAlign: 'right' }}>{holding.quantity}</td>
                                                <td style={{ padding: '0.75rem', textAlign: 'right' }}>{formatCurrency(holding.averagePrice)}</td>
                                                <td style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--color-text-primary)' }}>
                                                    {currentPrice > 0 ? formatCurrency(currentPrice) : '-'}
                                                </td>
                                                <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600, color: appreciationColor }}>
                                                    {currentPrice > 0 ? `${appreciation > 0 ? '+' : ''}${appreciation.toFixed(2)}%` : '-'}
                                                </td>
                                                <td style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--color-text-secondary)' }}>
                                                    {formatCurrency(holding.totalValue)}
                                                </td>
                                                <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>
                                                    {currentPrice > 0 ? formatCurrency(currentTotal) : '-'}
                                                </td>
                                                <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                        <button
                                                            onClick={() => {
                                                                setEditingHolding(holding);
                                                                setIsEditModalOpen(true);
                                                            }}
                                                            style={{
                                                                padding: '0.25rem',
                                                                color: 'var(--color-text-secondary)',
                                                                cursor: 'pointer',
                                                                transition: 'var(--transition-fast)'
                                                            }}
                                                            title="Editar"
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (window.confirm(`Tem certeza que deseja excluir ${holding.ticker}?`)) {
                                                                    deleteHolding(holding.category, holding.ticker, portfolioType);
                                                                }
                                                            }}
                                                            style={{
                                                                padding: '0.25rem',
                                                                color: 'var(--color-danger)',
                                                                cursor: 'pointer',
                                                                transition: 'var(--transition-fast)'
                                                            }}
                                                            title="Excluir"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p style={{
                            padding: '2rem',
                            textAlign: 'center',
                            color: 'var(--color-text-tertiary)',
                            fontStyle: 'italic'
                        }}>
                            Nenhum ativo cadastrado neste tentáculo.
                        </p>
                    )}
                </div>
            )}

            {/* Edit Modal */}
            <EditHoldingModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditingHolding(null);
                }}
                holding={editingHolding}
                portfolioType={portfolioType}
            />
        </div>
    );
}
