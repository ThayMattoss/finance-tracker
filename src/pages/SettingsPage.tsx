import { useState, useMemo, useRef } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_PERCENTAGES } from '../types/settings';
import { Save, AlertTriangle, Download, Upload, CheckCircle, Lock } from 'lucide-react';
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
    const { professorPortfolio, userPortfolio, importData } = usePortfolio();
    const { settings, updateSetting, restoreSettings } = useSettings();
    const { setPassword: setAuthPassword } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importSuccess, setImportSuccess] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [passwordMode, setPasswordMode] = useState(false);

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

    const handleExport = () => {
        const data = {
            professorPortfolio,
            userPortfolio,
            settings,
            exportDate: new Date().toISOString(),
            version: '2.0'
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `kraken_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                if (data.professorPortfolio && data.userPortfolio) {
                    importData(data.professorPortfolio, data.userPortfolio);
                    if (data.settings) restoreSettings(data.settings);

                    setImportSuccess(true);
                    setTimeout(() => setImportSuccess(false), 3000);
                } else {
                    alert('Arquivo de backup inválido.');
                }
            } catch (err) {
                console.error('Import error:', err);
                alert('Erro ao ler o arquivo de backup.');
            }
        };
        reader.readAsText(file);
    };

    return (
        <div style={{ paddingBottom: '4rem' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                    Configurações
                </h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                    Gerencie seus dados e definições estratégicas.
                </p>
            </header>

            {/* Data Portability Section */}
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', border: '1px solid var(--color-primary-glow)', background: 'var(--color-primary-glow)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Save size={20} /> Backup e Portabilidade
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', maxWidth: '500px' }}>
                            Exporte seus dados para migrar entre dispositivos ou para o GitHub Pages. Seus dados são salvos apenas no navegador local.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={handleExport}
                            className="flex-center"
                            style={{
                                padding: '0.75rem 1.25rem',
                                background: 'var(--color-surface-active)',
                                color: 'var(--color-text-primary)',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.9rem',
                                fontWeight: 700,
                                gap: '0.5rem',
                                border: '1px solid var(--color-border)'
                            }}
                        >
                            <Download size={18} /> Exportar Backup
                        </button>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-center"
                            style={{
                                padding: '0.75rem 1.25rem',
                                background: importSuccess ? 'var(--color-success)' : 'var(--color-primary)',
                                color: 'white',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.9rem',
                                fontWeight: 700,
                                gap: '0.5rem',
                                border: 'none',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {importSuccess ? <CheckCircle size={18} /> : <Upload size={18} />}
                            {importSuccess ? 'Restaurado!' : 'Importar Backup'}
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept=".json"
                            onChange={handleImport}
                        />
                    </div>
                </div>
            </div>

            {/* Security Section */}
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', border: '1px solid var(--color-primary-glow)', background: 'var(--color-surface)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Lock size={20} /> Segurança e Acesso
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', maxWidth: '500px' }}>
                            Gerencie a senha de acesso ao seu dashboard.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        {passwordMode ? (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="password"
                                    placeholder="Nova senha"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    style={{
                                        padding: '0.5rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--color-border)',
                                        background: 'var(--color-background)',
                                        color: 'var(--color-text-primary)'
                                    }}
                                />
                                <button
                                    onClick={() => {
                                        if (newPassword.length >= 4) {
                                            setAuthPassword(newPassword);
                                            setPasswordMode(false);
                                            setNewPassword('');
                                            alert('Senha atualizada com sucesso!');
                                        } else {
                                            alert('A senha deve ter pelo menos 4 caracteres.');
                                        }
                                    }}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        background: 'var(--color-primary)',
                                        color: 'white',
                                        borderRadius: 'var(--radius-md)',
                                        border: 'none',
                                        fontWeight: 700,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Salvar
                                </button>
                                <button
                                    onClick={() => setPasswordMode(false)}
                                    style={{
                                        padding: '0.5rem',
                                        background: 'transparent',
                                        color: 'var(--color-text-secondary)',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--color-border)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancelar
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setPasswordMode(true)}
                                style={{
                                    padding: '0.75rem 1.25rem',
                                    background: 'var(--color-surface-active)',
                                    color: 'var(--color-text-primary)',
                                    borderRadius: 'var(--radius-md)',
                                    fontSize: '0.9rem',
                                    fontWeight: 700,
                                    border: '1px solid var(--color-border)',
                                    cursor: 'pointer'
                                }}
                            >
                                Alterar Senha
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>Estratégia de Ativos</h2>

            <div className="glass-panel" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-surface-active)', textAlign: 'left', background: 'rgba(255, 255, 255, 0.03)' }}>
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
                            const allowMult = setting.allowMultiples ?? false;
                            const maxMult = setting.maxMultiple ?? 1;

                            return (
                                <tr key={asset.ticker} style={{ borderBottom: '1px solid var(--color-surface-active)' }}>
                                    <td style={{ padding: '1rem', fontWeight: 700 }}>
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
                                                        border: '1px solid var(--color-surface-active)',
                                                        background: 'rgba(0,0,0,0.2)',
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
                                                    border: '1px solid var(--color-surface-active)',
                                                    background: allowMult ? 'rgba(0,0,0,0.2)' : 'var(--color-surface-active)',
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
                                                border: '1px solid var(--color-surface-active)',
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
