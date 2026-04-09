import React from 'react';
import {
    Panel,
    Container,
    Flex,
    Avatar,
    Typography,
    CellList,
    CellSimple,
    CellHeader,
    Counter
} from '@maxhub/max-ui';
import styles from './Home.module.css';

export const HomeScreen = ({ user, deals, payments }) => {
    const getStatusAppearance = (status) => {
        if (status === 'Оплачен') return 'positive';
        if (status === 'В ожидании') return 'neutral';
        return 'negative';
    };

    return (
        <Panel mode="secondary" className={styles.page}>
            <Flex direction="column" gap={24}>
                <Container className={styles.header}>
                    <Flex align="center" gap={16}>
                        <Avatar.Container size={64}>
                            <Avatar.Image src={user.photo_url} />
                        </Avatar.Container>
                        <Flex direction="column" className={styles.details}>
                            <Typography.Title variant="large-strong">{`${user.first_name} ${user.last_name || ''}`}</Typography.Title>
                            <Typography.Body variant="small" className={styles.subsLabel}>Личный кабинет</Typography.Body>
                        </Flex>
                    </Flex>
                </Container>

                <Flex direction="column" gap={16} className={styles.body}>
                    <CellList
                        mode="island"
                        header={<CellHeader>Мои сделки</CellHeader>}
                    >
                        {deals.map(deal => (
                            <React.Fragment key={deal.id}>
                                <CellSimple
                                    overline={`Статус: ${deal.status}`}
                                    title={deal.name}
                                    subtitle={`Срок: ${deal.deadline}`}
                                    after={<Typography.Title variant="medium-strong">{deal.price}</Typography.Title>}
                                />
                                {payments.filter(p => p.dealId === deal.id).map(p => (
                                    <CellSimple
                                        key={p.id}
                                        title={p.date}
                                        subtitle={p.amount}
                                        after={
                                            <Counter
                                                mode="filled"
                                                appearance={getStatusAppearance(p.status)}
                                            >
                                                {p.status}
                                            </Counter>
                                        }
                                    />
                                ))}
                            </React.Fragment>
                        ))}
                    </CellList>
                </Flex>
            </Flex>
        </Panel>
    );
}
