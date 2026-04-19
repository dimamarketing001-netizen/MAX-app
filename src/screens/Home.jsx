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

// ─── Прогресс-бар ─────────────────────────────────────────────────────────────
const ProgressBar = ({ paid, total }) => {
    const pct = total > 0 ? Math.min(100, (paid / total) * 100) : 0;
    return (
        <div style={{ marginTop: 6 }}>
            {/* Визуальная линия */}
            <div style={{
                height: 6,
                borderRadius: 3,
                backgroundColor: 'rgba(0,0,0,0.1)',
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
            {/* Подпись */}
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
    // Скрываем Публикации и Депозиты из общего списка
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
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                border: '1px solid var(--max--color-separator)',
                transition: 'opacity 0.15s',
                userSelect: 'none',
            }}
        >
            <Flex direction="column" gap={10}>

                {/* Название + бейдж */}
                <Flex justify="space-between" align="flex-start" gap={8}>
                    <span style={{
                        fontWeight: 700,
                        fontSize: 15,
                        lineHeight: 1.3,
                        color: 'var(--max--color-text-primary)',
                        flex: 1,
                    }}>
                        {dealName}
                    </span>
                    <StageBadge deal={deal} />
                </Flex>

                {/* Сумма договора */}
                <Flex justify="space-between" align="center">
                    <span style={{
                        fontSize: 13,
                        color: 'var(--max--color-text-secondary)',
                    }}>
                        Сумма договора
                    </span>
                    <span style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: 'var(--max--color-text-primary)',
                        marginLeft: 8,
                    }}>
                        {formatMoney(totalAmount)}
                    </span>
                </Flex>

                {/* Оплачено */}
                <Flex justify="space-between" align="center">
                    <span style={{
                        fontSize: 13,
                        color: 'var(--max--color-text-secondary)',
                    }}>
                        Оплачено
                    </span>
                    <span style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#2e7d32',
                        marginLeft: 8,
                    }}>
                        {formatMoney(paidAmount)}
                    </span>
                </Flex>

                {/* Прогресс-бар */}
                <ProgressBar paid={paidAmount} total={totalAmount} />

                {/* Открыть */}
                <Flex justify="flex-end" align="center">
                    <span style={{
                        fontSize: 13,
                        color: 'var(--max--color-accent, #1976d2)',
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
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        }}>
            {/* Заголовок таблицы */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1.2fr 1fr 0.8fr',
                padding: '8px 14px',
                backgroundColor: 'rgba(0,0,0,0.04)',
                borderBottom: '1px solid var(--max--color-separator)',
            }}>
                {['Сделка', 'Дата', 'Сумма', 'Статус'].map(h => (
                    <span key={h} style={{
                        fontSize: 11,
                        fontWeight: 600,
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
                            gridTemplateColumns: '1fr 1.2fr 1fr 0.8fr',
                            padding: '10px 14px',
                            alignItems: 'center',
                        }}>
                            <span style={{
                                fontSize: 12,
                                color: 'var(--max--color-text-primary)',
                                fontWeight: 500,
                                paddingRight: 6,
                                lineHeight: 1.3,
                            }}>
                                {item.dealName}
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

    // Основные сделки (без Публикаций и Депозитов)
    const mainDeals = deals.filter(
        d => parseInt(d.CATEGORY_ID) !== 16 && parseInt(d.CATEGORY_ID) !== 18
    );

    // Собираем все платежи из всех сделок, сортируем по дате, берём 5
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
        <Panel
            mode="secondary"
            style={{
                minHeight: '100%',
                width: '100%',
                // Фон на весь скролл
                background: 'var(--max--color-background-secondary)',
            }}
        >
            <Flex
                direction="column"
                style={{
                    minHeight: '100%',
                    background: 'var(--max--color-background-secondary)',
                }}
            >

                {/* Приветствие */}
                <Container style={{ padding: '20px 16px 0' }}>
                    <Flex align="center" gap={14} style={{ marginBottom: 16 }}>
                        <Avatar.Container size={52} form="squircle">
                            {user.photo_url
                                ? <Avatar.Image src={user.photo_url} />
                                : <Avatar.Text>{user.first_name?.[0] || '?'}</Avatar.Text>
                            }
                        </Avatar.Container>
                        <Flex direction="column" gap={3}>
                            <span style={{
                                fontSize: 20,
                                fontWeight: 700,
                                color: 'var(--max--color-text-primary)',
                                lineHeight: 1.2,
                            }}>
                                Привет, {user.first_name}!
                            </span>
                            <span style={{
                                fontSize: 13,
                                color: 'var(--max--color-text-secondary)',
                            }}>
                                Личный кабинет клиента
                            </span>
                        </Flex>
                    </Flex>

                    {/* Кнопка юриста */}
                    <Button
                        size="l"
                        appearance="accent"
                        stretched
                        onClick={() => onContactLawyer?.()}
                        style={{ marginBottom: 24 }}
                    >
                        <Flex align="center" justify="center" gap={8}>
                            <span style={{ fontSize: 18 }}>💬</span>
                            <span>Связаться с юристом</span>
                        </Flex>
                    </Button>
                </Container>

                {/* Мои сделки */}
                <Container style={{ padding: '0 16px 20px' }}>
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
                        }}>
                            Нет активных сделок
                        </div>
                    ) : (
                        <Flex direction="column" gap={10}>
                            {mainDeals.map(deal => (
                                <DealCard
                                    key={deal.ID}
                                    deal={deal}
                                    onClick={setSelectedDeal}
                                />
                            ))}
                        </Flex>
                    )}
                </Container>

                {/* Ближайшие платежи */}
                {allPayments.length > 0 && (
                    <Container style={{ padding: '0 16px 32px' }}>
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
                    </Container>
                )}

                {/* Нижний отступ */}
                <div style={{ height: 16, flexShrink: 0 }} />

            </Flex>
        </Panel>
    );
};