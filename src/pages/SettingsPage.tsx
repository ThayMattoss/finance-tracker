import { useState, useMemo } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { useSettings } from '../context/SettingsContext';
import { DEFAULT_PERCENTAGES } from '../types/settings';
import { Save, AlertTriangle } from 'lucide-react';
import type { AssetType } from '../types/settings';

// Helper to map AssetCategory to AssetType
const mapCategoryToType = (category: string): AssetType => {
    switch (category) {
        case 'ACAO_BR': return 'ACAO_BR';
        case 'FII': return 'FII';
        case 'EXTERIOR': return 'EXTERIOR';
        case 'CRIPTO': return 'CRIPTO';
        default: return 'Unknown';
    }
};

export function SettingsPage() {
    const { professorPortfolio, userPortfolio } = usePortfolio();
    const { settings, updateSetting } = useSettings();

    // 1. Get ALL Unique Tickets from both portfolios
    const allAssets = useMemo(() => {
        const assets = new Map<string, { ticker: string; type: AssetType }>();

        const processPortfolio = (p: typeof professorPortfolio) => {
            p.tentacles.forEach(t => {
                t.holdings.forEach(h => {
                    if (!assets.has(h.ticker)) {
                        assets.set(h.ticker, {
                            ticker: h.ticker,
                            type: mapCategoryToType(t.id)
                        });
                    }
                });
            });
        };

        processPortfolio(professorPortfolio);
        processPortfolio(userPortfolio);

        return Array.from(assets.values()).sort((a, b) => a.ticker.localeCompare(b.ticker));
    }, [professorPortfolio, userPortfolio]);

    // UI Logic
    return (
        <div style={{ paddingBottom: '4rem' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                    Configurações de Ativos
                </h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                    Defina as regras estratégicas para cada ativo. Essas configurações guiam a análise, mas não executam ordens.
                </p>
            </header>

            <div className="glass-panel" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-surface-active)', textAlign: 'left', background: 'var(--color-surface-active)' }}>
                            <th style={{ padding: '1rem' }}>Ativo</th>
                            <th style={{ padding: '1rem' }}>Tipo</th>
                            <th style={{ padding: '1rem', width: '200px' }}>% Aceitável de Compra</th>
                            <th style={{ padding: '1rem', width: '250px' }}>Múltiplos (Risco)</th>
                            <th style={{ padding: '1rem' }}>Observações Estratégicas</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allAssets.map(asset => {
                            const setting = settings[asset.ticker] || {};
                            const defaultPct = DEFAULT_PERCENTAGES[asset.type] || 5;
                            const currentPct = setting.manualAcceptablePercentage ?? defaultPct;
                            const allowMult = setting.allowMultiples ?? false;
                            const maxMult = setting.maxMultiple ?? 1;

                            return (
                                <tr key={asset.ticker} style={{ borderBottom: '1px solid var(--color-surface-active)' }}>
                                    <td style={{ padding: '1rem', fontWeight: 600 }}>
                                        {asset.ticker}
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                        {asset.type}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <input
                                                    type="number"
                                                    placeholder={defaultPct.toString()}
                                                    value={setting.manualAcceptablePercentage ?? ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                                        updateSetting(asset.ticker, {
                                                            manualAcceptablePercentage: val,
                                                            assetType: asset.type
                                                        });
                                                    }}
                                                    style={{
                                                        width: '70px',
                                                        padding: '0.5rem',
                                                        borderRadius: 'var(--radius-sm)',
                                                        border: '1px solid var(--color-border)',
                                                        background: 'var(--color-background)',
                                                        color: 'var(--color-text-primary)'
                                                    }}
                                                />
                                                <span style={{ fontSize: '0.9rem' }}>%</span>
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                                                Padrão: {defaultPct}%
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={allowMult}
                                                    onChange={(e) => {
                                                        const checked = e.target.checked;
                                                        updateSetting(asset.ticker, {
                                                            allowMultiples: checked,
                                                            maxMultiple: checked ? (maxMult || 1.3) : 1, // Reset to 1 if disabled, defaults to 1.3 if enabling
                                                            assetType: asset.type
                                                        });
                                                    }}
                                                />
                                                <span style={{ fontSize: '0.9rem' }}>Permitir</span>
                                            </label>

                                            <select
                                                value={maxMult}
                                                disabled={!allowMult}
                                                onChange={(e) => updateSetting(asset.ticker, {
                                                    maxMultiple: parseFloat(e.target.value),
                                                    assetType: asset.type
                                                })}
                                                style={{
                                                    padding: '0.4rem',
                                                    borderRadius: 'var(--radius-sm)',
                                                    border: '1px solid var(--color-border)',
                                                    background: allowMult ? 'var(--color-background)' : 'var(--color-surface-active)',
                                                    color: allowMult ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                                                    fontSize: '0.9rem',
                                                    cursor: allowMult ? 'pointer' : 'not-allowed',
                                                    opacity: allowMult ? 1 : 0.6
                                                }}
                                            >
                                                <option value={1}>1.0x (Padrão)</option>
                                                <option value={1.3}>1.3x (Leve)</option>
                                                <option value={1.5}>1.5x (Moderado)</option>
                                                <option value={2}>2.0x (Agressivo)</option>
                                            </select>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <input
                                            type="text"
                                            placeholder="Ex: Cíclico, Alto risco..."
                                            value={setting.notes || ''}
                                            onChange={(e) => updateSetting(asset.ticker, {
                                                notes: e.target.value,
                                                assetType: asset.type
                                            })}
                                            style={{
                                                width: '100%',
                                                padding: '0.5rem',
                                                borderRadius: 'var(--radius-sm)',
                                                border: '1px solid var(--color-border)',
                                                background: 'transparent',
                                                color: 'var(--color-text-primary)',
                                                fontSize: '0.9rem'
                                            }}
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {allAssets.length === 0 && (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                        Nenhum ativo encontrado nas carteiras.
                    </div>
                )}
            </div>

            <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', display: 'flex', gap: '1rem', alignItems: 'start' }}>
                <AlertTriangle size={24} color="var(--color-warning)" style={{ flexShrink: 0 }} />
                <div>
                    <h4 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Importante</h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                        As alterações são salvas automaticamente. Essas configurações serão utilizadas na tela de <strong>Análise de Carteiras</strong> para sugerir preços teto e oportunidades.
                    </p>
                </div>
            </div>
        </div>
    );
}
