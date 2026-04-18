import React from 'react';
import { Panel, Container, Flex, Button } from '@maxhub/max-ui';

const BOT_NAME = 'id6658577091_bot';

const BENEFITS = [
    { emoji: '💰', title: '10% с каждой сделки', desc: 'Бонус от суммы первой услуги приглашённого' },
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
                text: 'Привет! Рекомендую надёжную юридическую компанию. Регистрируйся по моей ссылке:',
                link: referralLink,
            });
        } else {
            alert(`Ваша реферальная ссылка:\n${referralLink}`);
        }
    };

    const handleCopy = () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(referralLink).then(() => {
                try {
                    window.WebApp?.HapticFeedback?.notificationOccurred('success');
                } catch (e) {}
            });
        }
    };

    return (
        <Panel mode="secondary" style={{ minHeight: '100%', width: '100%' }}>

            {/* Заголовок */}
            <Container style={{ padding: '24px 16px 20px' }}>
                <Flex direction="column" align="center" gap={8}>
                    <span style={{ fontSize: 48 }}>🤝</span>
                    <span style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: 'var(--max--color-text-primary)',
                        textAlign: 'center',
                    }}>
                        Партнёрская программа
                    </span>
                    <span style={{
                        fontSize: 14,
                        color: 'var(--max--color-text-secondary)',
                        textAlign: 'center',
                        lineHeight: 1.5,
                    }}>
                        Приглашайте друзей и получайте <strong>10%</strong> от стоимости их первой услуги
                    </span>
                </Flex>
            </Container>

            {/* Преимущества */}
            <Container style={{ padding: '0 16px 20px' }}>
                <Flex direction="column" gap={8}>
                    {BENEFITS.map((b, i) => (
                        <div key={i} style={{
                            borderRadius: 12,
                            padding: '14px 16px',
                            backgroundColor: 'var(--max--color-background-content)',
                        }}>
                            <Flex align="center" gap={14}>
                                <span style={{ fontSize: 28, flexShrink: 0 }}>{b.emoji}</span>
                                <Flex direction="column" gap={2}>
                                    <span style={{
                                        fontWeight: 600,
                                        fontSize: 14,
                                        color: 'var(--max--color-text-primary)',
                                    }}>
                                        {b.title}
                                    </span>
                                    <span style={{
                                        fontSize: 12,
                                        color: 'var(--max--color-text-secondary)',
                                        lineHeight: 1.4,
                                    }}>
                                        {b.desc}
                                    </span>
                                </Flex>
                            </Flex>
                        </div>
                    ))}
                </Flex>
            </Container>

            {/* Ссылка */}
            <Container style={{ padding: '0 16px 16px' }}>
                <div style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: 'var(--max--color-text-primary)',
                    marginBottom: 10,
                }}>
                    Ваша ссылка
                </div>
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
                        <span style={{
                            fontSize: 12,
                            color: 'var(--max--color-text-secondary)',
                            wordBreak: 'break-all',
                            flex: 1,
                        }}>
                            {referralLink}
                        </span>
                        <span style={{ fontSize: 18, flexShrink: 0 }}>📋</span>
                    </Flex>
                </div>
            </Container>

            {/* Кнопка */}
            <Container style={{ padding: '0 16px 32px' }}>
                <Button size="l" appearance="accent" stretched onClick={handleShare}>
                    Поделиться ссылкой
                </Button>
            </Container>

        </Panel>
    );
};