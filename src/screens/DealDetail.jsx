import React from 'react';
import { Panel, Container, Flex, Button } from '@maxhub/max-ui';
import {
    getDealName,
    formatMoney,
    formatDate,
    getStageDisplay,
    getPaymentStatus,
    CATEGORY_NAMES,
} from '../utils/deals';

// Прогресс-бар
const ProgressBar = ({ paid, total }) => {
    const pct = total > 0 ? Math.min(100, (paid / total) * 100) : 0;
    return (
        <div style={{ marginTop: 8 }}>
            <div style={{
                height: 6,
                borderRadius: 3,
                backgroundColor: 'var(--max--color-separator)',
                overflow: 'hidden',
            }}>
                <div style={{
                    height: '100%',
                    width: `${pct}%`,
                    borderRadius: 3,
                    backgroundColor: pct >= 100
                        ? 'var(--max--color-positive, #2e7d32)'
                        : 'var(--max--color-accent, #1976d2)',
                    transition: 'width 0.3s ease',
                }} />
            </div>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 4,
                fontSize: 11,
                color: 'var(--max--color-text-secondary)',
            }}>
                <span>{pct.toFixed(0)}% оплачено</span>
                <span>{formatMoney(paid)} / {formatMoney(total)}</span>
            </div>
        </div>
    );
};

// Бейдж статуса платежа
const PayStatusBadge = ({ status }) => {
    const config = {
        paid:    { label: '✅ Оплачен',         bg: '#e6f4ea', color: '#2e7d32' },
        pending: { label: '⏳ Ожидает оплаты',  bg: '#fff3e0', color: '#e65100' },
        overdue: { label: '⚠ Просрочено',       bg: '#fce4ec', color: '#c62828' },
    };
    const c = config[status] || config.pending;
    return (
        <span style={{
            display: 'inline-block',
            padding: '3px 8px',
            borderRadius: 12,
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

// Бейдж статуса счёта
const InvoiceStatusBadge = ({ stageId }) => {
    const isPaid = stageId === 'DT31_2:P';
    return (
        <span style={{
            display: 'inline-block',
            padding: '3px 8px',
            borderRadius: 12,
            fontSize: 11,
            fontWeight: 600,
            backgroundColor: isPaid ? '#e6f4ea' : '#f5f5f5',
            color: isPaid ? '#2e7d32' : '#666',
            whiteSpace: 'nowrap',
        }}>
            {isPaid ? '✅ Подтверждён' : '⏳ Не подтверждён'}
        </span>
    );
};

// Секция-карточка
const Section = ({ title, children }) => (
    <Container style={{ padding: '0 16px 16px' }}>
        {title && (
            <div style={{
                fontSize: 15,
                fontWeight: 700,
                color: 'var(--max--color-text-primary)',
                marginBottom: 10,
            }}>
                {title}
            </div>
        )}
        <div style={{
            borderRadius: 12,
            backgroundColor: 'var(--max--color-background-content)',
            overflow: 'hidden',
        }}>
            {children}
        </div>
    </Container>
);

// Строка в таблице
const TableRow = ({ date, amount, badge, isLast }) => (
    <div>
        <Flex
            justify="space-between"
            align="center"
            gap={8}
            style={{ padding: '12px 16px' }}
        >
            <Flex direction="column" gap={4} style={{ flex: 1 }}>
                <span style={{ fontSize: 13, color: 'var(--max--color-text-primary)' }}>
                    {date}
                </span>
                {badge}
            </Flex>
            <span style={{
                fontWeight: 700,
                fontSize: 14,
                color: 'var(--max--color-text-primary)',
                whiteSpace: 'nowrap',
            }}>
                {amount}
            </span>
        </Flex>
        {!isLast && (
            <div style={{
                height: 1,
                backgroundColor: 'var(--max--color-separator)',
                margin: '0 16px',
            }} />
        )}
    </div>
);

export const DealDetail = ({ deal, onBack }) => {
    // Для карточек Публикация и Депозит — упрощённый вид
    const isSimple = deal.CATEGORY_ID === 16 || deal.CATEGORY_ID === 18;
    const categoryName = isSimple ? CATEGORY_NAMES[deal.CATEGORY_ID] : null;

    const stageDisplay = getStageDisplay(deal.STAGE_ID);
    const totalAmount = parseFloat(deal.OPPORTUNITY || 0);
    const paidAmount = deal.paidAmount || 0;
    const remaining = totalAmount - paidAmount;

    const dealName = isSimple
        ? categoryName
        : getDealName(deal.TYPE_ID);

    const products = deal.products || [];
    const invoices = deal.invoices || [];

    return (
        <Panel mode="secondary" style={{ minHeight: '100%', width: '100%' }}>

            {/* Шапка */}
            <Container style={{ padding: '16px 16px 0' }}>
                <Flex align="center" gap={12} style={{ marginBottom: 16 }}>
                    <button
                        onClick={onBack}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: 24,
                            cursor: 'pointer',
                            color: 'var(--max--color-text-primary)',
                            padding: '4px 8px 4px 0',
                            lineHeight: 1,
                        }}
                    >
                        ‹
                    </button>
                    <span style={{
                        fontSize: 17,
                        fontWeight: 700,
                        color: 'var(--max--color-text-primary)',
                        flex: 1,
                    }}>
                        {dealName}
                    </span>
                </Flex>

                {!isSimple && (
                    <div style={{
                        borderRadius: 12,
                        padding: '16px',
                        backgroundColor: 'var(--max--color-background-content)',
                        marginBottom: 16,
                    }}>
                        <Flex direction="column" gap={8}>
                            {deal.UF_CRM_CONTRACT_NUM && (
                                <Flex justify="space-between">
                                    <span style={{ fontSize: 13, color: 'var(--max--color-text-secondary)' }}>
                                        Договор №
                                    </span>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--max--color-text-primary)' }}>
                                        {deal.UF_CRM_CONTRACT_NUM}
                                    </span>
                                </Flex>
                            )}
                            <Flex justify="space-between">
                                <span style={{ fontSize: 13, color: 'var(--max--color-text-secondary)' }}>
                                    Дата начала
                                </span>
                                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--max--color-text-primary)' }}>
                                    {formatDate(deal.DATE_CREATE)}
                                </span>
                            </Flex>
                            <Flex justify="space-between" align="center">
                                <span style={{ fontSize: 13, color: 'var(--max--color-text-secondary)' }}>
                                    Статус
                                </span>
                                <span style={{
                                    display: 'inline-block',
                                    padding: '4px 12px',
                                    borderRadius: 20,
                                    fontSize: 12,
                                    fontWeight: 700,
                                    backgroundColor: stageDisplay.color + '22',
                                    color: stageDisplay.color,
                                }}>
                                    {stageDisplay.label}
                                </span>
                            </Flex>
                        </Flex>
                    </div>
                )}
            </Container>

            {/* Финансовая информация */}
            <Section title="Финансовая информация">
                <div style={{ padding: '16px' }}>
                    <Flex direction="column" gap={10}>
                        <Flex justify="space-between">
                            <span style={{ fontSize: 14, color: 'var(--max--color-text-secondary)' }}>
                                Общая сумма
                            </span>
                            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--max--color-text-primary)' }}>
                                {formatMoney(totalAmount)}
                            </span>
                        </Flex>
                        <Flex justify="space-between">
                            <span style={{ fontSize: 14, color: 'var(--max--color-text-secondary)' }}>
                                Оплачено
                            </span>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#2e7d32' }}>
                                {formatMoney(paidAmount)}
                            </span>
                        </Flex>
                        <Flex justify="space-between">
                            <span style={{ fontSize: 14, color: 'var(--max--color-text-secondary)' }}>
                                Остаток
                            </span>
                            <span style={{ fontSize: 14, fontWeight: 700, color: remaining > 0 ? '#e65100' : '#2e7d32' }}>
                                {formatMoney(remaining)}
                            </span>
                        </Flex>
                        <ProgressBar paid={paidAmount} total={totalAmount} />
                    </Flex>
                </div>

                <div style={{
                    height: 1,
                    backgroundColor: 'var(--max--color-separator)',
                    margin: '0 16px',
                }} />

                <div style={{ padding: '12px 16px' }}>
                    <Button size="l" appearance="accent" stretched onClick={() => {}}>
                        Оплатить
                    </Button>
                </div>
            </Section>

            {/* График платежей — только для не isSimple */}
            {!isSimple && products.length > 0 && (
                <Section title="График платежей">
                    {products.map((p, i) => {
                        const status = getPaymentStatus(p, paidAmount, i, products);
                        const amount = parseFloat(p.PRICE || 0) * parseFloat(p.QUANTITY || 1);
                        // Дата из названия товара
                        const dateMatch = p.PRODUCT_NAME?.match(/(\d{2}[.\-/]\d{2}[.\-/]\d{4})/);
                        const date = dateMatch ? dateMatch[1] : (p.PRODUCT_NAME || `Платёж ${i + 1}`);
                        return (
                            <TableRow
                                key={p.ID || i}
                                date={date}
                                amount={formatMoney(amount)}
                                badge={<PayStatusBadge status={status} />}
                                isLast={i === products.length - 1}
                            />
                        );
                    })}
                </Section>
            )}

            {/* Счета */}
            {invoices.length > 0 && (
                <Section title="Оплаченные счета">
                    {invoices.map((inv, i) => (
                        <TableRow
                            key={inv.ID}
                            date={formatDate(inv.DATE_CREATE)}
                            amount={formatMoney(inv.OPPORTUNITY)}
                            badge={<InvoiceStatusBadge stageId={inv.STAGE_ID} />}
                            isLast={i === invoices.length - 1}
                        />
                    ))}
                </Section>
            )}

            {/* Документы — только не isSimple */}
            {!isSimple && (
                <Section title="Документы по делу">
                    {[
                        { name: 'Договор', emoji: '📄' },
                        { name: 'Акты', emoji: '📋' },
                        { name: 'Судебные документы', emoji: '⚖️' },
                        { name: 'Доверенности', emoji: '📝' },
                    ].map((doc, i, arr) => (
                        <div key={doc.name}>
                            <Flex
                                justify="space-between"
                                align="center"
                                style={{ padding: '14px 16px', cursor: 'pointer' }}
                                onClick={() => {}}
                            >
                                <Flex align="center" gap={12}>
                                    <span style={{ fontSize: 20 }}>{doc.emoji}</span>
                                    <span style={{
                                        fontSize: 15,
                                        color: 'var(--max--color-text-primary)',
                                    }}>
                                        {doc.name}
                                    </span>
                                </Flex>
                                <Flex align="center" gap={8}>
                                    <span style={{
                                        fontSize: 12,
                                        color: 'var(--max--color-text-secondary)',
                                    }}>
                                        Скачать
                                    </span>
                                    <span style={{
                                        fontSize: 18,
                                        color: 'var(--max--color-text-secondary)',
                                    }}>
                                        ›
                                    </span>
                                </Flex>
                            </Flex>
                            {i < arr.length - 1 && (
                                <div style={{
                                    height: 1,
                                    backgroundColor: 'var(--max--color-separator)',
                                    margin: '0 16px',
                                }} />
                            )}
                        </div>
                    ))}
                </Section>
            )}

            <div style={{ height: 32 }} />
        </Panel>
    );
};