import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { AssetHolding } from '../types';
import { usePortfolio } from '../context/PortfolioContext';

interface EditHoldingModalProps {
    isOpen: boolean;
    onClose: () => void;
    holding: AssetHolding | null;
    portfolioType?: 'professor' | 'user'; // Optional for backward compat if needed, but best required
}

export function EditHoldingModal({ isOpen, onClose, holding, portfolioType = 'professor' }: EditHoldingModalProps) {
    const { updateHolding } = usePortfolio();
    const [ticker, setTicker] = useState('');
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [price, setPrice] = useState('');

    useEffect(() => {
        if (holding) {
            setTicker(holding.ticker);
            setName(holding.name);
            setQuantity(holding.quantity.toString());
            setPrice(holding.averagePrice.toString());
        }
    }, [holding]);

    if (!isOpen || !holding) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const updatedHolding: Omit<AssetHolding, 'totalValue' | 'lastUpdated'> = {
            ticker: holding.ticker, // Ticker usually shouldn't change in edit or it becomes a different asset
            name: name.trim(),
            category: holding.category,
            quantity: parseFloat(quantity),
            averagePrice: parseFloat(price)
        };

        updateHolding(updatedHolding, portfolioType);
        onClose();
    };

    const total = quantity && price ? (parseFloat(quantity) * parseFloat(price)).toFixed(2) : '0.00';

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                backdropFilter: 'blur(4px)'
            }}
            onClick={onClose}
        >
            <div
                className="glass-panel"
                style={{
                    width: '90%',
                    maxWidth: '500px',
                    padding: '2rem',
                    position: 'relative'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        color: 'var(--color-text-secondary)',
                        transition: 'var(--transition-fast)'
                    }}
                >
                    <X size={24} />
                </button>

                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                    Editar Ativo
                </h2>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
                            Ticker / Código
                        </label>
                        <input
                            type="text"
                            value={ticker}
                            disabled
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                border: 'var(--glass-border)',
                                background: 'var(--color-surface-active)',
                                color: 'var(--color-text-tertiary)',
                                fontSize: '1rem',
                                cursor: 'not-allowed'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
                            Nome do Ativo
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                border: 'var(--glass-border)',
                                background: 'var(--color-surface)',
                                color: 'var(--color-text-primary)',
                                fontSize: '1rem'
                            }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
                                Quantidade
                            </label>
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                min="0"
                                step="any"
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: 'var(--glass-border)',
                                    background: 'var(--color-surface)',
                                    color: 'var(--color-text-primary)',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
                                {holding.category === 'FII' || holding.category === 'ACAO_BR' ? 'Preço Médio (R$)' : 'Preço Médio (R$)'}
                            </label>
                            <input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                min="0"
                                step="0.01"
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: 'var(--glass-border)',
                                    background: 'var(--color-surface)',
                                    color: 'var(--color-text-primary)',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>
                    </div>

                    <div
                        style={{
                            padding: '1rem',
                            background: 'var(--color-surface-active)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-primary)'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Novo Valor Total:</span>
                            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                                R$ {total}
                            </span>
                        </div>
                    </div>

                    <button
                        type="submit"
                        style={{
                            width: '100%',
                            padding: '0.875rem',
                            background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                            color: 'white',
                            borderRadius: 'var(--radius-md)',
                            fontWeight: 600,
                            fontSize: '1rem',
                            cursor: 'pointer',
                            transition: 'var(--transition-fast)'
                        }}
                    >
                        Salvar Alterações
                    </button>
                </form>
            </div>
        </div>
    );
}
