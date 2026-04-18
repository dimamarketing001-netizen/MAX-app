import React, { useState } from 'react';
import {
    Panel,
    Container,
    Typography,
    CellList,
    CellSimple,
    Button,
    Textarea,
    Flex,
    CellHeader,
    CellAction
} from '@maxhub/max-ui';
import styles from './Help.module.css';

// --- Моковые данные ---
const FAQ_DATA = [
    { id: 1, question: 'Как происходит оплата услуг?', answer: 'Оплата производится в два этапа: 50% предоплата для начала работы и 50% после выполнения всех работ. Мы принимаем банковские карты и безналичный расчет.' },
    { id: 2, question: 'Какие документы нужны для начала работы?', answer: 'Для начала работы нам потребуется скан вашего паспорта (основная страница и прописка) и ИНН. Все документы можно загрузить в личном кабинете.' },
];

const TICKET_TOPICS = [
    { id: 'finance', title: 'Финансовый вопрос' },
    { id: 'docs', title: 'Проблема с документами' },
    { id: 'deal', title: 'Вопрос по сделке' },
    { id: 'other', title: 'Другое' },
];

export const HelpScreen = () => {
    const [openFaqId, setOpenFaqId] = useState(null);
    const [ticketStep, setTicketStep] = useState(0); // 0: начальный, 1: выбор темы, 2: ввод текста, 3: успех
    const [ticketData, setTicketData] = useState({ topic: '', message: '' });

    const handleFaqClick = (id) => setOpenFaqId(openFaqId === id ? null : id);
    const startTicketCreation = () => setTicketStep(1);
    const selectTicketTopic = (topic) => {
        setTicketData(prev => ({ ...prev, topic }));
        setTicketStep(2);
    };
    const handleMessageChange = (e) => setTicketData(prev => ({ ...prev, message: e.target.value }));
    const sendTicket = async () => {
        const success = await onSendTicket(ticketData.topic, ticketData.message);
        if (success) {
            setTicketStep(3);
        } else {
            alert('Ошибка отправки. Попробуйте снова.');
        }
    };

    const resetTicketFlow = () => {
        setTicketData({ topic: '', message: '' });
        setTicketStep(0);
    };

    const renderContent = () => {
        switch (ticketStep) {
            case 1:
                return (
                    <Flex direction="column" gap={16}>
                        <Typography.Title variant="large-strong">Выберите тему</Typography.Title>
                        <CellList mode="island">
                            {TICKET_TOPICS.map(topic => (
                                <CellAction key={topic.id} onClick={() => selectTicketTopic(topic.title)}>
                                    {topic.title}
                                </CellAction>
                            ))}
                        </CellList>
                        <Button size="large" mode="secondary" appearance="neutral" stretched onClick={resetTicketFlow}>
                            Назад
                        </Button>
                    </Flex>
                );
            case 2:
                return (
                    <Flex direction="column" gap={16}>
                        <Typography.Title variant="large-strong">Тема: {ticketData.topic}</Typography.Title>
                        <Typography.Body>Опишите вашу ситуацию:</Typography.Body>
                        <Textarea placeholder="Введите ваше сообщение..." value={ticketData.message} onChange={handleMessageChange} />
                        <Flex gap={8}>
                            <Button size="large" mode="secondary" appearance="neutral" stretched onClick={() => setTicketStep(1)}>
                                Назад
                            </Button>
                            <Button size="large" mode="primary" appearance="themed" stretched onClick={sendTicket} disabled={!ticketData.message}>
                                Отправить
                            </Button>
                        </Flex>
                    </Flex>
                );
            case 3:
                return (
                    <Flex direction="column" align="center" justify="center" gap={16} className={styles.successScreen}>
                        <Flex direction="column" align="center" gap={8}>
                            <Typography.Title variant="large-strong">Запрос отправлен!</Typography.Title>
                            <Typography.Body>Ваш запрос зарегистрирован. Менеджер свяжется с вами в ближайшее время.</Typography.Body>
                        </Flex>
                        <Button size="large" stretched onClick={resetTicketFlow}>
                            Вернуться на главный экран
                        </Button>
                    </Flex>
                );
            default:
                return (
                    <Flex direction="column" gap={24}>
                        <Typography.Title variant="large-strong">Помощь</Typography.Title>
                        <CellList mode="island" header={<CellHeader>Часто задаваемые вопросы</CellHeader>}>
                            {FAQ_DATA.map(({ id, question, answer }) => (
                                <CellSimple
                                    key={id}
                                    onClick={() => handleFaqClick(id)}
                                    showChevron={openFaqId !== id}
                                    title={question}
                                    subtitle={openFaqId === id ? answer : undefined}
                                />
                            ))}
                        </CellList>
                        <Flex direction="column" gap={8}>
                             <Typography.Title variant="medium-strong">Не нашли ответ?</Typography.Title>
                            <Button size="large" stretched onClick={startTicketCreation}>
                                Создать запрос в поддержку
                            </Button>
                        </Flex>
                    </Flex>
                );
        }
    };

    return (
        <Panel mode="secondary" className={styles.page}>
            <Container className={styles.mainContent}>
                {renderContent()}
            </Container>
        </Panel>
    );
};
