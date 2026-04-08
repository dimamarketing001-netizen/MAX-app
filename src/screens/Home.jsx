import React from 'react';
import {
    Panel,
    Grid,
    Container,
    Flex,
    Avatar,
    Typography,
} from '@maxhub/max-ui';

// Этот компонент почти полностью повторяет наш старый App.jsx,
// но теперь он получает данные (user, deals, payments) через props.
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
                        <Panel mode="secondary" key={deal.id}>
                            <Typography.Title level={4} weight="2">{deal.name}</Typography.Title>
                            <Flex justify="between" style={{ marginTop: 8 }}>
                                <Typography.Body>Статус:</Typography.Body>
                                <Typography.Body weight="2">{deal.status}</Typography.Body>
                            </Flex>
                             <Flex justify="between" style={{ marginTop: 4 }}>
                                <Typography.Body>Срок:</Typography.Body>
                                <Typography.Body>{deal.deadline}</Typography.Body>
                            </Flex>
                            <Flex justify="between" style={{ marginTop: 4 }}>
                                <Typography.Body>Стоимость:</Typography.Body>
                                <Typography.Body weight="2">{deal.price}</Typography.Body>
                            </Flex>
                            <div style={{ height: '1px', backgroundColor: 'var(--max--color-background-tertiary)', margin: '12px 0' }} />
                            <Typography.Body weight="3">Платежи по сделке:</Typography.Body>
                            {payments.filter(p => p.dealId === deal.id).map(p => (
                                 <Flex key={p.id} justify="between" style={{ marginTop: 4 }}>
                                    <Typography.Body>{p.date}</Typography.Body>
                                    <Typography.Body>{p.amount}</Typography.Body>
                                    <Typography.Body style={{color: p.status === 'Оплачен' ? 'var(--max--color-icon-positive)' : 'var(--max--color-icon-accent)'}}>{p.status}</Typography.Body>
                                 </Flex>
                            ))}
                        </Panel>
                    ))}
                </Grid>
            </Container>
        </Panel>
    );
}
