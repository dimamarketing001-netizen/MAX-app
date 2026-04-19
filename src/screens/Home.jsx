import React, { useState } from 'react';
import { Panel, Container, Flex, Avatar, Button } from '@maxhub/max-ui';
import { DealDetail } from './DealDetail';
import {
    getDealName,
    formatMoney,
    getStageDisplay,
    getPaymentStatus,
    extractDateFromProduct,
    getProductAmount,
    getProductDate,
} from '../utils/deals';

// ─── Сокращения названий сделок ───────────────────────────────────────────────
const DEAL_SHORT_NAMES = {
    'Банкротство физических лиц':     'БФЛ',
    'Юридическая услуга':             'Юр.услуга',
    'Расторжение кредитного договора':'РКД',
    'Сбор документов':                'Сб.докум.',
    'Кредитный брокер':               'КБ',
    'Исправление кредитной истории':  'ИКИ',
    'Внесудебное банкротство':        'ВБ',
    'Реструктуризация долга':         'РД',
    'Публикация':                     'Публ.',
    'Депозит':                        'Деп.',
};

function getShortName(fullName) {
    return DEAL_SHORT_NAMES[fullName] || fullName;
}

// ─── Прогресс-бар ─────────────────────────────────────────────────────────────
const ProgressBar = ({ paid, total }) => {
    const pct = total > 0 ? Math.min(100, (paid / total) * 100) : 0;
    return (
        <div style={{ marginTop: 6, width: '100%' }}>
            <div style={{
                height: 6,
                borderRadius: 3,
                backgroundColor: 'rgba(0,0,0,0.08)',
                overflow: 'hidden',
                width: '100%',
            }}>
                <div style={{
                    height: '100%',
                    width: `${pct}%`,
                    borderRadius: 3,
                    background: pct >= 100
                        ? 'linear-gradient(90deg, #2e7d32, #43a047)'
                        : 'linear-gradient(90deg, #1976d2, #42a5f5)',
                    transition: 'width 0.4s ease',
                }} />
            </div>
            <Flex justify="space-between" style={{ marginTop: 4 }}>
                <span style={{ fontSize: 11, color: 'var(--max--color-text-secondary)' }}>
                    Оплачено {pct.toFixed(0)}%
                </span>
                <span style={{ fontSize: 11, color: 'var(--max--color-text-secondary)' }}>
                    {formatMoney(paid)} / {formatMoney(total)}
                </span>
            </Flex>
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
                backgroundColor: 'var(--max--color-background-content)',
                cursor: 'pointer',
                boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                border: '1px solid var(--max--color-separator)',
                width: '100%',
                boxSizing: 'border-box',
                userSelect: 'none',
            }}
        >
            <Flex direction="column" gap={10} style={{ width: '100%' }}>

                {/* Название + бейдж */}
                <Flex
                    justify="space-between"
                    align="flex-start"
                    gap={8}
                    style={{ width: '100%' }}
                >
                    <span style={{
                        fontWeight: 700,
                        fontSize: 15,
                        lineHeight: 1.3,
                        color: 'var(--max--color-text-primary)',
                        flex: 1,
                        minWidth: 0,
                    }}>
                        {dealName}
                    </span>
                    <StageBadge deal={deal} />
                </Flex>

                {/* Сумма договора */}
                <Flex justify="space-between" align="center" style={{ width: '100%' }}>
                    <span style={{ fontSize: 13, color: 'var(--max--color-text-secondary)' }}>
                        Сумма договора
                    </span>
                    <span style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: 'var(--max--color-text-primary)',
                        marginLeft: 12,
                    }}>
                        {formatMoney(totalAmount)}
                    </span>
                </Flex>

                {/* Оплачено */}
                <Flex justify="space-between" align="center" style={{ width: '100%' }}>
                    <span style={{ fontSize: 13, color: 'var(--max--color-text-secondary)' }}>
                        Оплачено
                    </span>
                    <span style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#2e7d32',
                        marginLeft: 12,
                    }}>
                        {formatMoney(paidAmount)}
                    </span>
                </Flex>

                {/* Прогресс-бар */}
                <ProgressBar paid={paidAmount} total={totalAmount} />

                {/* Открыть → */}
                <Flex justify="flex-end">
                    <span style={{
                        fontSize: 13,
                        color: '#1976d2',
                        fontWeight: 600,
                    }}>
                        Открыть →
                    </span>
                </Flex>

            </Flex>
        </div>
    );
};

// ─── Таблица ближайших платежей ───────────────────────────────────────────────
const PaymentsTable = ({ items }) => {
    if (items.length === 0) return null;

    const statusConfig = {
        paid:    { label: '✅ Оплачен',   color: '#2e7d32' },
        pending: { label: '⏳ Ожидает',   color: '#e65100' },
        overdue: { label: '⚠ Просрочен', color: '#c62828' },
    };

    return (
        <div style={{
            borderRadius: 14,
            backgroundColor: 'var(--max--color-background-content)',
            border: '1px solid var(--max--color-separator)',
            overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
            width: '100%',
            boxSizing: 'border-box',
        }}>
            {/* Заголовок */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '0.7fr 0.9fr 0.9fr 1fr',
                padding: '8px 14px',
                backgroundColor: 'rgba(0,0,0,0.04)',
                borderBottom: '1px solid var(--max--color-separator)',
                gap: 6,
            }}>
                {['Сделка', 'Дата', 'Сумма', 'Статус'].map(h => (
                    <span key={h} style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: 'var(--max--color-text-secondary)',
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
                                backgroundColor: 'var(--max--color-separator)',
                                margin: '0 14px',
                            }} />
                        )}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '0.7fr 0.9fr 0.9fr 1fr',
                            padding: '10px 14px',
                            alignItems: 'center',
                            gap: 6,
                        }}>
                            <span style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: 'var(--max--color-text-primary)',
                                lineHeight: 1.3,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}>
                                {getShortName(item.dealName)}
                            </span>
                            <span style={{
                                fontSize: 12,
                                color: 'var(--max--color-text-primary)',
                            }}>
                                {item.date}
                            </span>
                            <span style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: 'var(--max--color-text-primary)',
                            }}>
                                {formatMoney(item.amount)}
                            </span>
                            <span style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: sc.color,
                            }}>
                                {sc.label}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// ─── Главный экран ────────────────────────────────────────────────────────────
export const HomeScreen = ({ user, deals, onContactLawyer }) => {
    const [selectedDeal, setSelectedDeal] = useState(null);

    if (selectedDeal) {
        return (
            <DealDetail
                deal={selectedDeal}
                onBack={() => setSelectedDeal(null)}
            />
        );
    }

    const mainDeals = deals.filter(
        d => parseInt(d.CATEGORY_ID) !== 16 && parseInt(d.CATEGORY_ID) !== 18
    );

    // Все платежи из всех сделок, сортируем по дате, берём 5
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
            backgroundColor: '#f2f3f5',
        }}>
            <Flex
                direction="column"
                style={{
                    minHeight: '100%',
                    width: '100%',
                }}
            >

                {/* ── Приветствие ─────────────────────────────────────────── */}
                <div style={{ padding: '20px 16px 16px' }}>
                    <div style={{
                        borderRadius: 16,
                        backgroundColor: 'var(--max--color-background-content)',
                        padding: '16px',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                        border: '1px solid var(--max--color-separator)',
                        width: '100%',
                        boxSizing: 'border-box',
                    }}>
                        <Flex align="stretch" gap={14}>

                            {/* Фото */}
                            <div style={{ flexShrink: 0 }}>
                                <Avatar.Container size={64} form="squircle">
                                    {user.photo_url
                                        ? <Avatar.Image src={user.photo_url} />
                                        : <Avatar.Text>{user.first_name?.[0] || '?'}</Avatar.Text>
                                    }
                                </Avatar.Container>
                            </div>

                            {/* Текст + кнопка */}
                            <Flex
                                direction="column"
                                justify="space-between"
                                gap={8}
                                style={{ flex: 1, minWidth: 0 }}
                            >
                                <div>
                                    <div style={{
                                        fontSize: 18,
                                        fontWeight: 700,
                                        color: 'var(--max--color-text-primary)',
                                        lineHeight: 1.2,
                                        marginBottom: 2,
                                    }}>
                                        Привет, {user.first_name}!
                                    </div>
                                    <div style={{
                                        fontSize: 13,
                                        color: 'var(--max--color-text-secondary)',
                                    }}>
                                        Личный кабинет клиента
                                    </div>
                                </div>

                                <Button
                                    size="m"
                                    appearance="accent"
                                    stretched
                                    onClick={() => onContactLawyer?.()}
                                >
                                    <Flex align="center" justify="center" gap={6}>
                                        <span style={{ fontSize: 16 }}>💬</span>
                                        <span style={{ fontSize: 13, fontWeight: 600 }}>
                                            Связаться с юристом
                                        </span>
                                    </Flex>
                                </Button>
                            </Flex>

                        </Flex>
                    </div>
                </div>

                {/* ── Мои сделки ──────────────────────────────────────────── */}
                <div style={{ padding: '0 16px 20px', width: '100%', boxSizing: 'border-box' }}>
                    <span style={{
                        display: 'block',
                        fontSize: 17,
                        fontWeight: 700,
                        color: 'var(--max--color-text-primary)',
                        marginBottom: 12,
                    }}>
                        Мои сделки
                    </span>

                    {mainDeals.length === 0 ? (
                        <div style={{
                            borderRadius: 14,
                            padding: '20px 16px',
                            backgroundColor: 'var(--max--color-background-content)',
                            border: '1px solid var(--max--color-separator)',
                            textAlign: 'center',
                            fontSize: 14,
                            color: 'var(--max--color-text-secondary)',
                            width: '100%',
                            boxSizing: 'border-box',
                        }}>
                            Нет активных сделок
                        </div>
                    ) : (
                        <Flex
                            direction="column"
                            gap={10}
                            style={{ width: '100%' }}
                        >
                            {mainDeals.map(deal => (
                                <DealCard
                                    key={deal.ID}
                                    deal={deal}
                                    onClick={setSelectedDeal}
                                />
                            ))}
                        </Flex>
                    )}
                </div>

                {/* ── Ближайшие платежи ────────────────────────────────────── */}
                {allPayments.length > 0 && (
                    <div style={{ padding: '0 16px 32px', width: '100%', boxSizing: 'border-box' }}>
                        <span style={{
                            display: 'block',
                            fontSize: 17,
                            fontWeight: 700,
                            color: 'var(--max--color-text-primary)',
                            marginBottom: 12,
                        }}>
                            Ближайшие платежи
                        </span>
                        <PaymentsTable items={allPayments} />
                    </div>
                )}

                <div style={{ height: 16 }} />

            </Flex>
        </div>
    );
};