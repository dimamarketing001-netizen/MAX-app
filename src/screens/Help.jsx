import React, { useState } from 'react';
import {
    Panel,
    Container,
    Flex,
    Typography,
    Button,
} from '@maxhub/max-ui';

const TOPICS = [
    'Финансовый вопрос',
    'Проблема с документами',
    'Вопрос по сделке',
    'Другое',
];

const FAQ = [
    {
        q: 'Как происходит оплата?',
        a: '50% предоплата для начала работы, 50% после выполнения. Принимаем карты и безнал.',
    },
    {
        q: 'Какие документы нужны?',
        a: 'Скан паспорта (основная страница и прописка) и ИНН. Загрузите в личном кабинете.',
    },
];

const selectStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    border: '1px solid var(--max--color-separator)',
    background: 'var(--max--color-background-content)',
    color: 'var(--max--color-text-primary)',
    fontSize: 15,
    boxSizing: 'border-box',
    outline: 'none',
    fontFamily: 'inherit',
    appearance: 'none',
    WebkitAppearance: 'none',
    cursor: 'pointer',
};

const textareaStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    border: '1px solid var(--max--color-separator)',
    background: 'var(--max--color-background-content)',
    color: 'var(--max--color-text-primary)',
    fontSize: 15,
    boxSizing: 'border-box',
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'none',
    minHeight: 120,
    lineHeight: 1.5,
};

const sectionStyle = {
    borderRadius: 12,
    backgroundColor: 'var(--max--color-background-content)',
    overflow: 'hidden',
    marginBottom: 12,
};

export const HelpScreen = ({ onSendTicket }) => {
    const [openFaq, setOpenFaq] = useState(null);
    const [topic, setTopic] = useState(TOPICS[0]);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSend = async () => {
        if (!message.trim()) return;
        setSending(true);
        const ok = await onSendTicket(topic, message);
        setSending(false);
        if (ok) setSent(true);
    };

    const handleReset = () => {
        setSent(false);
        setMessage('');
        setTopic(TOPICS[0]);
    };

    if (sent) {
        return (
            <Panel mode="secondary" style={{ minHeight: '100%', width: '100%' }}>
                <Flex
                    direction="column"
                    align="center"
                    justify="center"
                    gap={16}
                    style={{ minHeight: '60vh', padding: '0 32px' }}
                >
                    <span style={{ fontSize: 64 }}>✅</span>
                    <Flex direction="column" align="center" gap={8}>
                        <Typography.Title style={{ margin: 0, textAlign: 'center' }}>
                            Запрос отправлен!
                        </Typography.Title>
                        <Typography.Text style={{
                            color: 'var(--max--color-text-secondary)',
                            textAlign: 'center',
                            fontSize: 14,
                            lineHeight: 1.5,
                        }}>
                            Менеджер свяжется с вами в ближайшее время
                        </Typography.Text>
                    </Flex>
                    <Button size="l" appearance="accent" stretched onClick={handleReset}>
                        Вернуться
                    </Button>
                </Flex>
            </Panel>
        );
    }

    return (
        <Panel mode="secondary" style={{ minHeight: '100%', width: '100%' }}>

            {/* FAQ */}
            <Container style={{ padding: '20px 16px 16px' }}>
                <Typography.Title style={{
                    fontSize: 15,
                    fontWeight: 700,
                    margin: '0 0 10px',
                }}>
                    Частые вопросы
                </Typography.Title>

                <div style={sectionStyle}>
                    {FAQ.map((item, i) => (
                        <div key={i}>
                            {i > 0 && (
                                <div style={{
                                    height: 1,
                                    backgroundColor: 'var(--max--color-separator)',
                                    margin: '0 16px',
                                }} />
                            )}
                            <div
                                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                style={{
                                    padding: '14px 16px',
                                    cursor: 'pointer',
                                }}
                            >
                                <Flex justify="space-between" align="center" gap={8}>
                                    <Typography.Text style={{
                                        fontWeight: 600,
                                        fontSize: 14,
                                        flex: 1,
                                    }}>
                                        {item.q}
                                    </Typography.Text>
                                    <span style={{
                                        fontSize: 16,
                                        color: 'var(--max--color-text-secondary)',
                                        transition: 'transform 0.2s',
                                        transform: openFaq === i ? 'rotate(180deg)' : 'none',
                                    }}>
                                        ›
                                    </span>
                                </Flex>
                                {openFaq === i && (
                                    <Typography.Text style={{
                                        fontSize: 13,
                                        color: 'var(--max--color-text-secondary)',
                                        marginTop: 8,
                                        lineHeight: 1.5,
                                        display: 'block',
                                    }}>
                                        {item.a}
                                    </Typography.Text>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </Container>

            {/* Форма обращения */}
            <Container style={{ padding: '0 16px 32px' }}>
                <Typography.Title style={{
                    fontSize: 15,
                    fontWeight: 700,
                    margin: '0 0 10px',
                }}>
                    Написать в поддержку
                </Typography.Title>

                <Flex direction="column" gap={10}>
                    <div>
                        <span style={{
                            fontSize: 12,
                            color: 'var(--max--color-text-secondary)',
                            display: 'block',
                            marginBottom: 4,
                        }}>
                            Тема обращения
                        </span>
                        <div style={{ position: 'relative' }}>
                            <select
                                style={selectStyle}
                                value={topic}
                                onChange={e => setTopic(e.target.value)}
                            >
                                {TOPICS.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                            <span style={{
                                position: 'absolute',
                                right: 14,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                pointerEvents: 'none',
                                color: 'var(--max--color-text-secondary)',
                                fontSize: 12,
                            }}>
                                ▾
                            </span>
                        </div>
                    </div>

                    <div>
                        <span style={{
                            fontSize: 12,
                            color: 'var(--max--color-text-secondary)',
                            display: 'block',
                            marginBottom: 4,
                        }}>
                            Сообщение
                        </span>
                        <textarea
                            style={textareaStyle}
                            placeholder="Опишите вашу ситуацию..."
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                        />
                    </div>

                    <Button
                        size="l"
                        appearance="accent"
                        stretched
                        onClick={handleSend}
                        disabled={!message.trim() || sending}
                    >
                        {sending ? 'Отправка...' : 'Отправить'}
                    </Button>
                </Flex>
            </Container>

        </Panel>
    );
};