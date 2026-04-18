import React, { useState } from 'react';
import { Panel, Container, Flex, Avatar, Button } from '@maxhub/max-ui';
import { DealDetail } from './DealDetail';
import {
    getDealName,
    formatMoney,
    getStageDisplay,
    getPaymentStatus,
    isDealWon,
} from '../utils/deals';

// ─── Прогресс-бар ─────────────────────────────────────────────────────────────
const ProgressBar = ({ paid, total }) => {
    const pct = total > 0 ? Math.min(100, (paid / total) * 100) : 0;
    return (
        <div>
            <div style={{
                height: 4,
                borderRadius: 2,
                backgroundColor: 'var(--max--color-separator)',
                overflow: 'hidden',
                marginTop: 8,
            }}>
                <div style={{
                    height: '100%',
                    width: `${pct}%`,
                    borderRadius: 2,
                    backgroundColor: pct >= 100 ? '#2e7d32' : '#1976d2',
                }} />
            </div>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 3,
                fontSize: 10,
                color: 'var(--max--color-text-secondary)',
            }}>
                <span>{pct.toFixed(0)}%</span>
                <span>{formatMoney(paid)} / {formatMoney(total)}</span>
            </div>
        </div>
    );
};

// ─── Бейдж стадии ─────────────────────────────────────────────────────────────
const StageBadge = ({ stageId }) => {
    const { label, color } = getStageDisplay(stageId);
    return (
        <span style={{
            display: 'inline-block',
            padding: '3px 10px',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 600,
            backgroundColor: color + '22',
            color: color,
            whiteSpace: 'nowrap',
        }}>
            {label}
        </span>
    );
};

// ─── Карточка сделки ──────────────────────────────────────────────────────────
const DealCard = ({ deal, onClick }) => {
    if (deal.CATEGORY_ID === 16 || deal.CATEGORY_ID === 18) return null;

    const dealName = getDealName(deal.TYPE_ID);
    const totalAmount = parseFloat(deal.OPPORTUNITY || 0);
    const paidAmount = deal.paidAmount || 0;

    return (
        <div
            onClick={() => onClick(deal)}
            style={{
                borderRadius: 12,
                padding: '14px 16px',
                backgroundColor: 'var(--max--color-background-content)',
                cursor: 'pointer',
            }}
        >
            <Flex direction="column" gap={8}>
                <Flex justify="space-between" align="flex-start" gap={8}>
                    <span style={{
                        fontWeight: 600,
                        fontSize: 14,
                        lineHeight: 1.3,
                        color: 'var(--max--color-text-primary)',
                        flex: 1,
                    }}>
                        {dealName}
                    </span>
                    <StageBadge stageId={deal.STAGE_ID} />
                </Flex>

                <Flex justify="space-between" align="center">
                    <span style={{ fontSize: 12, color: 'var(--max--color-text-secondary)' }}>
                        Сумма договора
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--max--color-text-primary)' }}>
                        {formatMoney(totalAmount)}
                    </span>
                </Flex>

                <Flex justify="space-between" align="center">
                    <span style={{ fontSize: 12, color: 'var(--max--color-text-secondary)' }}>
                        Оплачено
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#2e7d32' }}>
                        {formatMoney(paidAmount)}
                    </span>
                </Flex>

                <ProgressBar paid={paidAmount} total={totalAmount} />
            </Flex>
        </div>
    );
};

// ─── Карточка платежа ─────────────────────────────────────────────────────────
const PaymentCard = ({ product, paidAmount, index, products }) => {
    const status = getPaymentStatus(product, paidAmount, index, products);
    if (status === 'paid') return null;

    const amount = parseFloat(product.PRICE || 0) * parseFloat(product.QUANTITY || 1);
    const dateMatch = product.PRODUCT_NAME?.match(/(\d{2}[.\-/]\d{2}[.\-/]\d{4})/);
    const date = dateMatch ? dateMatch[1] : (product.PRODUCT_NAME || `Платёж ${index + 1}`);

    const statusConfig = {
        pending: { label: '⏳ Ожидает оплаты', color: '#e65100', bg: '#fff3e0' },
        overdue: { label: '⚠ Просрочено',      color: '#c62828', bg: '#fce4ec' },
    };
    const sc = statusConfig[status] || statusConfig.pending;

    return (
        <div style={{
            borderRadius: 12,
            padding: '14px 16px',
            backgroundColor: 'var(--max--color-background-content)',
            border: status === 'overdue' ? '1px solid #ffcdd2' : 'none',
        }}>
            <Flex justify="space-between" align="center" gap={8}>
                <Flex direction="column" gap={4}>
                    <span style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: 'var(--max--color-text-primary)',
                    }}>
                        {date}
                    </span>
                    <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 10,
                        fontSize: 11,
                        fontWeight: 600,
                        backgroundColor: sc.bg,
                        color: sc.color,
                        alignSelf: 'flex-start',
                    }}>
                        {sc.label}
                    </span>
                </Flex>
                <Flex direction="column" align="flex-end" gap={6}>
                    <span style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: 'var(--max--color-text-primary)',
                    }}>
                        {formatMoney(amount)}
                    </span>
                    <Button
                        size="s"
                        appearance="accent"
                        onClick={e => e.stopPropagation()}
                    >
                        Оплатить
                    </Button>
                </Flex>
            </Flex>
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

    const upcomingPayments = deals.flatMap(deal => {
        if (deal.CATEGORY_ID === 16 || deal.CATEGORY_ID === 18) return [];
        return (deal.products || []).map((p, i) => ({
            product: p,
            paidAmount: deal.paidAmount || 0,
            index: i,
            products: deal.products,
        }));
    }).filter(item =>
        getPaymentStatus(item.product, item.paidAmount, item.index, item.products) !== 'paid'
    );

    const mainDeals = deals.filter(d => d.CATEGORY_ID !== 16 && d.CATEGORY_ID !== 18);

    return (
        <Panel mode="secondary" style={{ minHeight: '100%', width: '100%' }}>

            {/* Приветствие */}
            <Container style={{ padding: '20px 16px 16px' }}>
                <Flex justify="space-between" align="center" gap={12}>
                    <Flex align="center" gap={12}>
                        <Avatar.Container size={48} form="squircle">
                            {user.photo_url
                                ? <Avatar.Image src={user.photo_url} />
                                : <Avatar.Text>{user.first_name?.[0] || '?'}</Avatar.Text>
                            }
                        </Avatar.Container>
                        <Flex direction="column" gap={2}>
                            <span style={{
                                fontSize: 18,
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
                                Ваш личный кабинет
                            </span>
                        </Flex>
                    </Flex>
                </Flex>

                <Button
                    size="l"
                    appearance="accent"
                    stretched
                    style={{ marginTop: 14 }}
                    onClick={() => onContactLawyer?.()}
                >
                    💬 Связаться с юристом
                </Button>
            </Container>

            {/* Мои сделки */}
            <Container style={{ padding: '0 16px 20px' }}>
                <div style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: 'var(--max--color-text-primary)',
                    marginBottom: 10,
                }}>
                    Мои сделки
                </div>

                {mainDeals.length === 0 ? (
                    <div style={{
                        borderRadius: 12,
                        padding: 16,
                        backgroundColor: 'var(--max--color-background-content)',
                        fontSize: 14,
                        color: 'var(--max--color-text-secondary)',
                    }}>
                        Нет активных сделок
                    </div>
                ) : (
                    <Flex direction="column" gap={8}>
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
            {upcomingPayments.length > 0 && (
                <Container style={{ padding: '0 16px 32px' }}>
                    <div style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: 'var(--max--color-text-primary)',
                        marginBottom: 10,
                    }}>
                        Ближайшие платежи
                    </div>
                    <Flex direction="column" gap={8}>
                        {upcomingPayments.slice(0, 5).map((item, i) => (
                            <PaymentCard
                                key={i}
                                product={item.product}
                                paidAmount={item.paidAmount}
                                index={item.index}
                                products={item.products}
                            />
                        ))}
                    </Flex>
                </Container>
            )}

        </Panel>
    );
};