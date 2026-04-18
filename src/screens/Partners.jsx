import React from 'react';
import {
    Panel,
    Container,
    Flex,
    Grid,
    Typography,
    Button,
} from '@maxhub/max-ui';

const BOT_NAME = 'id6658577091_bot';

const BENEFITS = [
    { emoji: '💰', title: '10% с каждой сделки', desc: 'Получайте бонус от суммы первой услуги приглашённого' },
    { emoji: '📊', title: 'Статистика в реальном времени', desc: 'Следите за переходами и успешными сделками' },
    { emoji: '🚀', title: 'Мгновенные выплаты', desc: 'Бонусы начисляются сразу после завершения сделки' },
    { emoji: '🔗', title: 'Уникальная ссылка', desc: 'Ваша персональная реферальная ссылка всегда доступна' },
];

export const PartnersScreen = ({ userId }) => {
    const referralLink = `https://max.ru/${BOT_NAME}?startapp=ref_${userId}`;

    const handleShare = () => {
        const webApp = window.WebApp;
        if (webApp?.shareMaxContent) {
            webApp.shareMaxContent({
                text: `Привет! Рекомендую надёжную юридическую компанию. Регистрируйся по моей ссылке:`,
                link: referralLink,
            });
        } else {
            alert(`Ваша реферальная ссылка:\n${referralLink}`);
        }
    };

    const handleCopy = () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(referralLink).then(() => {
                const webApp = window.WebApp;
                if (webApp?.HapticFeedback) {
                    webApp.HapticFeedback.notificationOccurred('success');
                }
            });
        }
    };

    return (
        <Panel mode="secondary" style={{ minHeight: '100%', width: '100%' }}>

            {/* Заголовок */}
            <Container style={{ padding: '24px 16px 20px' }}>
                <Flex direction="column" align="center" gap={8}>
                    <span style={{ fontSize: 48 }}>🤝</span>
                    <Typography.Title style={{
                        margin: 0,
                        fontSize: 20,
                        textAlign: 'center',
                    }}>
                        Партнёрская программа
                    </Typography.Title>
                    <Typography.Text style={{
                        color: 'var(--max--color-text-secondary)',
                        textAlign: 'center',
                        fontSize: 14,
                        lineHeight: 1.5,
                    }}>
                        Приглашайте друзей и получайте{'\n'}
                        <strong>10%</strong> от стоимости их первой услуги
                    </Typography.Text>
                </Flex>
            </Container>

            {/* Преимущества */}
            <Container style={{ padding: '0 16px 20px' }}>
                <Grid gap={8} cols={1}>
                    {BENEFITS.map((b, i) => (
                        <Panel key={i} mode="base" style={{
                            borderRadius: 12,
                            padding: '14px 16px',
                        }}>
                            <Flex align="center" gap={14}>
                                <span style={{ fontSize: 28, flexShrink: 0 }}>{b.emoji}</span>
                                <Flex direction="column" gap={2}>
                                    <Typography.Text style={{
                                        fontWeight: 600,
                                        fontSize: 14,
                                        color: 'var(--max--color-text-primary)',
                                    }}>
                                        {b.title}
                                    </Typography.Text>
                                    <Typography.Text style={{
                                        color: 'var(--max--color-text-secondary)',
                                        fontSize: 12,
                                        lineHeight: 1.4,
                                    }}>
                                        {b.desc}
                                    </Typography.Text>
                                </Flex>
                            </Flex>
                        </Panel>
                    ))}
                </Grid>
            </Container>

            {/* Реферальная ссылка */}
            <Container style={{ padding: '0 16px 16px' }}>
                <Typography.Title style={{
                    fontSize: 15,
                    fontWeight: 700,
                    margin: '0 0 10px',
                }}>
                    Ваша ссылка
                </Typography.Title>

                <div
                    onClick={handleCopy}
                    style={{
                        borderRadius: 12,
                        padding: '14px 16px',
                        backgroundColor: 'var(--max--color-background-content)',
                        border: '1px solid var(--max--color-separator)',
                        cursor: 'pointer',
                    }}
                >
                    <Flex justify="space-between" align="center" gap={8}>
                        <Typography.Text style={{
                            fontSize: 12,
                            color: 'var(--max--color-text-secondary)',
                            wordBreak: 'break-all',
                            flex: 1,
                        }}>
                            {referralLink}
                        </Typography.Text>
                        <span style={{
                            fontSize: 18,
                            flexShrink: 0,
                            color: 'var(--max--color-text-secondary)',
                        }}>
                            📋
                        </span>
                    </Flex>
                </div>
            </Container>

            {/* Кнопка */}
            <Container style={{ padding: '0 16px 32px' }}>
                <Button
                    size="l"
                    appearance="accent"
                    stretched
                    onClick={handleShare}
                >
                    Поделиться ссылкой
                </Button>
            </Container>

        </Panel>
    );
};