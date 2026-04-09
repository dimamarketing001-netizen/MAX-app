import React from 'react';
import {
    Panel,
    Grid,
    Container,
    Flex,
    Avatar,
    Typography,
} from '@maxhub/max-ui';

export const HomeScreen = ({ user, deals, payments }) => {
    return (
        <Panel>
            <Container>
                {/* --- Шапка с информацией о пользователе --- */}
                <Flex align="center" gap={16} style={{ marginBottom: 24 }}>
                    <Avatar.Container size={64} form="squircle">
                        <Avatar.Image src={user.photo_url} />
                    </Avatar.Container>
                    <Flex direction="column">
                        <Typography.Title level={2} weight="1">{`${user.first_name} ${user.last_name || ''}`}</Typography.Title>
                        <Typography.Body style={{ color: 'var(--max--color-text-secondary)' }}>Личный кабинет</Typography.Body>
                    </Flex>
                </Flex>

                {/* --- Раздел "Мои сделки" --- */}
                <Typography.Title level={3} weight="2" style={{ marginBottom: 16 }}>Мои сделки</Typography.Title>
                <Grid gap={12} cols={1}>
                    {deals.map(deal => (
                        <Panel mode="secondary" key={deal.id} style={{ padding: 16 }}> {/* Добавил padding */}
                            <Typography.Title level={4} weight="2">{deal.name}</Typography.Title>
                            <Flex justify="between" style={{ marginTop: 8 }}>
                                <Typography.Body>Статус:</Typography.Body>
                                <Typography.Body variant="medium">{deal.status}</Typography.Body> {/* Используем variant */}
                            </Flex>
                             <Flex justify="between" style={{ marginTop: 4 }}>
                                <Typography.Body>Срок:</Typography.Body>
                                <Typography.Body variant="medium">{deal.deadline}</Typography.Body> {/* Используем variant */}
                            </Flex>
                            <Flex justify="between" style={{ marginTop: 4 }}>
                                <Typography.Body>Стоимость:</Typography.Body>
                                <Typography.Body variant="medium">{deal.price}</Typography.Body> {/* Используем variant */}
                            </Flex>
                            <div style={{ height: '1px', backgroundColor: 'var(--max--color-background-tertiary)', margin: '12px 0' }} />
                            <Typography.Body variant="medium">Платежи по сделке:</Typography.Body> {/* Используем variant */}
                            {payments.filter(p => p.dealId === deal.id).map(p => (
                                 <Flex key={p.id} justify="between" style={{ marginTop: 4 }}>
                                    <Typography.Body>{p.date}</Typography.Body>
                                    <Typography.Body>{p.amount}</Typography.Body>
                                    <Typography.Body variant="medium" style={{color: p.status === 'Оплачен' ? 'var(--max--color-icon-positive)' : 'var(--max--color-icon-accent)'}}>{p.status}</Typography.Body> {/* Используем variant */}
                                 </Flex>
                            ))}
                        </Panel>
                    ))}
                </Grid>
            </Container>
        </Panel>
    );
}
