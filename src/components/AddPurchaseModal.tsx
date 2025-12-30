import { useState } from 'react';
import { X } from 'lucide-react';
import type { AssetCategory, AssetHolding } from '../types';
import { usePortfolio } from '../context/PortfolioContext';

interface AddPurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    portfolioType: 'professor' | 'user';
}

export function AddPurchaseModal({ isOpen, onClose, portfolioType }: AddPurchaseModalProps) {
    const { professorPortfolio, userPortfolio, addOrUpdateHolding } = usePortfolio();
    const portfolio = portfolioType === 'professor' ? professorPortfolio : userPortfolio;
    const [category, setCategory] = useState<AssetCategory>('FII');
    const [ticker, setTicker] = useState('');
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [price, setPrice] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const holding: Omit<AssetHolding, 'totalValue' | 'lastUpdated'> = {
            ticker: ticker.toUpperCase().trim(),
            name: name.trim(),
            category,
            quantity: parseFloat(quantity),
            averagePrice: parseFloat(price)
        };

        addOrUpdateHolding(holding, portfolioType);

        // Reset form
        setTicker('');
        setName('');
        setQuantity('');
        setPrice('');
        onClose();
    };

    const total = quantity && price ? (parseFloat(quantity) * parseFloat(price)).toFixed(2) : '0.00';

    // Find existing holding if ticker matches
    const selectedTentacle = portfolio.tentacles.find(t => t.id === category);
    const existingHolding = selectedTentacle?.holdings.find(h => h.ticker.toUpperCase() === ticker.toUpperCase().trim());

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
                    Adicionar / Atualizar Compra
                </h2>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
                            Tentáculo
                        </label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value as AssetCategory)}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                border: 'var(--glass-border)',
                                background: 'var(--color-surface)',
                                color: 'var(--color-text-primary)',
                                fontSize: '1rem'
                            }}
                        >
                            {portfolio.tentacles.map(t => (
                                <option key={t.id} value={t.id}>{t.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
                            Ticker / Código
                        </label>
                        <input
                            type="text"
                            value={ticker}
                            onChange={(e) => setTicker(e.target.value)}
                            placeholder="Ex: HGLG11"
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
                            Nome do Ativo
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: CSHG Logística"
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
                                placeholder="0"
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
                                Preço Unitário (R$)
                            </label>
                            <input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                min="0"
                                step="0.01"
                                required
                                placeholder="0.00"
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
                            <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Valor Total:</span>
                            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                                R$ {total}
                            </span>
                        </div>

                        {existingHolding && (
                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                                <div>Qtd. anterior: {existingHolding.quantity}</div>
                                <div>Preço médio anterior: R$ {existingHolding.averagePrice.toFixed(2)}</div>
                            </div>
                        )}
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
                        {existingHolding ? 'Atualizar Holding' : 'Adicionar Compra'}
                    </button>
                </form>
            </div>
        </div>
    );
}
