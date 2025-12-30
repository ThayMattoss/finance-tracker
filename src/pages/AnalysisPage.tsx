import { useState, useMemo } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { useSettings } from '../context/SettingsContext';
import { analyzeAsset } from '../utils/analysis';
import type { RecommendationStatus } from '../utils/analysis';
import { calculateInvestmentPlan } from '../utils/investmentCalculator';
import { formatCurrency, formatPercentage } from '../utils/calculations';
import { AlertCircle, CheckCircle, PauseCircle, TrendingUp, Wallet } from 'lucide-react';
import type { AssetType } from '../types/settings';

// Helper to map AssetCategory to AssetType
const mapCategoryToType = (category: string): string => {
    return category;
};

interface AssetDetails {
    quantity: number;
    averagePrice: number;
    totalValue: number;
    percentage: number;
    category: string;
}

export function AnalysisPage() {
    const { professorPortfolio, userPortfolio, prices } = usePortfolio();
    const { settings, getSetting } = useSettings();
    const [filter, setFilter] = useState<RecommendationStatus | 'ALL'>('ALL');
    const [globalIncrease, setGlobalIncrease] = useState<number>(0);
    const [globalIncreaseInput, setGlobalIncreaseInput] = useState<string>('0');

    // 1. Basic Cash Values
    const professorCashValue = useMemo(() => {
        let cash = 0;
        professorPortfolio.tentacles.forEach(t => {
            if (t.id === 'CAIXA') {
                t.holdings.forEach(h => {
                    cash += h.totalValue;
                });
            }
        });
        return cash;
    }, [professorPortfolio]);

    const userCashValue = useMemo(() => {
        const caixaTentacle = userPortfolio.tentacles.find(t => t.id === 'CAIXA');
        if (!caixaTentacle) return 0;

        return caixaTentacle.holdings.reduce((total, holding) => {
            const price = prices[holding.ticker] || holding.averagePrice;
            return total + (holding.quantity * price);
        }, 0);
    }, [userPortfolio, prices]);

    // 2. Main Analysis Data
    const analysisData = useMemo(() => {
        const uniqueTickers = new Set<string>();

        const findAssetDetails = (portfolio: typeof professorPortfolio, ticker: string): AssetDetails | undefined => {
            let totalPortfolioValue = 0;
            portfolio.tentacles.forEach(t => {
                t.holdings.forEach(h => {
                    const p = prices[h.ticker] || h.averagePrice;
                    totalPortfolioValue += h.quantity * p;
                });
            });

            for (const t of portfolio.tentacles) {
                const holding = t.holdings.find(h => h.ticker === ticker);
                if (holding) {
                    const price = prices[ticker] || holding.averagePrice;
                    const totalValue = holding.quantity * price;
                    const percentage = totalPortfolioValue > 0 ? (totalValue / totalPortfolioValue) * 100 : 0;

                    return {
                        quantity: holding.quantity,
                        averagePrice: holding.averagePrice,
                        totalValue,
                        percentage,
                        category: t.id
                    };
                }
            }
            return undefined;
        };

        professorPortfolio.tentacles.forEach(t => t.holdings.forEach(h => uniqueTickers.add(h.ticker)));
        userPortfolio.tentacles.forEach(t => t.holdings.forEach(h => uniqueTickers.add(h.ticker)));

        const results = Array.from(uniqueTickers).map(ticker => {
            const profData = findAssetDetails(professorPortfolio, ticker);
            const userData = findAssetDetails(userPortfolio, ticker);
            const currentPrice = prices[ticker] || profData?.averagePrice || userData?.averagePrice || 0;

            const assetType = profData?.category || userData?.category || 'Unknown';
            const mappedType = mapCategoryToType(assetType);

            const assetSettings = getSetting(ticker) || {
                ticker,
                assetType: mappedType as AssetType,
                allowMultiples: false,
                maxMultiple: 1,
                lastUpdated: '',
                manualAcceptablePercentage: undefined
            };

            return analyzeAsset(
                ticker,
                assetType,
                userData,
                profData,
                currentPrice,
                assetSettings,
                globalIncrease
            );
        }).filter(item => item.assetType !== 'CAIXA');

        const weight = { 'BUY': 0, 'MODERATE': 1, 'AVOID': 2 };
        return results.sort((a, b) => weight[a.recommendation] - weight[b.recommendation]);

    }, [professorPortfolio, userPortfolio, prices, settings, getSetting, globalIncrease]);

    // 3. Derived Plan Data
    const totalNecessaryReserve = useMemo(() => {
        return analysisData.reduce((sum, item) => sum + item.valueToParity, 0);
    }, [analysisData]);

    const investmentPlan = useMemo(() => {
        return calculateInvestmentPlan(userCashValue, analysisData, professorCashValue);
    }, [userCashValue, analysisData, professorCashValue]);

    const filteredData = analysisData.filter(d => filter === 'ALL' || d.recommendation === filter);

    return (
        <div style={{ paddingBottom: '4rem' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <TrendingUp size={32} color="var(--color-primary)" />
                    Análise de Carteiras
                </h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                    Onde faz sentido aportar agora? Comparativo estratégico considerando preço, alinhamento e risco.
                </p>
            </header>

            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '250px' }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-primary)' }}>
                            <Wallet size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                            Caixa Disponível (Sincronizado)
                        </label>
                        <input
                            type="text"
                            value={formatCurrency(userCashValue)}
                            readOnly
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                fontSize: '1.25rem',
                                fontWeight: 800,
                                borderRadius: 'var(--radius-md)',
                                border: '2px solid var(--color-primary)',
                                background: 'rgba(52, 152, 219, 0.05)',
                                color: 'var(--color-primary)',
                                cursor: 'not-allowed'
                            }}
                        />
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                            * Edite os valores na aba <strong>Minha Carteira</strong> para alterar seu caixa.
                        </p>
                    </div>

                    <div style={{ flex: 1, minWidth: '250px' }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-info)' }}>
                            <TrendingUp size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                            Acréscimo Global (%)
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                                type="number"
                                value={globalIncreaseInput}
                                onChange={(e) => setGlobalIncreaseInput(e.target.value)}
                                placeholder="0"
                                style={{
                                    width: '80px',
                                    padding: '0.6rem',
                                    fontSize: '1.1rem',
                                    fontWeight: 700,
                                    borderRadius: 'var(--radius-md)',
                                    border: '2px solid var(--color-info)',
                                    background: 'rgba(52, 152, 219, 0.05)',
                                    color: 'var(--color-info)',
                                    textAlign: 'center'
                                }}
                            />
                            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-info)' }}>%</span>
                            <button
                                onClick={() => setGlobalIncrease(parseFloat(globalIncreaseInput) || 0)}
                                style={{
                                    padding: '0.6rem 1rem',
                                    background: 'var(--color-info)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 'var(--radius-md)',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    fontSize: '0.8rem'
                                }}
                            >
                                ATUALIZAR
                            </button>
                        </div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                            Reserva p/ Faltantes (Total)
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-warning)' }}>
                            {formatCurrency(totalNecessaryReserve)}
                        </div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        {investmentPlan.availableForProportional <= 0 ? (
                            <>
                                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-error)', lineHeight: 1.2 }}>
                                    Sem reserva para novos aportes (Simulator)
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.4rem' }}>
                                    Sem reservas para compras que não são faltantes.
                                </div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-tertiary)', marginTop: '0.2rem' }}>
                                    {formatCurrency(investmentPlan.availableForProportional)}
                                </div>
                            </>
                        ) : (
                            <>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                    Aporte Sugerido (Simulator)
                                </div>
                                <div style={{
                                    fontSize: '1.25rem',
                                    fontWeight: 700,
                                    color: 'var(--color-success)'
                                }}>
                                    {formatCurrency(investmentPlan.availableForProportional)}
                                </div>
                            </>
                        )}
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                            Caixa Professor
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-info)' }}>
                            {formatCurrency(professorCashValue)}
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <FilterButton label="Todos" count={analysisData.length} active={filter === 'ALL'} onClick={() => setFilter('ALL')} />
                <FilterButton
                    label="Aportar"
                    count={analysisData.filter(d => d.recommendation === 'BUY').length}
                    active={filter === 'BUY'}
                    color="var(--color-success)"
                    onClick={() => setFilter('BUY')}
                />
                <FilterButton
                    label="Moderar"
                    count={analysisData.filter(d => d.recommendation === 'MODERATE').length}
                    active={filter === 'MODERATE'}
                    color="var(--color-warning)"
                    onClick={() => setFilter('MODERATE')}
                />
                <FilterButton
                    label="Evitar"
                    count={analysisData.filter(d => d.recommendation === 'AVOID').length}
                    active={filter === 'AVOID'}
                    color="var(--color-danger)"
                    onClick={() => setFilter('AVOID')}
                />
            </div>

            <div className="glass-panel" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ background: 'var(--color-surface-active)', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                            <th style={{ padding: '1rem' }}>Recomendação</th>
                            <th style={{ padding: '1rem' }}>Ativo</th>
                            <th style={{ padding: '1rem', textAlign: 'center' }}>% Minha</th>
                            <th style={{ padding: '1rem', textAlign: 'center' }}>% Prof</th>
                            <th style={{ padding: '1rem', textAlign: 'center' }}>Qtd Minha</th>
                            <th style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-info)' }}>Qtd Alvo (+%)</th>
                            <th style={{ padding: '1rem', textAlign: 'center' }}>Qtd Prof</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Preço Atual</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Preço Máx</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>PM Prof</th>
                            <th style={{ padding: '1rem', textAlign: 'center' }}>Múltiplo (Atual / Máx)</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Reserva p/ Faltantes</th>
                            <th style={{ padding: '1rem' }}>Diagnóstico</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map(row => {
                            const isCapped = row.userQuantity >= row.maxQuantity && row.maxQuantity > 0;

                            return (
                                <tr
                                    key={row.ticker}
                                    style={{
                                        borderBottom: '1px solid var(--color-surface-active)',
                                        opacity: isCapped ? 0.5 : 1,
                                        filter: isCapped ? 'grayscale(60%)' : 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <td style={{ padding: '1rem' }}>
                                        <StatusBadge status={row.recommendation} />
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 700 }}>{row.ticker}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{row.assetType}</div>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>
                                        {formatPercentage(row.userPercentage)}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                        {formatPercentage(row.professorPercentage)}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <div style={{ fontWeight: 600 }}>{row.userQuantity}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', borderTop: '1px solid var(--color-border)', width: '100%', marginTop: '2px', paddingTop: '2px' }}>
                                                Máx: {row.maxQuantity}
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-info)', fontWeight: 700 }}>
                                        {row.targetQuantity}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                        {row.professorQuantity}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>
                                        {formatCurrency(row.currentPrice)}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right', color: row.currentPrice > row.maxPrice ? 'var(--color-error)' : 'var(--color-success)' }}>
                                        {formatCurrency(row.maxPrice)}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--color-text-secondary)' }}>
                                        {formatCurrency(row.professorAveragePrice)}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <div style={{
                                            fontWeight: row.multipleStatus === 'exceeded' ? 700 : 400,
                                            color: row.multipleStatus === 'exceeded' ? 'var(--color-error)' : 'inherit',
                                            display: 'flex', flexDirection: 'column', alignItems: 'center'
                                        }}>
                                            <div>{row.multipleCurrent > 100 ? '-' : row.multipleCurrent.toFixed(2) + 'x'}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', borderTop: '1px solid var(--color-border)', width: '100%', marginTop: '2px', paddingTop: '2px' }}>
                                                Máx: {row.maxMultiple.toFixed(1)}x
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700, color: row.valueToParity > 0 ? 'var(--color-primary)' : 'var(--color-text-tertiary)' }}>
                                        {row.valueToParity > 0 ? (
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span>{formatCurrency(row.valueToParity)}</span>
                                                <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                                                    ({row.targetQuantity - row.userQuantity} cotas)
                                                </span>
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {row.reason.length > 0 ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                {row.reason.map((r, i) => (
                                                    <span key={i} style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                        • {r}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span style={{ fontSize: '0.8rem', color: 'var(--color-success)' }}>Condições favoráveis</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function FilterButton({ label, count, active, onClick, color = 'var(--color-primary)' }: any) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-full)',
                border: `1px solid ${active ? color : 'var(--color-border)'}`,
                background: active ? `${color}20` : 'transparent',
                color: active ? color : 'var(--color-text-secondary)',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
            }}
        >
            {label} ({count})
        </button>
    );
}

function StatusBadge({ status }: { status: RecommendationStatus }) {
    const styles = {
        'BUY': { bg: '#22c55e20', text: '#22c55e', icon: CheckCircle, label: 'APORTAR' },
        'MODERATE': { bg: '#eab30820', text: '#eab308', icon: AlertCircle, label: 'MODERAR' },
        'AVOID': { bg: '#ef444420', text: '#ef4444', icon: PauseCircle, label: 'EVITAR' }
    };

    const style = styles[status];
    const Icon = style.icon;

    return (
        <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            background: style.bg,
            color: style.text,
            fontWeight: 700,
            fontSize: '0.8rem'
        }}>
            <Icon size={14} />
            {style.label}
        </div>
    );
}
