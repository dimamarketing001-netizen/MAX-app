import React from 'react';
import {
    getDealName,
    formatMoney,
    getShortName,
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
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 4,
            }}>
                <span style={{ fontSize: 11, color: '#888' }}>
                    {pct.toFixed(0)}% оплачено
                </span>
                <span style={{ fontSize: 11, color: '#888' }}>
                    {formatMoney(paid)} / {formatMoney(total)}
                </span>
            </div>
        </div>
    );
};

// ─── Заголовок таблицы платежей ───────────────────────────────────────────────
const PaymentsTableHeader = () => (
    <div style={{
        display: 'grid',
        // Дата чуть правее, сумма по центру, статус прижат к левому краю бейджа
        gridTemplateColumns: '1fr 1fr 130px',
        padding: '8px 16px',
        backgroundColor: 'rgba(0,0,0,0.03)',
        borderBottom: `1px solid ${BORDER}`,
        gap: 8,
    }}>
        {['Дата', 'Сумма', 'Статус'].map((h, i) => (
            <span key={h} style={{
                fontSize: 10,
                fontWeight: 700,
                color: '#999',
                textTransform: 'uppercase',
                // Статус прижат влево внутри своей колонки
                textAlign: i === 2 ? 'left' : 'left',
            }}>
                {h}
            </span>
        ))}
    </div>
);

// ─── Строка платежа ───────────────────────────────────────────────────────────
const PaymentRow = ({ date, amount, badge, isLast }) => (
    <div>
        <div style={{
            display: 'grid',
            gridTemplateColumns: '0.9fr 0.9fr 1.6fr',
            padding: '11px 16px',
            alignItems: 'center',
        }}>
            <span style={{ fontSize: 13 }}>{date}</span>
            <span style={{ fontSize: 13, fontWeight: 700 }}>{amount}</span>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                {badge}
            </div>
        </div>
        {!isLast && (
            <div style={{ height: 1, backgroundColor: BORDER, margin: '0 16px' }} />
        )}
    </div>
);

// ─── Бейдж платежа ────────────────────────────────────────────────────────────
const PayBadge = ({ status }) => {
    const c = {
        paid:    { label: 'Оплачен',   color: '#43A047', bg: '#E8F5E9', icon: '✅' },
        pending: { label: 'Ожидает',   color: '#FB8C00', bg: '#FFF3E0', icon: '⏳' },
        overdue: { label: 'Просрочен', color: '#E53935', bg: '#FFEBEE', icon: '❌' },
    }[status] || { label: 'Ожидает', color: '#FB8C00', bg: '#FFF3E0', icon: '⏳' };

    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: 4,
            // Фиксированная ширина — все бейджи одинаковые
            width: 110,
            padding: '5px 10px',
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 600,
            backgroundColor: c.bg,
            color: c.color,
            whiteSpace: 'nowrap',
            boxSizing: 'border-box',
        }}>
            <span style={{ fontSize: 13, lineHeight: 1, flexShrink: 0 }}>
                {c.icon}
            </span>
            <span>{c.label}</span>
        </span>
    );
};

// ─── Секция-карточка ──────────────────────────────────────────────────────────
const Section = ({ title, children }) => (
    <div style={{
        padding: '0 16px 14px',
        width: '100%',
        boxSizing: 'border-box',
    }}>
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
    const { label, bg, text } = getStageDisplay(deal);
    const isCollection = parseInt(deal.CATEGORY_ID) === 6;

    return (
        <div style={{
            borderRadius: 14,
            padding: '14px 16px',
            backgroundColor: CARD_BG,
            border: `1px solid ${BORDER}`,
            width: '100%',
            boxSizing: 'border-box',
        }}>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
            }}>
                {/* Название + статус */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                }}>
                    <span style={{
                        fontWeight: 700,
                        fontSize: 15,
                        color: '#1a1a1a',
                        flex: 1,
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginRight: 12,
                    }}>
                        {dealName}
                    </span>
                    <span style={{
                        padding: '3px 10px',
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 600,
                        backgroundColor: bg,
                        color: text,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                    }}>
                        {label}
                    </span>
                </div>

                {/* Сумма — только не для category 6 */}
                {!isCollection && totalAmount > 0 && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                    }}>
                        <span style={{ fontSize: 13, color: '#888' }}>Сумма</span>
                        <span style={{ fontSize: 14, fontWeight: 700 }}>
                            {formatMoney(totalAmount)}
                        </span>
                    </div>
                )}
            </div>
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

    return (
        <div style={{
            minHeight: '100%',
            width: '100%',
            backgroundColor: BG,
            boxSizing: 'border-box',
        }}>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100%',
                width: '100%',
            }}>

                {/* ── Шапка ───────────────────────────────────────────────── */}
                <div style={{ padding: '16px 16px 0' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 16,
                    }}>
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
                                touchAction: 'manipulation',
                                WebkitTapHighlightColor: 'transparent',
                                outline: 'none',
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
                            // Длинное название не ломает шапку
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}>
                            {dealName}
                        </span>
                    </div>

                    {/* ── Инфо о сделке ───────────────────────────────────── */}
                    {!isSimple && (
                        <div style={{ padding: '0 16px 20px' }}>
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 12,
                            }}>
                                {deal.UF_CRM_CONTRACT_NUM && (
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}>
                                        <span style={{ color: '#888' }}>Договор №</span>
                                        <span style={{ fontWeight: 600 }}>
                                            {deal.UF_CRM_CONTRACT_NUM}
                                        </span>
                                    </div>
                                )}

                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}>
                                    <span style={{ color: '#888' }}>Дата начала</span>
                                    <span style={{ fontWeight: 600 }}>
                                        {formatDate(deal.DATE_CREATE)}
                                    </span>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}>
                                    <span style={{ color: '#888' }}>Статус</span>
                                    <span style={{
                                        padding: '4px 12px',
                                        borderRadius: 20,
                                        backgroundColor: stageDisplay.bg,
                                        color: stageDisplay.text,
                                        fontWeight: 700,
                                        fontSize: 13,
                                    }}>
                                        {stageDisplay.label}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Финансы ─────────────────────────────────────────────── */}
                <Section title="Финансовая информация">
                    <div style={{ padding: '14px 16px' }}>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 10,
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}>
                                <span style={{ fontSize: 14, color: '#888' }}>Общая сумма</span>
                                <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginLeft: 12 }}>
                                    {formatMoney(totalAmount)}
                                </span>
                            </div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}>
                                <span style={{ fontSize: 14, color: '#888' }}>Оплачено</span>
                                <span style={{ fontSize: 15, fontWeight: 700, color: '#43A047', marginLeft: 12 }}>
                                    {formatMoney(paidAmount)}
                                </span>
                            </div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}>
                                <span style={{ fontSize: 14, color: '#888' }}>Остаток</span>
                                <span style={{
                                    fontSize: 15,
                                    fontWeight: 700,
                                    color: remaining > 0 ? '#FB8C00' : '#43A047',
                                    marginLeft: 12,
                                }}>
                                    {formatMoney(remaining)}
                                </span>
                            </div>
                            <ProgressBar paid={paidAmount} total={totalAmount} />
                        </div>
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
                                touchAction: 'manipulation',
                                WebkitTapHighlightColor: 'transparent',
                                outline: 'none',
                                transition: 'background-color 0.15s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1E88E5'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#42A5F5'}
                            onTouchStart={e => e.currentTarget.style.backgroundColor = '#1E88E5'}
                            onTouchEnd={e => e.currentTarget.style.backgroundColor = '#42A5F5'}
                        >
                            Оплатить
                        </button>
                    </div>
                </Section>

                {/* ── График платежей ──────────────────────────────────────── */}
                {!isSimple && products.length > 0 && (
                    <Section title="График платежей">
                        <PaymentsTableHeader />
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

                {/* ── Оплаченные счета ─────────────────────────────────────── */}
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
                            {/* Заголовок */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '0.6fr 0.8fr 0.8fr 1.2fr',
                                padding: '8px 14px',
                                backgroundColor: 'rgba(0,0,0,0.03)',
                                borderBottom: `1px solid ${BORDER}`,
                                gap: 4,
                            }}>
                                {['Тип', 'Дата', 'Сумма', 'Статус'].map(h => (
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

                            {/* Строки счетов */}
                            {invoices.map((inv, i) => {
                                const isPaid = inv.stageId === 'DT31_2:P';
                                const statusLabel = isPaid ? '✅' : '⏳';
                                return (
                                    <div key={inv.id}>
                                        {i > 0 && (
                                            <div style={{
                                                height: 1,
                                                backgroundColor: BORDER,
                                                margin: '0 14px',
                                            }} />
                                        )}
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: '0.6fr 0.8fr 0.8fr 1.2fr',
                                            padding: '10px 14px',
                                            alignItems: 'center',
                                            gap: 4,
                                        }}>
                                            <span style={{
                                                fontSize: 11,
                                                fontWeight: 600,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}>
                                                {getShortName(dealName)}
                                            </span>
                                            <span style={{ fontSize: 12 }}>
                                                {formatDate(inv.createdTime)}
                                            </span>
                                            <span style={{ fontSize: 12, fontWeight: 700 }}>
                                                {formatMoney(inv.opportunity)}
                                            </span>
                                            <span style={{ fontSize: 11 }}>
                                                {statusLabel}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Легенда */}
                            <div style={{
                                padding: '10px 14px 14px',
                                fontSize: 11,
                                color: '#888',
                                borderTop: `1px solid ${BORDER}`,
                                lineHeight: 1.4,
                            }}>
                                ✅ — Подтверждённая оплата<br />
                                ⏳ — Не подтверждённая оплата
                            </div>
                        </>
                    )}
                </Section>

                {/* ── Связанные сделки ─────────────────────────────────────── */}
                {(relatedServices.length > 0 ||
                    publications.length > 0 ||
                    deposits.length > 0) && (

                    <div style={{ padding: '0 16px 14px' }}>
                        <span style={{
                            display: 'block',
                            fontSize: 15,
                            fontWeight: 700,
                            color: '#1a1a1a',
                            marginBottom: 10,
                        }}>
                            Связанные услуги
                        </span>
                        <div style={{
                            borderRadius: 14,
                            backgroundColor: CARD_BG,
                            border: `1px solid ${BORDER}`,
                            padding: '16px',
                            boxSizing: 'border-box',
                        }}>
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 18,
                            }}>
                                {[...relatedServices, ...publications, ...deposits].map(d => {
                                    const { label, bg, text } = getStageDisplay(d);
                                    const sum = parseFloat(d.OPPORTUNITY || 0);

                                    return (
                                        <div key={d.ID}>
                                            {/* Название + статус */}
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                gap: 8,
                                            }}>
                                                <span style={{
                                                    fontWeight: 700,
                                                    fontSize: 15,
                                                    flex: 1,
                                                    minWidth: 0,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    {getDealName(d)}
                                                </span>
                                                <span style={{
                                                    padding: '3px 10px',
                                                    borderRadius: 20,
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                    backgroundColor: bg,
                                                    color: text,
                                                    whiteSpace: 'nowrap',
                                                    flexShrink: 0,
                                                }}>
                                                    {label}
                                                </span>
                                            </div>

                                            {/* Сумма */}
                                            {sum > 0 && (
                                                <div style={{ marginTop: 6, fontSize: 14 }}>
                                                    <span style={{ color: '#888', marginRight: 6 }}>
                                                        Сумма
                                                    </span>
                                                    <span style={{ fontWeight: 700 }}>
                                                        {formatMoney(sum)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Документы ────────────────────────────────────────────── */}
                {!isSimple && (
                    <Section title="Документы по делу">
                        {[
                            { name: 'Договор',            emoji: '📄', type: 'contract' },
                            { name: 'Акты',               emoji: '📋' },
                            { name: 'Судебные документы', emoji: '⚖️' },
                            { name: 'Доверенности',       emoji: '📝' },
                        ].map((doc, i, arr) => (
                            <div key={doc.name}>
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '14px 16px',
                                        cursor: 'pointer',
                                        touchAction: 'manipulation',
                                        WebkitTapHighlightColor: 'transparent',
                                    }}
                                    onClick={() => {
                                        if (doc.type === 'contract' && deal.contractFile) {
                                            window.open(deal.contractFile, '_blank');
                                        }
                                    }}
                                >
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                    }}>
                                        <span style={{ fontSize: 20 }}>{doc.emoji}</span>
                                        <span style={{ fontSize: 15, color: '#1a1a1a' }}>
                                            {doc.name}
                                        </span>
                                    </div>
                                    <span style={{ fontSize: 13, color: '#888' }}>
                                        Скачать ›
                                    </span>
                                </div>

                                {i < arr.length - 1 && (
                                    <div style={{
                                        height: 1,
                                        backgroundColor: BORDER,
                                        margin: '0 16px',
                                    }} />
                                )}
                            </div>
                        ))}
                    </Section>
                )}

                <div style={{ height: 32 }} />
            </div>
        </div>
    );
};