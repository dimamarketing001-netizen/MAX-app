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
import styles from './Partners.module.css';

// --- Моковые данные ---
const MOCK_STATS = {
    clicks: 15,
    successfulDeals: 2,
    balance: '5 400 руб.'
};

// Формируем реферальную ссылку
const BOT_NAME = 'id6658577091_bot'; // Имя вашего бота
const SHARE_TEXT = 'Привет! Рекомендую отличную юридическую компанию. Зарегистрируйся по моей ссылке и получи бонус!';

export const PartnersScreen = ({ userId }) => {
    const REFERRAL_LINK = `https://max.ru/${BOT_NAME}?startapp=ref_${userId}`;

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
        <Panel mode="secondary" className={styles.page}>
            <Flex direction="column" gap={24}>
                <Container className={styles.header}>
                    <Typography.Title variant="large-strong">
                        Партнерская программа
                    </Typography.Title>
                    <Typography.Body>
                        Пригласите друга и получите 10% от стоимости его первой услуги на ваш бонусный счет.
                    </Typography.Body>
                </Container>

                <Flex direction="column" gap={16} className={styles.body}>
                    <CellList
                        mode="island"
                        header={<CellHeader>Ваша реферальная ссылка</CellHeader>}
                    >
                        <CellAction
                            onClick={handleCopy}
                            title={REFERRAL_LINK}
                        />
                    </CellList>

                    <Container className={styles.actions}>
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
            </Flex>
        </Panel>
    );
};
