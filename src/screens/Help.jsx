import React, { useState } from 'react';
import { Panel, Container, Typography, CellList, CellSimple, Button, Textarea, Flex } from '@maxhub/max-ui';

// --- Моковые данные ---
const FAQ_DATA = [
    { id: 1, question: 'Как происходит оплата услуг?', answer: 'Оплата производится в два этапа...' },
    { id: 2, question: 'Какие документы нужны для начала работы?', answer: 'Для начала работы нам потребуется ваш паспорт...' },
];

const TICKET_TOPICS = [
    { id: 'finance', title: 'Финансовый вопрос' },
    { id: 'docs', title: 'Проблема с документами' },
    { id: 'deal', title: 'Вопрос по сделке' },
    { id: 'other', title: 'Другое' },
];

export const HelpScreen = () => {
    const [openFaqId, setOpenFaqId] = useState(null);
    const [ticketStep, setTicketStep] = useState(0); // 0: начальный экран, 1: выбор темы, 2: ввод текста, 3: успех
    const [ticketData, setTicketData] = useState({ topic: '', message: '' });

    const handleFaqClick = (id) => setOpenFaqId(openFaqId === id ? null : id);

    const startTicketCreation = () => setTicketStep(1);

    const selectTicketTopic = (topic) => {
        setTicketData(prev => ({ ...prev, topic }));
        setTicketStep(2);
    };

    const handleMessageChange = (e) => {
        setTicketData(prev => ({ ...prev, message: e.target.value }));
    };

    const sendTicket = () => {
        console.log('Отправка запроса в поддержку:', ticketData);
        setTicketStep(3);
    };
    
    const resetTicketFlow = () => {
        setTicketData({ topic: '', message: '' });
        setTicketStep(0);
    }

    // --- Рендер контента в зависимости от шага ---

    const renderInitialState = () => (
        <>
            <CellList header={<Typography.Headline variant="small-caps">Часто задаваемые вопросы</Typography.Headline>}>
                {FAQ_DATA.map(({ id, question, answer }) => (
                    <React.Fragment key={id}>
                        <CellSimple onClick={() => handleFaqClick(id)} showChevron={openFaqId !== id} style={{ cursor: 'pointer' }}>
                            {question}
                        </CellSimple>
                        {openFaqId === id && <Typography.Body style={{ padding: '8px 16px 16px' }}>{answer}</Typography.Body>}
                    </React.Fragment>
                ))}
            </CellList>
            <div style={{ marginTop: 32 }}>
                <Typography.Title level={2} weight="2">Не нашли ответ?</Typography.Title>
                <Button size="large" stretched onClick={startTicketCreation} style={{ marginTop: 16 }}>
                    Создать запрос в поддержку
                </Button>
            </div>
        </>
    );

    const renderStep1_SelectTopic = () => (
        <>
            <Typography.Title level={2} weight="2" style={{ marginBottom: 16 }}>Выберите тему обращения</Typography.Title>
            {TICKET_TOPICS.map(topic => (
                <Button key={topic.id} size="large" mode="secondary" appearance="neutral" stretched onClick={() => selectTicketTopic(topic.title)} style={{ marginBottom: 8 }}>
                    {topic.title}
                </Button>
            ))}
            <Button size="large" mode="secondary" appearance="neutral" stretched onClick={resetTicketFlow} style={{ marginTop: 16 }}>
                Назад
            </Button>
        </>
    );

    const renderStep2_EnterMessage = () => (
        <>
            <Typography.Title level={2} weight="2">Тема: {ticketData.topic}</Typography.Title>
            <Typography.Body style={{ marginTop: 16, marginBottom: 8 }}>Опишите вашу ситуацию:</Typography.Body>
            <Textarea placeholder="Введите ваше сообщение..." value={ticketData.message} onChange={handleMessageChange} />
            <Flex gap={8} style={{ marginTop: 24 }}>
                <Button size="large" mode="secondary" appearance="neutral" stretched onClick={() => setTicketStep(1)}>
                    Назад
                </Button>
                <Button size="large" mode="primary" appearance="themed" stretched onClick={sendTicket} disabled={!ticketData.message}>
                    Отправить
                </Button>
            </Flex>
        </>
    );

    const renderStep3_Success = () => (
        <Flex direction="column" align="center" justify="center" style={{textAlign: 'center', height: '50vh'}}>
            <Typography.Title level={1} weight="1">Запрос отправлен!</Typography.Title>
            <Typography.Body>Ваш запрос зарегистрирован. Менеджер свяжется с вами в ближайшее время.</Typography.Body>
            <Button size="large" stretched onClick={resetTicketFlow} style={{ marginTop: 24 }}>
                Вернуться на главный экран
            </Button>
        </Flex>
    );

    const renderContent = () => {
        switch (ticketStep) {
            case 1: return renderStep1_SelectTopic();
            case 2: return renderStep2_EnterMessage();
            case 3: return renderStep3_Success();
            default: return renderInitialState();
        }
    };

    return (
        <Panel>
            <Container>
                {ticketStep === 0 && <Typography.Title level={1} weight="1" style={{ marginBottom: 24 }}>Помощь</Typography.Title>}
                {renderContent()}
            </Container>
        </Panel>
    );
};
