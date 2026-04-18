import React, { useState } from 'react';
import { Panel, Container, Flex, Button } from '@maxhub/max-ui';

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
        a: 'Скан паспорта (основная страница и прописка) и ИНН.',
    },
];

const fieldStyle = {
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
                    <span style={{
                        fontSize: 20,
                        fontWeight: 700,
                        textAlign: 'center',
                        color: 'var(--max--color-text-primary)',
                    }}>
                        Запрос отправлен!
                    </span>
                    <span style={{
                        fontSize: 14,
                        color: 'var(--max--color-text-secondary)',
                        textAlign: 'center',
                        lineHeight: 1.5,
                    }}>
                        Менеджер свяжется с вами в ближайшее время
                    </span>
                    <Button size="l" appearance="accent" stretched onClick={() => { setSent(false); setMessage(''); }}>
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
                <div style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: 'var(--max--color-text-primary)',
                    marginBottom: 10,
                }}>
                    Частые вопросы
                </div>

                <div style={{
                    borderRadius: 12,
                    backgroundColor: 'var(--max--color-background-content)',
                    overflow: 'hidden',
                }}>
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
                                style={{ padding: '14px 16px', cursor: 'pointer' }}
                            >
                                <Flex justify="space-between" align="center" gap={8}>
                                    <span style={{
                                        fontWeight: 600,
                                        fontSize: 14,
                                        flex: 1,
                                        color: 'var(--max--color-text-primary)',
                                    }}>
                                        {item.q}
                                    </span>
                                    <span style={{
                                        fontSize: 18,
                                        color: 'var(--max--color-text-secondary)',
                                        transform: openFaq === i ? 'rotate(90deg)' : 'none',
                                        transition: 'transform 0.2s',
                                    }}>
                                        ›
                                    </span>
                                </Flex>
                                {openFaq === i && (
                                    <div style={{
                                        fontSize: 13,
                                        color: 'var(--max--color-text-secondary)',
                                        marginTop: 8,
                                        lineHeight: 1.5,
                                    }}>
                                        {item.a}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </Container>

            {/* Форма */}
            <Container style={{ padding: '0 16px 32px' }}>
                <div style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: 'var(--max--color-text-primary)',
                    marginBottom: 10,
                }}>
                    Написать в поддержку
                </div>

                <Flex direction="column" gap={10}>
                    <div>
                        <div style={{
                            fontSize: 12,
                            color: 'var(--max--color-text-secondary)',
                            marginBottom: 6,
                        }}>
                            Тема обращения
                        </div>
                        <select
                            style={{ ...fieldStyle, appearance: 'none' }}
                            value={topic}
                            onChange={e => setTopic(e.target.value)}
                        >
                            {TOPICS.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <div style={{
                            fontSize: 12,
                            color: 'var(--max--color-text-secondary)',
                            marginBottom: 6,
                        }}>
                            Сообщение
                        </div>
                        <textarea
                            style={{ ...fieldStyle, resize: 'none', minHeight: 120, lineHeight: 1.5 }}
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