import React from 'react';
import { Flex, Button } from '@maxhub/max-ui';
import {
    getDealName,
    formatMoney,
    formatDate,
    getStageDisplay,
    getPaymentStatus,
    extractDateFromProduct,
    getProductAmount,
    CATEGORY_NAMES,
} from '../utils/deals';

const BG = '#F2F3F5';
const CARD_BG = '#FFFFFF';
const BORDER = 'rgba(0,0,0,0.08)';

// ─── Прогресс-бар ─────────────────────────────────────────────────────────────
const ProgressBar = ({ paid, total }) => {
    const pct = total > 0 ? Math.min(100, (paid / total) * 100) : 0;
    return (
        <div style={{ marginTop: 8, width: '100%' }}>
            <div style={{
                height: 5,
                borderRadius: 3,
                backgroundColor: 'rgba(0,0,0,0.08)',
                overflow: 'hidden',
            }}>
                <div style={{
                    height: '100%',
                    width: `${pct}%`,
                    borderRadius: 3,
                    backgroundColor: pct >= 100 ? '#43A047' : '#42A5F5',
                    transition: 'width 0.4s ease',
                }} />
            </div>
            <Flex justify="space-between" style={{ marginTop: 4 }}>
                <span style={{ fontSize: 11, color: '#888' }}>
                    {pct.toFixed(0)}% оплачено
                </span>
                <span style={{ fontSize: 11, color: '#888' }}>
                    {formatMoney(paid)} / {formatMoney(total)}
                </span>
            </Flex>
        </div>
    );
};

// ─── Заголовок таблицы ────────────────────────────────────────────────────────
const TableHeader = () => (
    <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1.4fr',
        padding: '8px 16px',
        backgroundColor: 'rgba(0,0,0,0.03)',
        borderBottom: `1px solid ${BORDER}`,
        gap: 8,
    }}>
        {['Дата', 'Сумма', 'Статус'].map(h => (
            <span key={h} style={{
                fontSize: 10,
                fontWeight: 700,
                color: '#999',
                textTransform: 'uppercase',
                letterSpacing: 0.3,
            }}>
                {h}
            </span>
        ))}
    </div>
);

// ─── Строка таблицы ───────────────────────────────────────────────────────────
const TableRow = ({ date, amount, badge, isLast }) => (
    <div>
        <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1.4fr',
            padding: '11px 16px',
            alignItems: 'center',
            gap: 8,
        }}>
            <span style={{ fontSize: 13, color: '#1a1a1a' }}>{date}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{amount}</span>
            <div>{badge}</div>
        </div>
        {!isLast && (
            <div style={{ height: 1, backgroundColor: BORDER, margin: '0 16px' }} />
        )}
    </div>
);

// ─── Бейджи ───────────────────────────────────────────────────────────────────
const PayBadge = ({ status }) => {
    const c = {
        paid:    { label: '✅ Оплачен',   color: '#43A047', bg: '#E8F5E9' },
        pending: { label: '⏳ Ожидает',   color: '#FB8C00', bg: '#FFF3E0' },
        overdue: { label: '⚠ Просрочен', color: '#E53935', bg: '#FFEBEE' },
    }[status] || { label: '⏳ Ожидает', color: '#FB8C00', bg: '#FFF3E0' };

    return (
        <span style={{
            display: 'inline-block',
            padding: '3px 8px',
            borderRadius: 10,
            fontSize: 11,
            fontWeight: 600,
            backgroundColor: c.bg,
            color: c.color,
            whiteSpace: 'nowrap',
        }}>
            {c.label}
        </span>
    );
};

const InvBadge = ({ stageId }) => {
    const isPaid = stageId === 'DT31_2:P';
    return (
        <span style={{
            display: 'inline-block',
            padding: '3px 8px',
            borderRadius: 10,
            fontSize: 11,
            fontWeight: 600,
            backgroundColor: isPaid ? '#E8F5E9' : '#F5F5F5',
            color: isPaid ? '#43A047' : '#757575',
            whiteSpace: 'nowrap',
        }}>
            {isPaid ? '✅ Подтверждён' : '⏳ Не подтверждён'}
        </span>
    );
};

// ─── Секция-карточка ──────────────────────────────────────────────────────────
const Section = ({ title, children }) => (
    <div style={{ padding: '0 16px 14px', width: '100%', boxSizing: 'border-box' }}>
        {title && (
            <span style={{
                display: 'block',
                fontSize: 15,
                fontWeight: 700,
                color: '#1a1a1a',
                marginBottom: 10,
            }}>
                {title}
            </span>
        )}
        <div style={{
            borderRadius: 14,
            backgroundColor: CARD_BG,
            border: `1px solid ${BORDER}`,
            overflow: 'hidden',
            width: '100%',
            boxSizing: 'border-box',
        }}>
            {children}
        </div>
    </div>
);

// ─── Мини-карточка дочерней сделки ────────────────────────────────────────────
const ChildDealCard = ({ deal }) => {
    const dealName = getDealName(deal);
    const totalAmount = parseFloat(deal.OPPORTUNITY || 0);
    const paidAmount = deal.paidAmount || 0;
    const { label, bg, text } = getStageDisplay(deal);

    const isCollection = parseInt(deal.CATEGORY_ID) === 6;

    return (
        <div
            style={{
                borderRadius: 14,
                padding: '14px 16px',
                backgroundColor: '#FFFFFF',
                border: '1px solid rgba(0,0,0,0.08)',
                width: '100%',
                boxSizing: 'border-box',
            }}
        >
            <Flex direction="column" gap={10} style={{ width: '100%' }}>

                <Flex justify="space-between" align="flex-start" gap={8}>
                    <span
                        style={{
                            fontWeight: 700,
                            fontSize: 15,
                            color: '#1a1a1a',
                            flex: 1,
                        }}
                    >
                        {dealName}
                    </span>

                    <span
                        style={{
                            padding: '3px 10px',
                            borderRadius: 20,
                            fontSize: 11,
                            fontWeight: 600,
                            backgroundColor: bg,
                            color: text,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {label}
                    </span>
                </Flex>

                {/* У Сбора документов убираем сумму */}
                {!isCollection && totalAmount > 0 && (
                    <Flex justify="space-between" align="center">
                        <span style={{ fontSize: 13, color: '#888' }}>Сумма</span>
                        <span style={{ fontSize: 14, fontWeight: 700 }}>
                            {formatMoney(totalAmount)}
                        </span>
                    </Flex>
                )}

                {/* Возвращаем таблицу счетов */}
                {deal.invoices && deal.invoices.length > 0 && (
                    <div style={{
                        borderRadius: 10,
                        border: '1px solid rgba(0,0,0,0.08)',
                        overflow: 'hidden',
                        marginTop: 4,
                    }}>
                        <TableHeader />
                        {deal.invoices.map((inv, i) => (
                            <TableRow
                                key={inv.id}
                                date={formatDate(inv.createdTime)}
                                amount={formatMoney(inv.opportunity)}
                                badge={<InvBadge stageId={inv.stageId} />}
                                isLast={i === deal.invoices.length - 1}
                            />
                        ))}
                    </div>
                )}
            </Flex>
        </div>
    );
};

// ─── Экран деталей сделки ─────────────────────────────────────────────────────
export const DealDetail = ({ deal, onBack }) => {
    const isSimple = parseInt(deal.CATEGORY_ID) === 16 || parseInt(deal.CATEGORY_ID) === 18;
    const dealName = getDealName(deal);
    const stageDisplay = getStageDisplay(deal);
    const totalAmount = parseFloat(deal.OPPORTUNITY || 0);
    const paidAmount = deal.paidAmount || 0;
    const remaining = totalAmount - paidAmount;
    const products = deal.products || [];
    const invoices = deal.invoices || [];
    const publications = deal.publications || [];
    const deposits = deal.deposits || [];
    const relatedServices = deal.relatedServices || [];

    const showRelated = ['SALE', 'UC_UABTV4'].includes(deal.TYPE_ID);

    return (
        <div style={{
            minHeight: '100%',
            width: '100%',
            backgroundColor: BG,
            boxSizing: 'border-box',
        }}>
            <Flex direction="column" style={{ minHeight: '100%', width: '100%' }}>

                {/* Шапка */}
                <div style={{ padding: '16px 16px 0' }}>
                    <Flex align="center" gap={8} style={{ marginBottom: 16 }}>
                        <button
                            onClick={onBack}
                            style={{
                                background: 'none',
                                border: 'none',
                                fontSize: 28,
                                cursor: 'pointer',
                                color: '#1a1a1a',
                                padding: '0 8px 0 0',
                                lineHeight: 1,
                                flexShrink: 0,
                                fontFamily: 'inherit',
                            }}
                        >
                            ‹
                        </button>
                        <span style={{
                            fontSize: 17,
                            fontWeight: 700,
                            color: '#1a1a1a',
                            flex: 1,
                            lineHeight: 1.3,
                        }}>
                            {dealName}
                        </span>
                    </Flex>

                    {/* Инфо о сделке */}
                    {!isSimple && (
                        <div style={{ padding: '0 16px 16px' }}>
                            <Flex direction="column" gap={8}>

                                {deal.UF_CRM_CONTRACT_NUM && (
                                    <Flex justify="space-between">
                                        <span style={{ color: '#888' }}>Договор №</span>
                                        <span style={{ fontWeight: 600 }}>
                                            {deal.UF_CRM_CONTRACT_NUM}
                                        </span>
                                    </Flex>
                                )}

                                <Flex justify="space-between">
                                    <span style={{ color: '#888' }}>Дата начала</span>
                                    <span style={{ fontWeight: 600 }}>
                                        {formatDate(deal.DATE_CREATE)}
                                    </span>
                                </Flex>

                                <Flex justify="space-between">
                                    <span style={{ color: '#888' }}>Статус</span>
                                    <span style={{
                                        padding: '4px 12px',
                                        borderRadius: 20,
                                        backgroundColor: stageDisplay.bg,
                                        color: stageDisplay.text,
                                        fontWeight: 700,
                                    }}>
                                        {stageDisplay.label}
                                    </span>
                                </Flex>

                                {deal.contractFile && (
                                    <button
                                        style={{
                                            marginTop: 8,
                                            padding: '10px',
                                            borderRadius: 10,
                                            border: 'none',
                                            backgroundColor: '#42A5F5',
                                            color: '#fff',
                                            fontWeight: 600,
                                        }}
                                        onClick={() => window.open(deal.contractFile, '_blank')}
                                    >
                                        Скачать договор PDF
                                    </button>
                                )}

                            </Flex>
                        </div>
                    )}
                </div>

                {/* Финансы */}
                <Section title="Финансовая информация">
                    <div style={{ padding: '14px 16px' }}>
                        <Flex direction="column" gap={10}>
                            <Flex justify="space-between" align="center">
                                <span style={{ fontSize: 14, color: '#888' }}>Общая сумма</span>
                                <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginLeft: 12 }}>
                                    {formatMoney(totalAmount)}
                                </span>
                            </Flex>
                            <Flex justify="space-between" align="center">
                                <span style={{ fontSize: 14, color: '#888' }}>Оплачено</span>
                                <span style={{ fontSize: 15, fontWeight: 700, color: '#43A047', marginLeft: 12 }}>
                                    {formatMoney(paidAmount)}
                                </span>
                            </Flex>
                            <Flex justify="space-between" align="center">
                                <span style={{ fontSize: 14, color: '#888' }}>Остаток</span>
                                <span style={{
                                    fontSize: 15,
                                    fontWeight: 700,
                                    color: remaining > 0 ? '#FB8C00' : '#43A047',
                                    marginLeft: 12,
                                }}>
                                    {formatMoney(remaining)}
                                </span>
                            </Flex>
                            <ProgressBar paid={paidAmount} total={totalAmount} />
                        </Flex>
                    </div>
                    <div style={{ height: 1, backgroundColor: BORDER, margin: '0 16px' }} />
                    <div style={{ padding: '12px 16px' }}>
                        <button
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: 12,
                                border: 'none',
                                backgroundColor: '#42A5F5',
                                color: '#fff',
                                fontSize: 15,
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                boxSizing: 'border-box',
                            }}
                        >
                            Оплатить
                        </button>
                    </div>
                </Section>

                {/* График платежей */}
                {!isSimple && products.length > 0 && (
                    <Section title="График платежей">
                        <TableHeader />
                        {products.map((p, i) => (
                            <TableRow
                                key={p.ID || i}
                                date={extractDateFromProduct(p)}
                                amount={formatMoney(getProductAmount(p))}
                                badge={<PayBadge status={getPaymentStatus(p, paidAmount, i, products)} />}
                                isLast={i === products.length - 1}
                            />
                        ))}
                    </Section>
                )}

                {/* Счета */}
                <Section title="Оплаченные счета">
                    {invoices.length === 0 ? (
                        <div style={{
                            padding: '20px 16px',
                            textAlign: 'center',
                            fontSize: 14,
                            color: '#888',
                        }}>
                            Нет оплат
                        </div>
                    ) : (
                        <>
                            <TableHeader />
                            {invoices.map((inv, i) => (
                                <TableRow
                                    key={inv.id}
                                    date={formatDate(inv.createdTime)}
                                    amount={formatMoney(inv.opportunity)}
                                    badge={<InvBadge stageId={inv.stageId} />}
                                    isLast={i === invoices.length - 1}
                                />
                            ))}
                        </>
                    )}
                </Section>

                {/* Связанные сделки (SALE и UC_UABTV4) */}
                {showRelated && (
                    <Section>
                        <div style={{ padding: '14px 16px' }}>
                            <Flex direction="column" gap={10} style={{ width: '100%' }}>
                                {[...relatedServices, ...publications, ...deposits].map(d => (
                                    <ChildDealCard key={d.ID} deal={d} />
                                ))}
                            </Flex>
                        </div>
                    </Section>
                )}

                {/* Документы */}
                {!isSimple && (
                    <Section title="Документы по делу">
                        {[
                            { name: 'Договор',            emoji: '📄' },
                            { name: 'Акты',               emoji: '📋' },
                            { name: 'Судебные документы', emoji: '⚖️' },
                            { name: 'Доверенности',       emoji: '📝' },
                        ].map((doc, i, arr) => (
                            <div key={doc.name}>
                                <Flex
                                    justify="space-between"
                                    align="center"
                                    style={{ padding: '14px 16px', cursor: 'pointer' }}
                                >
                                    <Flex align="center" gap={12}>
                                        <span style={{ fontSize: 20 }}>{doc.emoji}</span>
                                        <span style={{ fontSize: 15, color: '#1a1a1a' }}>{doc.name}</span>
                                    </Flex>
                                    <span style={{ fontSize: 13, color: '#888' }}>Скачать ›</span>
                                </Flex>
                                {i < arr.length - 1 && (
                                    <div style={{ height: 1, backgroundColor: BORDER, margin: '0 16px' }} />
                                )}
                            </div>
                        ))}
                    </Section>
                )}

                <div style={{ height: 32 }} />
            </Flex>
        </div>
    );
};