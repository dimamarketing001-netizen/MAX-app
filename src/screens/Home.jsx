import React, { useState } from 'react';
import { Flex, Avatar } from '@maxhub/max-ui';
import { DealDetail } from './DealDetail';
import {
    getDealName,
    formatMoney,
    getStageDisplay,
} from '../utils/deals';

const BG = '#F2F3F5';
const CARD_BG = '#FFFFFF';
const BORDER = 'rgba(0,0,0,0.08)';

/* ───────────────────────────────────────── Card ───────────────────────────────────────── */

const DealCard = ({ deal, onClick }) => {
    const dealName = getDealName(deal);
    const totalAmount = parseFloat(deal.OPPORTUNITY || 0);
    const paidAmount = deal.paidAmount || 0;
    const { label, bg, text } = getStageDisplay(deal);

    return (
        <div
            onClick={() => onClick(deal)}
            style={{
                borderRadius: 14,
                padding: '14px 16px',
                backgroundColor: CARD_BG,
                border: `1px solid ${BORDER}`,
                cursor: 'pointer',
            }}
        >
            <Flex direction="column" gap={10}>
                <Flex justify="space-between" align="center">
                    <span style={{ fontWeight: 700 }}>
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

                <Flex justify="space-between">
                    <span style={{ color: '#888' }}>Сумма договора</span>
                    <span style={{ fontWeight: 700 }}>
                        {formatMoney(totalAmount)}
                    </span>
                </Flex>

                <Flex justify="space-between">
                    <span style={{ color: '#888' }}>Оплачено</span>
                    <span style={{ fontWeight: 700, color: '#43A047' }}>
                        {formatMoney(paidAmount)}
                    </span>
                </Flex>
            </Flex>
        </div>
    );
};

/* ───────────────────────────────────────── Screen ───────────────────────────────────────── */

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
        (d) => parseInt(d.CATEGORY_ID) === 0
    );

    return (
        <div style={{ backgroundColor: BG, minHeight: '100%' }}>
            <div style={{ padding: '24px 16px' }}>
                <Flex align="center" gap={16}>
                    <Avatar.Container size={60} form="squircle">
                        {user.photo_url ? (
                            <Avatar.Image src={user.photo_url} />
                        ) : (
                            <Avatar.Text>
                                {user.first_name?.[0] || '?'}
                            </Avatar.Text>
                        )}
                    </Avatar.Container>

                    <Flex direction="column" gap={6}>
                        <span style={{ fontSize: 20, fontWeight: 700 }}>
                            Привет, {user.first_name}!
                        </span>
                        <span style={{ fontSize: 13, color: '#888' }}>
                            Личный кабинет клиента
                        </span>
                    </Flex>
                </Flex>
            </div>

            <div style={{ padding: '0 16px 24px' }}>
                <span
                    style={{
                        fontSize: 17,
                        fontWeight: 700,
                        display: 'block',
                        marginBottom: 12,
                    }}
                >
                    Мои сделки
                </span>

                {mainDeals.length === 0 ? (
                    <div
                        style={{
                            borderRadius: 14,
                            padding: 20,
                            backgroundColor: CARD_BG,
                            border: `1px solid ${BORDER}`,
                            textAlign: 'center',
                            color: '#888',
                        }}
                    >
                        Нет активных сделок
                    </div>
                ) : (
                    <Flex direction="column" gap={10}>
                        {mainDeals.map((deal) => (
                            <DealCard
                                key={deal.ID}
                                deal={deal}
                                onClick={setSelectedDeal}
                            />
                        ))}
                    </Flex>
                )}
            </div>
        </div>
    );
};