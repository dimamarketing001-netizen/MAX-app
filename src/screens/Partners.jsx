import React from 'react';
import {
    Panel,
    Container,
    Typography,
    Button,
    Flex,
    CellList,
    CellHeader,
    CellSimple,
    CellAction
} from '@maxhub/max-ui';

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

    const handleCopy = () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(REFERRAL_LINK).then(() => {
                // Можно добавить уведомление об успешном копировании
                if (webApp && webApp.HapticFeedback) {
                    webApp.HapticFeedback.notificationOccurred('success');
                }
            });
        }
    };

    return (
        <Panel mode="secondary">
            <Flex direction="column" gap={24}>
                <Container>
                    <Typography.Title variant="large-strong">
                        Партнерская программа
                    </Typography.Title>
                    <Typography.Body>
                        Пригласите друга и получите 10% от стоимости его первой услуги на ваш бонусный счет.
                    </Typography.Body>
                </Container>

                <CellList
                    mode="island"
                    header={<CellHeader>Ваша реферальная ссылка</CellHeader>}
                >
                    <CellAction
                        onClick={handleCopy}
                        title={REFERRAL_LINK}
                        style={{ wordBreak: 'break-all' }}
                    />
                </CellList>

                <Container>
                    <Button
                        size="large"
                        stretched
                        onClick={handleShare}
                    >
                        Поделиться ссылкой
                    </Button>
                </Container>

                <CellList
                    mode="island"
                    header={<CellHeader>Ваша статистика</CellHeader>}
                >
                    <CellSimple title="Переходы по ссылке" after={<Typography.Body variant="medium-strong">{MOCK_STATS.clicks}</Typography.Body>} />
                    <CellSimple title="Успешные сделки" after={<Typography.Body variant="medium-strong">{MOCK_STATS.successfulDeals}</Typography.Body>} />
                    <CellSimple title="Бонусный баланс" after={<Typography.Body variant="medium-strong">{MOCK_STATS.balance}</Typography.Body>} />
                </CellList>
            </Flex>
        </Panel>
    );
};
