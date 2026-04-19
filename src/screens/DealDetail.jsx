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
                    background: pct >= 100
                        ? 'linear-gradient(90deg,#43A047,#66BB6A)'
                        : 'linear-gradient(90deg,#42A5F5,#64B5F6)',
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
        gridTemplateColumns: '1fr auto auto',
        padding: '8px 16px',
        backgroundColor: 'rgba(0,0,0,0.03)',
        borderBottom: `1px solid ${BORDER}`,
        alignItems: 'center',
        width: '100%',
        boxSizing: 'border-box'
    }}>
        <span style={{
            fontSize: 10,
            fontWeight: 700,
            color: '#999',
            textTransform: 'uppercase'
        }}>
            Дата
        </span>

        <span style={{
            fontSize: 10,
            fontWeight: 700,
            color: '#999',
            textTransform: 'uppercase'
        }}>
            Сумма
        </span>

        <span style={{
            fontSize: 10,
            fontWeight: 700,
            color: '#999',
            textTransform: 'uppercase',
            textAlign: 'right'
        }}>
            Статус
        </span>
    </div>
);
const InvoicesTableHeader = () => (
    <div style={{
        display: 'grid',
        gridTemplateColumns: '0.8fr 0.7fr 0.8fr 1fr',
        padding: '8px 16px',
        backgroundColor: 'rgba(0,0,0,0.03)',
        borderBottom: `1px solid ${BORDER}`,
        width: '100%',
        boxSizing: 'border-box'
    }}>
        {['Дата','Тип','Сумма','Статус'].map(h => (
            <span key={h} style={{
                fontSize: 10,
                fontWeight: 700,
                color: '#999',
                textTransform: 'uppercase'
            }}>
                {h}
            </span>
        ))}
    </div>
);

const PaymentsTableHeader = () => (
    <div style={{
        display: 'grid',
        gridTemplateColumns: '0.9fr 0.9fr 1.6fr'
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
            }}>
                {h}
            </span>
        ))}
    </div>
);

const PaymentRow = ({ date, amount, badge, isLast }) => (
    <div>
        <div style={{
            display: 'grid',
            gridTemplateColumns: '0.9fr 0.9fr 1.6fr',
            padding: '11px 16px',
            alignItems: 'center'
        }}>
            <span style={{ fontSize: 13 }}>{date}</span>
            <span style={{ fontSize: 13, fontWeight: 700 }}>{amount}</span>
            <div style={{ display:'flex', justifyContent:'flex-end' }}>
                {badge}
            </div>
        </div>

        {!isLast && (
            <div style={{ height: 1, backgroundColor: BORDER, margin: '0 16px' }} />
        )}
    </div>
);

const InvoiceRow = ({ date, type, amount, badge, isLast }) => (
    <div>
        <div style={{
            display: 'grid',
            gridTemplateColumns: '0.8fr 0.7fr 0.8fr 1fr',
            padding: '11px 16px',
            alignItems: 'center',
            width: '100%',
            boxSizing: 'border-box'
        }}>
            <span style={{ fontSize: 13 }}>{date}</span>
            <span style={{ fontSize: 12 }}>{type}</span>
            <span style={{ fontSize: 13, fontWeight: 700 }}>
                {amount}
            </span>
            <div style={{ display:'flex', justifyContent:'flex-end' }}>
                {badge}
            </div>
        </div>

        {!isLast && (
            <div style={{ height: 1, backgroundColor: BORDER, margin: '0 16px' }} />
        )}
    </div>
);

// ─── Строка таблицы ───────────────────────────────────────────────────────────
const TableRow = ({ date, amount, badge, isLast }) => (
    <div>
        <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto auto',
            padding: '11px 16px',
            alignItems: 'center',
            width: '100%',
            boxSizing: 'border-box'
        }}>
            <span style={{
                fontSize: 13,
                color: '#1a1a1a',
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
            }}>
                {date}
            </span>

            <span style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#1a1a1a',
                marginLeft: 16,
                whiteSpace: 'nowrap'
            }}>
                {amount}
            </span>

            <div style={{
                marginLeft: 16,
                display: 'flex',
                justifyContent: 'flex-end'
            }}>
                {badge}
            </div>
        </div>

        {!isLast && (
            <div style={{
                height: 1,
                backgroundColor: BORDER,
                margin: '0 16px'
            }} />
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
            <Flex direction="column" gap={10}>

                {/* Название слева, статус ПРИЖАТ к правому краю */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        width: '100%'
                    }}
                >
                    <span
                        style={{
                            fontWeight: 700,
                            fontSize: 15,
                            color: '#1a1a1a',
                            flex: 1,
                            minWidth: 0,
                        }}
                    >
                        {dealName}
                    </span>

                    <span
                        style={{
                            marginLeft: 12,
                            padding: '3px 10px',
                            borderRadius: 20,
                            fontSize: 11,
                            fontWeight: 600,
                            backgroundColor: bg,
                            color: text,
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                        }}
                    >
                        {label}
                    </span>
                </div>

                {/* Сумма — только не для category 6 */}
                {!isCollection && totalAmount > 0 && (
                    <Flex justify="space-between">
                        <span style={{ fontSize: 13, color: '#888' }}>Сумма</span>
                        <span style={{ fontSize: 14, fontWeight: 700 }}>
                            {formatMoney(totalAmount)}
                        </span>
                    </Flex>
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
                        <div style={{ padding: '0 16px 20px' }}>
                            <Flex direction="column" gap={12}>

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

                            </Flex>
                        </div>
                    )}

                    {/* Сбор документов (category 6) — сразу после Инфо о сделке */}
                    {deal.relatedServices?.length > 0 && (
                        <Section>
                            <div style={{ padding: '14px 16px' }}>
                                <Flex direction="column" gap={10}>
                                    {deal.relatedServices.map(d => (
                                        <ChildDealCard key={d.ID} deal={d} />
                                    ))}
                                </Flex>
                            </div>
                        </Section>
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
                        <PaymentsTableHeader  />
                        {products.map((p, i) => (
                            <PaymentRow
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
                            <InvoicesTableHeader  />
                            {invoices.map((inv, i) => (
                                <InvoiceRow
                                    key={inv.id}
                                    date={formatDate(inv.createdTime)}
                                    type={getShortName(dealName)}
                                    amount={formatMoney(inv.opportunity)}
                                    badge={<InvBadge stageId={inv.stageId} />}
                                    isLast={i === invoices.length - 1}
                                />
                            ))}
                        </>
                    )}
                </Section>

                {/* Связанные сделки (SALE и UC_UABTV4) */}
                {(deal.publications?.length > 0 || deal.deposits?.length > 0) && (
                    <div style={{ padding: '0 16px 14px' }}>
                        <div style={{
                            borderRadius: 14,
                            backgroundColor: CARD_BG,
                            border: `1px solid ${BORDER}`,
                            padding: '14px 16px'
                        }}>
                            <Flex direction="column" gap={16}>

                                {[...deal.publications, ...deal.deposits].map(d => (
                                    <div key={d.ID}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <span style={{
                                                fontWeight: 700,
                                                fontSize: 15
                                            }}>
                                                {getDealName(d)}
                                            </span>

                                            <span style={{
                                                padding: '3px 10px',
                                                borderRadius: 20,
                                                fontSize: 11,
                                                fontWeight: 600,
                                                backgroundColor: getStageDisplay(d).bg,
                                                color: getStageDisplay(d).text
                                            }}>
                                                {getStageDisplay(d).label}
                                            </span>
                                        </div>

                                        {parseFloat(d.OPPORTUNITY || 0) > 0 && (
                                            <div style={{
                                                marginTop: 6,
                                                fontSize: 14,
                                                fontWeight: 700
                                            }}>
                                                {formatMoney(d.OPPORTUNITY)}
                                            </div>
                                        )}
                                    </div>
                                ))}

                            </Flex>
                        </div>
                    </div>
                )}

                {/* Документы */}
                {!isSimple && (
                    <Section title="Документы по делу">
                        {[
                            { name: 'Договор', emoji: '📄', type: 'contract' },
                            { name: 'Акты', emoji: '📋' },
                            { name: 'Судебные документы', emoji: '⚖️' },
                            { name: 'Доверенности', emoji: '📝' },
                        ].map((doc, i, arr) => (
                            <div key={doc.name}>
                                <Flex
                                    justify="space-between"
                                    align="center"
                                    style={{ padding: '14px 16px', cursor: 'pointer' }}
                                    onClick={() => {
                                        if (doc.type === 'contract' && deal.contractFile) {
                                            window.open(deal.contractFile, '_blank');
                                        }
                                    }}
                                >
                                    <Flex align="center" gap={12}>
                                        <span style={{ fontSize: 20 }}>{doc.emoji}</span>
                                        <span style={{ fontSize: 15, color: '#1a1a1a' }}>
                                            {doc.name}
                                        </span>
                                    </Flex>

                                    <span style={{ fontSize: 13, color: '#888' }}>
                                        Скачать ›
                                    </span>
                                </Flex>

                                {i < arr.length - 1 && (
                                    <div
                                        style={{
                                            height: 1,
                                            backgroundColor: BORDER,
                                            margin: '0 16px',
                                        }}
                                    />
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