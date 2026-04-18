import React from 'react';
import {
    Panel,
    Container,
    Flex,
    Grid,
    Typography,
    Avatar,
} from '@maxhub/max-ui';

const StatusBadge = ({ status }) => {
    const isPositive = status === 'Оплачен';
    return (
        <span style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 600,
            backgroundColor: isPositive
                ? 'var(--max--color-positive-background, #e6f4ea)'
                : 'var(--max--color-background-secondary)',
            color: isPositive
                ? 'var(--max--color-positive, #2e7d32)'
                : 'var(--max--color-text-secondary)',
        }}>
            {status}
        </span>
    );
};

export const HomeScreen = ({ user, deals, payments }) => (
    <Panel mode="secondary" style={{ minHeight: '100%', width: '100%' }}>

        {/* Шапка с приветствием */}
        <Container style={{ padding: '20px 16px 16px' }}>
            <Flex align="center" gap={12}>
                <Avatar.Container size={52} form="squircle">
                    {user.photo_url
                        ? <Avatar.Image src={user.photo_url} />
                        : <Avatar.Text>{user.first_name?.[0] || '?'}</Avatar.Text>
                    }
                </Avatar.Container>
                <Flex direction="column" gap={2}>
                    <Typography.Title style={{ margin: 0, fontSize: 18, lineHeight: 1.2 }}>
                        Привет, {user.first_name}!
                    </Typography.Title>
                    <Typography.Text style={{
                        color: 'var(--max--color-text-secondary)',
                        fontSize: 13,
                        margin: 0,
                    }}>
                        Ваш личный кабинет
                    </Typography.Text>
                </Flex>
            </Flex>
        </Container>

        {/* Сделки */}
        <Container style={{ padding: '0 16px 20px' }}>
            <Typography.Title style={{
                fontSize: 15,
                fontWeight: 700,
                margin: '0 0 10px',
                color: 'var(--max--color-text-primary)',
            }}>
                Мои дела
            </Typography.Title>

            {deals.length === 0 ? (
                <Panel mode="base" style={{ borderRadius: 12, padding: '16px' }}>
                    <Typography.Text style={{
                        color: 'var(--max--color-text-secondary)',
                        fontSize: 14,
                    }}>
                        Нет активных дел
                    </Typography.Text>
                </Panel>
            ) : (
                <Grid gap={8} cols={1}>
                    {deals.map(deal => (
                        <Panel key={deal.id} mode="base" style={{
                            borderRadius: 12,
                            padding: '14px 16px',
                        }}>
                            <Flex justify="space-between" align="flex-start" gap={8}>
                                <Flex direction="column" gap={4} style={{ flex: 1 }}>
                                    <Typography.Text style={{
                                        fontWeight: 600,
                                        fontSize: 14,
                                        lineHeight: 1.3,
                                        color: 'var(--max--color-text-primary)',
                                    }}>
                                        {deal.name}
                                    </Typography.Text>
                                    <Typography.Text style={{
                                        color: 'var(--max--color-text-secondary)',
                                        fontSize: 12,
                                    }}>
                                        {deal.status} · до {deal.deadline}
                                    </Typography.Text>
                                </Flex>
                                <Typography.Text style={{
                                    fontWeight: 700,
                                    fontSize: 14,
                                    color: 'var(--max--color-text-primary)',
                                    whiteSpace: 'nowrap',
                                }}>
                                    {deal.price}
                                </Typography.Text>
                            </Flex>
                        </Panel>
                    ))}
                </Grid>
            )}
        </Container>

        {/* Платежи */}
        <Container style={{ padding: '0 16px 32px' }}>
            <Typography.Title style={{
                fontSize: 15,
                fontWeight: 700,
                margin: '0 0 10px',
                color: 'var(--max--color-text-primary)',
            }}>
                Платежи
            </Typography.Title>

            {payments.length === 0 ? (
                <Panel mode="base" style={{ borderRadius: 12, padding: '16px' }}>
                    <Typography.Text style={{
                        color: 'var(--max--color-text-secondary)',
                        fontSize: 14,
                    }}>
                        Нет платежей
                    </Typography.Text>
                </Panel>
            ) : (
                <Grid gap={8} cols={1}>
                    {payments.map(p => (
                        <Panel key={p.id} mode="base" style={{
                            borderRadius: 12,
                            padding: '14px 16px',
                        }}>
                            <Flex justify="space-between" align="center">
                                <Flex direction="column" gap={4}>
                                    <Typography.Text style={{
                                        fontSize: 13,
                                        color: 'var(--max--color-text-primary)',
                                    }}>
                                        {p.date}
                                    </Typography.Text>
                                    <StatusBadge status={p.status} />
                                </Flex>
                                <Typography.Text style={{
                                    fontWeight: 700,
                                    fontSize: 15,
                                    color: 'var(--max--color-text-primary)',
                                }}>
                                    {p.amount}
                                </Typography.Text>
                            </Flex>
                        </Panel>
                    ))}
                </Grid>
            )}
        </Container>

    </Panel>
);