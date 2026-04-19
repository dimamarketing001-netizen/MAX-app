import React from 'react';
import { Flex } from '@maxhub/max-ui';
import {
    getDealName,
    formatMoney,
    formatDate,
    getStageDisplay,
    getPaymentStatus,
    extractDateFromProduct,
    getProductAmount,
} from '../utils/deals';

const BG = '#F2F3F5';
const CARD_BG = '#FFFFFF';
const BORDER = 'rgba(0,0,0,0.08)';

/* ───────────────────────────────────────── Progress ───────────────────────────────────────── */

const ProgressBar = ({ paid, total }) => {
    const pct = total > 0 ? Math.min(100, (paid / total) * 100) : 0;

    return (
        <div style={{ marginTop: 8 }}>
            <div
                style={{
                    height: 6,
                    borderRadius: 4,
                    backgroundColor: 'rgba(0,0,0,0.08)',
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        height: '100%',
                        width: `${pct}%`,
                        borderRadius: 4,
                        background:
                            pct >= 100
                                ? 'linear-gradient(90deg,#43A047,#66BB6A)'
                                : 'linear-gradient(90deg,#42A5F5,#64B5F6)',
                        transition: 'width .4s ease',
                    }}
                />
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

/* ───────────────────────────────────────── Table ───────────────────────────────────────── */

const TableHeader = () => (
    <div
        style={{
            display: 'grid',
            gridTemplateColumns: '0.9fr 0.9fr 1.6fr',
            padding: '8px 16px',
            backgroundColor: 'rgba(0,0,0,0.03)',
            borderBottom: `1px solid ${BORDER}`,
        }}
    >
        {['Дата', 'Сумма', 'Статус'].map((h) => (
            <span
                key={h}
                style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#999',
                    textTransform: 'uppercase',
                }}
            >
                {h}
            </span>
        ))}
    </div>
);

const TableRow = ({ date, amount, badge, isLast }) => (
    <div>
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: '0.9fr 0.9fr 1.6fr',
                padding: '11px 16px',
                alignItems: 'center',
            }}
        >
            <span style={{ fontSize: 13 }}>{date}</span>
            <span style={{ fontSize: 13, fontWeight: 700 }}>{amount}</span>
            <div>{badge}</div>
        </div>

        {!isLast && (
            <div style={{ height: 1, backgroundColor: BORDER, margin: '0 16px' }} />
        )}
    </div>
);

const InvBadge = ({ stageId }) => {
    const isPaid = stageId === 'DT31_2:P';

    return (
        <span
            style={{
                padding: '3px 8px',
                borderRadius: 10,
                fontSize: 11,
                fontWeight: 600,
                backgroundColor: isPaid ? '#E8F5E9' : '#F5F5F5',
                color: isPaid ? '#43A047' : '#757575',
                whiteSpace: 'nowrap',
            }}
        >
            {isPaid ? '✅ Подтверждён' : '⏳ Не подтверждён'}
        </span>
    );
};

/* ───────────────────────────────────────── Section ───────────────────────────────────────── */

const Section = ({ title, children }) => (
    <div style={{ padding: '0 16px 14px' }}>
        {title && (
            <div
                style={{
                    fontSize: 15,
                    fontWeight: 700,
                    marginBottom: 10,
                }}
            >
                {title}
            </div>
        )}

        <div
            style={{
                borderRadius: 14,
                backgroundColor: CARD_BG,
                border: `1px solid ${BORDER}`,
                overflow: 'hidden',
            }}
        >
            {children}
        </div>
    </div>
);

/* ───────────────────────────────────────── Child Card ───────────────────────────────────────── */

const ChildDealCard = ({ deal }) => {
    const dealName = getDealName(deal);
    const totalAmount = parseFloat(deal.OPPORTUNITY || 0);
    const { label, bg, text } = getStageDisplay(deal);

    const isCollection = parseInt(deal.CATEGORY_ID) === 6;

    return (
        <div
            style={{
                borderRadius: 14,
                padding: '14px 16px',
                backgroundColor: '#FFFFFF',
                border: '1px solid rgba(0,0,0,0.08)',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <span
                    style={{
                        fontWeight: 700,
                        fontSize: 15,
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
            </div>

            {!isCollection && totalAmount > 0 && (
                <Flex justify="space-between" style={{ marginTop: 8 }}>
                    <span style={{ fontSize: 13, color: '#888' }}>Сумма</span>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>
                        {formatMoney(totalAmount)}
                    </span>
                </Flex>
            )}

            {deal.invoices?.length > 0 && (
                <div
                    style={{
                        marginTop: 10,
                        borderRadius: 10,
                        border: `1px solid ${BORDER}`,
                        overflow: 'hidden',
                    }}
                >
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
        </div>
    );
};

/* ───────────────────────────────────────── Screen ───────────────────────────────────────── */

export const DealDetail = ({ deal, onBack }) => {
    const dealName = getDealName(deal);
    const stageDisplay = getStageDisplay(deal);

    const totalAmount = parseFloat(deal.OPPORTUNITY || 0);
    const paidAmount = deal.paidAmount || 0;
    const remaining = totalAmount - paidAmount;

    const products = deal.products || [];
    const invoices = deal.invoices || [];

    return (
        <div style={{ backgroundColor: BG, minHeight: '100%' }}>
            <Flex direction="column">

                {/* Sticky header */}
                <div
                    style={{
                        position: 'sticky',
                        top: 0,
                        backgroundColor: BG,
                        zIndex: 10,
                        padding: '16px',
                    }}
                >
                    <Flex align="center" gap={8}>
                        <button
                            onClick={onBack}
                            style={{
                                background: 'none',
                                border: 'none',
                                fontSize: 28,
                                cursor: 'pointer',
                            }}
                        >
                            ‹
                        </button>

                        <span
                            style={{
                                fontSize: 17,
                                fontWeight: 700,
                                flex: 1,
                            }}
                        >
                            {dealName}
                        </span>
                    </Flex>
                </div>

                {/* Инфо о сделке */}
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
                            <span
                                style={{
                                    padding: '4px 12px',
                                    borderRadius: 20,
                                    backgroundColor: stageDisplay.bg,
                                    color: stageDisplay.text,
                                    fontWeight: 700,
                                }}
                            >
                                {stageDisplay.label}
                            </span>
                        </Flex>
                    </Flex>
                </div>

                {/* Category 6 */}
                {deal.relatedServices?.map((d) => (
                    <div key={d.ID} style={{ padding: '0 16px 14px' }}>
                        <ChildDealCard deal={d} />
                    </div>
                ))}

                {/* Финансы */}
                <Section title="Финансовая информация">
                    <div style={{ padding: '14px 16px' }}>
                        <Flex direction="column" gap={10}>
                            <Flex justify="space-between">
                                <span>Общая сумма</span>
                                <span style={{ fontWeight: 700 }}>
                                    {formatMoney(totalAmount)}
                                </span>
                            </Flex>

                            <Flex justify="space-between">
                                <span>Оплачено</span>
                                <span style={{ fontWeight: 700, color: '#43A047' }}>
                                    {formatMoney(paidAmount)}
                                </span>
                            </Flex>

                            <Flex justify="space-between">
                                <span>Остаток</span>
                                <span style={{ fontWeight: 700 }}>
                                    {formatMoney(remaining)}
                                </span>
                            </Flex>

                            <ProgressBar paid={paidAmount} total={totalAmount} />
                        </Flex>
                    </div>
                </Section>

                {/* Публикация */}
                {deal.publications?.map((d) => (
                    <div key={d.ID} style={{ padding: '0 16px 14px' }}>
                        <ChildDealCard deal={d} />
                    </div>
                ))}

                {/* Депозит */}
                {deal.deposits?.map((d) => (
                    <div key={d.ID} style={{ padding: '0 16px 14px' }}>
                        <ChildDealCard deal={d} />
                    </div>
                ))}

                {/* Счета */}
                <Section title="Оплаченные счета">
                    {invoices.length === 0 ? (
                        <div style={{ padding: 20, textAlign: 'center' }}>
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

                {/* Документы */}
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
                                    if (
                                        doc.type === 'contract' &&
                                        deal.contractFile
                                    ) {
                                        window.open(
                                            deal.contractFile,
                                            '_blank'
                                        );
                                    }
                                }}
                            >
                                <Flex align="center" gap={12}>
                                    <span style={{ fontSize: 20 }}>
                                        {doc.emoji}
                                    </span>
                                    <span>{doc.name}</span>
                                </Flex>
                                <span style={{ color: '#888' }}>
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

                <div style={{ height: 32 }} />
            </Flex>
        </div>
    );
};