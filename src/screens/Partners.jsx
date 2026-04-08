import React from 'react';
import { Panel, Container, Typography, Button, Flex } from '@maxhub/max-ui';

// --- Моковые данные ---
const MOCK_STATS = {
    clicks: 15,
    successfulDeals: 2,
    balance: '5 400 руб.'
};

// Формируем реферальную ссылку
const BOT_NAME = 'id6658577091_bot'; // Имя вашего бота
const USER_ID = '12345'; // ID тестового пользователя
const REFERRAL_LINK = `https://max.ru/${BOT_NAME}?startapp=ref_${USER_ID}`;
const SHARE_TEXT = 'Привет! Рекомендую отличную юридическую компанию. Зарегистрируйся по моей ссылке и получи бонус!';

export const PartnersScreen = () => {

    const webApp = window.WebApp;

    const handleShare = () => {
        if (webApp && webApp.shareMaxContent) {
            webApp.shareMaxContent({
                text: SHARE_TEXT,
                link: REFERRAL_LINK
            });
        } else {
            // Для отладки в браузере
            alert(`В реальном приложении будет открыт экран "Поделиться" со ссылкой: ${REFERRAL_LINK}`);
        }
    };

    return (
        <Panel>
            <Container>
                <Typography.Title level={1} weight="1" style={{ marginBottom: 8 }}>
                    Партнерская программа
                </Typography.Title>
                <Typography.Body>
                    Пригласите друга и получите 10% от стоимости его первой услуги на ваш бонусный счет.
                </Typography.Body>

                {/* --- Блок с реферальной ссылкой --- */}
                <div style={{ marginTop: 24 }}>
                    <Typography.Body weight="3" style={{ marginBottom: 8 }}>Ваша реферальная ссылка:</Typography.Body>
                    <Panel mode="secondary" style={{ padding: '12px', wordBreak: 'break-all' }}>
                        <Typography.Body>{REFERRAL_LINK}</Typography.Body>
                    </Panel>
                </div>

                <Button
                    size="large"
                    stretched
                    onClick={handleShare}
                    style={{ marginTop: 16 }}
                >
                    Поделиться ссылкой
                </Button>

                {/* --- Блок статистики --- */}
                <div style={{ marginTop: 32 }}>
                    <Typography.Title level={2} weight="2" style={{ marginBottom: 16 }}>
                        Ваша статистика
                    </Typography.Title>
                    <Flex justify="between">
                        <Typography.Body>Переходы по ссылке:</Typography.Body>
                        <Typography.Body weight="2">{MOCK_STATS.clicks}</Typography.Body>
                    </Flex>
                    <Flex justify="between" style={{ marginTop: 8 }}>
                        <Typography.Body>Успешные сделки:</Typography.Body>
                        <Typography.Body weight="2">{MOCK_STATS.successfulDeals}</Typography.Body>
                    </Flex>
                    <Flex justify="between" style={{ marginTop: 8 }}>
                        <Typography.Body>Бонусный баланс:</Typography.Body>
                        <Typography.Body weight="2">{MOCK_STATS.balance}</Typography.Body>
                    </Flex>
                </div>
            </Container>
        </Panel>
    );
};
