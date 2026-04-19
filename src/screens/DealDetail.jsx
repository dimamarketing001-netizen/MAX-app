import React from 'react';
import { Panel, Container, Flex, Button } from '@maxhub/max-ui';
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

// ─── Прогресс-бар ─────────────────────────────────────────────────────────────
const ProgressBar = ({ paid, total }) => {
    const pct = total > 0 ? Math.min(100, (paid / total) * 100) : 0;
    return (
        <div style={{ marginTop: 8 }}>
            <div style={{
                height: 6,
                borderRadius: 3,
                backgroundColor: 'rgba(0,0,0,0.1)',
                overflow: 'hidden',
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
                    {pct.toFixed(0)}% оплачено
                </span>
                <span style={{ fontSize: 11, color: 'var(--max--color-text-secondary)' }}>
                    {formatMoney(paid)} / {formatMoney(total)}
                </span>
            </Flex>
        </div>
    );
};

// ─── Строка таблицы (дата | сумма | статус) ───────────────────────────────────
const TableRow = ({ date, amount, badge, isLast }) => (
    <div>
        <div style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr 1.1fr',
            alignItems: 'center',
            padding: '11px 16px',
            gap: 8,
        }}>
            <span style={{
                fontSize: 13,
                color: 'var(--max--color-text-primary)',
            }}>
                {date}
            </span>
            <span style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--max--color-text-primary)',
            }}>
                {amount}
            </span>
            <div>{badge}</div>
        </div>
        {!isLast && (
            <div style={{
                height: 1,
                backgroundColor: 'var(--max--color-separator)',
                margin: '0 16px',
            }} />
        )}
    </div>
);

// Заголовок таблицы
const TableHeader = () => (
    <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr 1.1fr',
        padding: '8px 16px',
        backgroundColor: 'rgba(0,0,0,0.04)',
        borderBottom: '1px solid var(--max--color-separator)',
        gap: 8,
    }}>
        {['Дата', 'Сумма', 'Статус'].map(h => (
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
);

// Бейдж статуса платежа
const PayBadge = ({ status }) => {
    const config = {
        paid:    { label: '✅ Оплачен',   color: '#2e7d32', bg: '#e6f4ea' },
        pending: { label: '⏳ Ожидает',   color: '#e65100', bg: '#fff3e0' },
        overdue: { label: '⚠ Просрочен', color: '#c62828', bg: '#fce4ec' },
    };
    const c = config[status] || config.pending;
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

// Бейдж счёта
const InvBadge = ({ stageId }) => {
    const isPaid = stageId === 'DT31_2:P';
    return (
        <span style={{
            display: 'inline-block',
            padding: '3px 8px',
            borderRadius: 10,
            fontSize: 11,
            fontWeight: 600,
            backgroundColor: isPaid ? '#e6f4ea' : '#f5f5f5',
            color: isPaid ? '#2e7d32' : '#757575',
            whiteSpace: 'nowrap',
        }}>
            {isPaid ? '✅ Подтверждён' : '⏳ Не подтверждён'}
        </span>
    );
};

// Секция с карточкой
const Section = ({ title, children }) => (
    <Container style={{ padding: '0 16px 16px' }}>
        {title && (
            <span style={{
                display: 'block',
                fontSize: 15,
                fontWeight: 700,
                color: 'var(--max--color-text-primary)',
                marginBottom: 10,
            }}>
                {title}
            </span>
        )}
        <div style={{
            borderRadius: 14,
            backgroundColor: 'var(--max--color-background-content)',
            border: '1px solid var(--max--color-separator)',
            overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>
            {children}
        </div>
    </Container>
);

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

    return (
        <Panel
            mode="secondary"
            style={{
                minHeight: '100%',
                width: '100%',
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

                {/* Шапка */}
                <Container style={{ padding: '16px 16px 0' }}>
                    <Flex align="center" gap={8} style={{ marginBottom: 16 }}>
                        <button
                            onClick={onBack}
                            style={{
                                background: 'none',
                                border: 'none',
                                fontSize: 28,
                                cursor: 'pointer',
                                color: 'var(--max--color-text-primary)',
                                padding: '0 8px 0 0',
                                lineHeight: 1,
                                flexShrink: 0,
                            }}
                        >
                            ‹
                        </button>
                        <span style={{
                            fontSize: 17,
                            fontWeight: 700,
                            color: 'var(--max--color-text-primary)',
                            flex: 1,
                            lineHeight: 1.3,
                        }}>
                            {dealName}
                        </span>
                    </Flex>

                    {/* Инфо о сделке (только не isSimple) */}
                    {!isSimple && (
                        <div style={{
                            borderRadius: 14,
                            padding: '14px 16px',
                            backgroundColor: 'var(--max--color-background-content)',
                            border: '1px solid var(--max--color-separator)',
                            marginBottom: 16,
                        }}>
                            <Flex direction="column" gap={10}>
                                {deal.UF_CRM_CONTRACT_NUM && (
                                    <Flex justify="space-between" align="center">
                                        <span style={{ fontSize: 13, color: 'var(--max--color-text-secondary)' }}>
                                            Договор №
                                        </span>
                                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--max--color-text-primary)', marginLeft: 8 }}>
                                            {deal.UF_CRM_CONTRACT_NUM}
                                        </span>
                                    </Flex>
                                )}
                                <Flex justify="space-between" align="center">
                                    <span style={{ fontSize: 13, color: 'var(--max--color-text-secondary)' }}>
                                        Дата начала
                                    </span>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--max--color-text-primary)', marginLeft: 8 }}>
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
                                        backgroundColor: stageDisplay.bg,
                                        color: stageDisplay.text,
                                        marginLeft: 8,
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
                    <div style={{ padding: '14px 16px' }}>
                        <Flex direction="column" gap={10}>
                            <Flex justify="space-between" align="center">
                                <span style={{ fontSize: 14, color: 'var(--max--color-text-secondary)' }}>
                                    Общая сумма
                                </span>
                                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--max--color-text-primary)', marginLeft: 8 }}>
                                    {formatMoney(totalAmount)}
                                </span>
                            </Flex>
                            <Flex justify="space-between" align="center">
                                <span style={{ fontSize: 14, color: 'var(--max--color-text-secondary)' }}>
                                    Оплачено
                                </span>
                                <span style={{ fontSize: 15, fontWeight: 700, color: '#2e7d32', marginLeft: 8 }}>
                                    {formatMoney(paidAmount)}
                                </span>
                            </Flex>
                            <Flex justify="space-between" align="center">
                                <span style={{ fontSize: 14, color: 'var(--max--color-text-secondary)' }}>
                                    Остаток
                                </span>
                                <span style={{
                                    fontSize: 15,
                                    fontWeight: 700,
                                    color: remaining > 0 ? '#e65100' : '#2e7d32',
                                    marginLeft: 8,
                                }}>
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

                {/* График платежей (только не isSimple) */}
                {!isSimple && products.length > 0 && (
                    <Section title="График платежей">
                        <TableHeader />
                        {products.map((p, i) => {
                            const status = getPaymentStatus(p, paidAmount, i, products);
                            return (
                                <TableRow
                                    key={p.ID || i}
                                    date={extractDateFromProduct(p)}
                                    amount={formatMoney(getProductAmount(p))}
                                    badge={<PayBadge status={status} />}
                                    isLast={i === products.length - 1}
                                />
                            );
                        })}
                    </Section>
                )}

                {/* Счета */}
                <Section title="Оплаченные счета">
                    {invoices.length === 0 ? (
                        <div style={{
                            padding: '20px 16px',
                            textAlign: 'center',
                            fontSize: 14,
                            color: 'var(--max--color-text-secondary)',
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

                {/* Публикации (для SALE и UC_UABTV4) */}
                {!isSimple && publications.length > 0 && (
                    <Section title="Публикации">
                        <TableHeader />
                        {publications.map((pub, i) => (
                            <TableRow
                                key={pub.ID}
                                date={formatDate(pub.DATE_CREATE)}
                                amount={formatMoney(pub.OPPORTUNITY)}
                                badge={<InvBadge stageId={pub.STAGE_ID} />}
                                isLast={i === publications.length - 1}
                            />
                        ))}
                    </Section>
                )}

                {/* Депозиты */}
                {!isSimple && deposits.length > 0 && (
                    <Section title="Депозит">
                        <TableHeader />
                        {deposits.map((dep, i) => (
                            <TableRow
                                key={dep.ID}
                                date={formatDate(dep.DATE_CREATE)}
                                amount={formatMoney(dep.OPPORTUNITY)}
                                badge={<InvBadge stageId={dep.STAGE_ID} />}
                                isLast={i === deposits.length - 1}
                            />
                        ))}
                    </Section>
                )}

                {/* Документы (только не isSimple) */}
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
                                        <span style={{ fontSize: 15, color: 'var(--max--color-text-primary)' }}>
                                            {doc.name}
                                        </span>
                                    </Flex>
                                    <span style={{ fontSize: 13, color: 'var(--max--color-text-secondary)' }}>
                                        Скачать ›
                                    </span>
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

            </Flex>
        </Panel>
    );
};