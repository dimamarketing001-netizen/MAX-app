import React, { useState } from 'react';
import { DealDetail } from './DealDetail';
import {
    getDealName,
    getShortName,
    formatMoney,
    getStageDisplay,
    getPaymentStatus,
    extractDateFromProduct,
    getProductAmount,
    getProductDate,
} from '../utils/deals';

const BG = '#F2F3F5';
const CARD_BG = '#FFFFFF';
const BORDER = 'rgba(0,0,0,0.08)';

// ─── Прогресс-бар ─────────────────────────────────────────────────────────────
const ProgressBar = ({ paid, total }) => {
    const pct = total > 0 ? Math.min(100, (paid / total) * 100) : 0;
    return (
        <div style={{ marginTop: 6, width: '100%' }}>
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
                    Оплачено {pct.toFixed(0)}%
                </span>
                <span style={{ fontSize: 11, color: '#888' }}>
                    {formatMoney(paid)} / {formatMoney(total)}
                </span>
            </div>
        </div>
    );
};

// ─── Бейдж стадии ─────────────────────────────────────────────────────────────
const StageBadge = ({ deal }) => {
    const { label, bg, text } = getStageDisplay(deal);
    return (
        <span style={{
            display: 'inline-block',
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
    );
};

// ─── Карточка сделки ──────────────────────────────────────────────────────────
const DealCard = ({ deal, onClick }) => {
    if (parseInt(deal.CATEGORY_ID) === 16 || parseInt(deal.CATEGORY_ID) === 18) return null;

    const dealName = getDealName(deal);
    const totalAmount = parseFloat(deal.OPPORTUNITY || 0);
    const paidAmount = deal.paidAmount || 0;

    return (
        <div
            onClick={() => onClick(deal)}
            style={{
                borderRadius: 14,
                padding: '14px 16px',
                backgroundColor: CARD_BG,
                cursor: 'pointer',
                border: `1px solid ${BORDER}`,
                width: '100%',
                boxSizing: 'border-box',
                userSelect: 'none',
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                transition: 'opacity 0.15s',
            }}
            onTouchStart={e => e.currentTarget.style.opacity = '0.7'}
            onTouchEnd={e => e.currentTarget.style.opacity = '1'}
            onMouseDown={e => e.currentTarget.style.opacity = '0.7'}
            onMouseUp={e => e.currentTarget.style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                width: '100%',
            }}>

                {/* Название + бейдж */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 8,
                }}>
                    <span style={{
                        fontWeight: 700,
                        fontSize: 15,
                        lineHeight: 1.3,
                        color: '#1a1a1a',
                        flex: 1,
                        minWidth: 0,
                    }}>
                        {dealName}
                    </span>
                    <StageBadge deal={deal} />
                </div>

                {/* Сумма договора */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <span style={{ fontSize: 13, color: '#888' }}>Сумма договора</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginLeft: 12 }}>
                        {formatMoney(totalAmount)}
                    </span>
                </div>

                {/* Оплачено */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <span style={{ fontSize: 13, color: '#888' }}>Оплачено</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#43A047', marginLeft: 12 }}>
                        {formatMoney(paidAmount)}
                    </span>
                </div>

                <ProgressBar paid={paidAmount} total={totalAmount} />

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: 13, color: '#42A5F5', fontWeight: 600 }}>
                        Открыть →
                    </span>
                </div>

            </div>
        </div>
    );
};

// ─── Таблица ближайших платежей ───────────────────────────────────────────────
const PaymentsTable = ({ items }) => {
    if (items.length === 0) return null;

    const statusConfig = {
        paid:    { label: 'Оплачен',   color: '#43A047', bg: '#E8F5E9', icon: '✅' },
        pending: { label: 'Ожидает',   color: '#FB8C00', bg: '#FFF3E0', icon: '⏳' },
        overdue: { label: 'Просрочен', color: '#E53935', bg: '#FFEBEE', icon: '❌' },
    };

    return (
        <div style={{
            borderRadius: 14,
            backgroundColor: CARD_BG,
            border: `1px solid ${BORDER}`,
            overflow: 'hidden',
            width: '100%',
            boxSizing: 'border-box',
        }}>
            {/* Заголовок таблицы */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '0.6fr 0.8fr 0.8fr 1.2fr',
                padding: '8px 14px',
                backgroundColor: 'rgba(0,0,0,0.03)',
                borderBottom: `1px solid ${BORDER}`,
                gap: 4,
            }}>
                {['Сделка', 'Дата', 'Сумма', 'Статус'].map(h => (
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

            {/* Строки */}
            {items.map((item, i) => {
                const sc = statusConfig[item.status] || statusConfig.pending;
                return (
                    <div key={i}>
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
                                color: '#1a1a1a',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}>
                                {getShortName(item.dealName)}
                            </span>
                            <span style={{ fontSize: 12, color: '#1a1a1a' }}>
                                {item.date}
                            </span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>
                                {formatMoney(item.amount)}
                            </span>
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3,
                                padding: '3px 7px',
                                borderRadius: 10,
                                fontSize: 11,
                                fontWeight: 600,
                                color: sc.color,
                                backgroundColor: sc.bg,
                                whiteSpace: 'nowrap',
                            }}>
                                <span style={{ fontSize: 11, lineHeight: 1 }}>{sc.icon}</span>
                                <span>{sc.label}</span>
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// ─── Аватар пользователя ──────────────────────────────────────────────────────
const UserAvatar = ({ user, size = 60 }) => {
    const initials = (user.first_name?.[0] || '?').toUpperCase();

    if (user.photo_url) {
        return (
            <img
                src={user.photo_url}
                alt="avatar"
                style={{
                    width: size,
                    height: size,
                    borderRadius: '22%',
                    objectFit: 'cover',
                    flexShrink: 0,
                    display: 'block',
                }}
            />
        );
    }

    return (
        <div style={{
            width: size,
            height: size,
            borderRadius: '22%',
            backgroundColor: '#42A5F5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: '#fff',
            fontSize: size * 0.38,
            fontWeight: 700,
        }}>
            {initials}
        </div>
    );
};

// ─── Главный экран ────────────────────────────────────────────────────────────
export const HomeScreen = ({ user, deals, onContactLawyer }) => {
    const [selectedDeal, setSelectedDeal] = useState(null);

    if (selectedDeal) {
        return (
            <div style={{ animation: 'slideIn .25s ease' }}>
                <DealDetail
                    deal={selectedDeal}
                    onBack={() => setSelectedDeal(null)}
                />
            </div>
        );
    }

    const mainDeals = deals.filter(
        d => parseInt(d.CATEGORY_ID) !== 16 && parseInt(d.CATEGORY_ID) !== 18
    );

    const allPayments = deals
        .filter(d => parseInt(d.CATEGORY_ID) !== 16 && parseInt(d.CATEGORY_ID) !== 18)
        .flatMap(deal =>
            (deal.products || []).map((p, i) => ({
                product: p,
                paidAmount: deal.paidAmount || 0,
                index: i,
                products: deal.products,
                dealName: getDealName(deal),
                date: extractDateFromProduct(p),
                amount: getProductAmount(p),
                sortDate: getProductDate(p),
                status: getPaymentStatus(p, deal.paidAmount || 0, i, deal.products),
            }))
        )
        .sort((a, b) => a.sortDate - b.sortDate)
        .slice(0, 5);

    return (
        <div style={{
            minHeight: '100%',
            width: '100%',
            backgroundColor: BG,
            boxSizing: 'border-box',
        }}>

            {/* ── Герой-блок ──────────────────────────────────────────────── */}
            <div style={{ padding: '24px 16px 20px' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'stretch', // растягиваем по высоте
                    gap: 14,
                }}>

                    {/* Аватар — растянут по высоте блока */}
                    <div style={{ flexShrink: 0, display: 'flex', alignItems: 'stretch' }}>
                        <UserAvatar user={user} size={90} />
                    </div>

                    {/* Текст + кнопка */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        flex: 1,
                        minWidth: 0,
                    }}>
                        <div>
                            <div style={{
                                fontSize: 18,
                                fontWeight: 700,
                                color: '#1a1a1a',
                                lineHeight: 1.2,
                                marginBottom: 2,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}>
                                Привет, {user.first_name}!
                            </div>
                            <div style={{ fontSize: 13, color: '#888' }}>
                                Личный кабинет клиента
                            </div>
                        </div>

                        {/* Кнопка юриста */}
                        <button
                            onClick={() => onContactLawyer?.()}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                width: '100%',
                                // flex: 1 чтобы кнопка заняла оставшееся место по высоте
                                flex: 1,
                                padding: '8px 12px',
                                borderRadius: 12,
                                border: 'none',
                                backgroundColor: '#42A5F5',
                                color: '#fff',
                                fontSize: 14,
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                transition: 'background-color 0.15s',
                                boxSizing: 'border-box',
                                touchAction: 'manipulation',
                                WebkitTapHighlightColor: 'transparent',
                                outline: 'none',
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1E88E5'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#42A5F5'}
                            onTouchStart={e => e.currentTarget.style.backgroundColor = '#1E88E5'}
                            onTouchEnd={e => e.currentTarget.style.backgroundColor = '#42A5F5'}
                        >
                            <span style={{ fontSize: 16 }}>💬</span>
                            <span>Связаться с юристом</span>
                        </button>
                    </div>

                </div>
            </div>

            {/* ── Мои сделки ──────────────────────────────────────────────── */}
            <div style={{
                padding: '0 16px 20px',
                width: '100%',
                boxSizing: 'border-box',
            }}>
                <span style={{
                    display: 'block',
                    fontSize: 17,
                    fontWeight: 700,
                    color: '#1a1a1a',
                    marginBottom: 12,
                }}>
                    Мои сделки
                </span>

                {mainDeals.length === 0 ? (
                    <div style={{
                        borderRadius: 14,
                        padding: '20px 16px',
                        backgroundColor: CARD_BG,
                        border: `1px solid ${BORDER}`,
                        textAlign: 'center',
                        fontSize: 14,
                        color: '#888',
                        width: '100%',
                        boxSizing: 'border-box',
                    }}>
                        Нет активных сделок
                    </div>
                ) : (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                        width: '100%',
                    }}>
                        {mainDeals.map(deal => (
                            <DealCard
                                key={deal.ID}
                                deal={deal}
                                onClick={setSelectedDeal}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ── Ближайшие платежи ────────────────────────────────────────── */}
            {allPayments.length > 0 && (
                <div style={{
                    padding: '0 16px 32px',
                    width: '100%',
                    boxSizing: 'border-box',
                }}>
                    <span style={{
                        display: 'block',
                        fontSize: 17,
                        fontWeight: 700,
                        color: '#1a1a1a',
                        marginBottom: 12,
                    }}>
                        Ближайшие платежи
                    </span>
                    <PaymentsTable items={allPayments} />
                </div>
            )}

            <div style={{ height: 16 }} />
        </div>
    );
};