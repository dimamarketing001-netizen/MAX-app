import React from 'react';
import { Panel, Container, Flex, Grid, Avatar } from '@maxhub/max-ui';

const StatusBadge = ({ status }) => {
    const isPositive = status === 'Оплачен';
    return (
        <span style={{
            display: 'inline-block',
            padding: '3px 10px',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 600,
            backgroundColor: isPositive ? '#e6f4ea' : '#f0f0f0',
            color: isPositive ? '#2e7d32' : '#666',
        }}>
            {status}
        </span>
    );
};

export const HomeScreen = ({ user, deals, payments }) => (
    <Panel mode="secondary" style={{ minHeight: '100%', width: '100%' }}>

        {/* Шапка */}
        <Container style={{ padding: '20px 16px 16px' }}>
            <Flex align="center" gap={12}>
                <Avatar.Container size={52} form="squircle">
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
        </Container>

        {/* Сделки */}
        <Container style={{ padding: '0 16px 20px' }}>
            <div style={{
                fontSize: 15,
                fontWeight: 700,
                color: 'var(--max--color-text-primary)',
                marginBottom: 10,
            }}>
                Мои дела
            </div>

            {deals.length === 0 ? (
                <div style={{
                    borderRadius: 12,
                    padding: 16,
                    backgroundColor: 'var(--max--color-background-content)',
                    fontSize: 14,
                    color: 'var(--max--color-text-secondary)',
                }}>
                    Нет активных дел
                </div>
            ) : (
                <Flex direction="column" gap={8}>
                    {deals.map(deal => (
                        <div key={deal.id} style={{
                            borderRadius: 12,
                            padding: '14px 16px',
                            backgroundColor: 'var(--max--color-background-content)',
                        }}>
                            <Flex justify="space-between" align="flex-start" gap={8}>
                                <Flex direction="column" gap={4} style={{ flex: 1 }}>
                                    <span style={{
                                        fontWeight: 600,
                                        fontSize: 14,
                                        lineHeight: 1.3,
                                        color: 'var(--max--color-text-primary)',
                                    }}>
                                        {deal.name}
                                    </span>
                                    <span style={{
                                        color: 'var(--max--color-text-secondary)',
                                        fontSize: 12,
                                    }}>
                                        {deal.status} · до {deal.deadline}
                                    </span>
                                </Flex>
                                <span style={{
                                    fontWeight: 700,
                                    fontSize: 14,
                                    color: 'var(--max--color-text-primary)',
                                    whiteSpace: 'nowrap',
                                }}>
                                    {deal.price}
                                </span>
                            </Flex>
                        </div>
                    ))}
                </Flex>
            )}
        </Container>

        {/* Платежи */}
        <Container style={{ padding: '0 16px 32px' }}>
            <div style={{
                fontSize: 15,
                fontWeight: 700,
                color: 'var(--max--color-text-primary)',
                marginBottom: 10,
            }}>
                Платежи
            </div>

            {payments.length === 0 ? (
                <div style={{
                    borderRadius: 12,
                    padding: 16,
                    backgroundColor: 'var(--max--color-background-content)',
                    fontSize: 14,
                    color: 'var(--max--color-text-secondary)',
                }}>
                    Нет платежей
                </div>
            ) : (
                <Flex direction="column" gap={8}>
                    {payments.map(p => (
                        <div key={p.id} style={{
                            borderRadius: 12,
                            padding: '14px 16px',
                            backgroundColor: 'var(--max--color-background-content)',
                        }}>
                            <Flex justify="space-between" align="center">
                                <Flex direction="column" gap={6}>
                                    <span style={{
                                        fontSize: 13,
                                        color: 'var(--max--color-text-primary)',
                                    }}>
                                        {p.date}
                                    </span>
                                    <StatusBadge status={p.status} />
                                </Flex>
                                <span style={{
                                    fontWeight: 700,
                                    fontSize: 15,
                                    color: 'var(--max--color-text-primary)',
                                }}>
                                    {p.amount}
                                </span>
                            </Flex>
                        </div>
                    ))}
                </Flex>
            )}
        </Container>

    </Panel>
);