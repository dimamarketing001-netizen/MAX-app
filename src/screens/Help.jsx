import React, { useState } from 'react';

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

const BG = '#F2F3F5';
const CARD_BG = '#FFFFFF';
const BORDER = 'rgba(0,0,0,0.08)';

const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    border: `1px solid ${BORDER}`,
    backgroundColor: CARD_BG,
    color: '#1a1a1a',
    fontSize: 15,
    boxSizing: 'border-box',
    outline: 'none',
    fontFamily: 'inherit',
    appearance: 'none',
    WebkitAppearance: 'none',
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

    // ── Экран успеха ───────────────────────────────────────────────────────────
    if (sent) {
        return (
            <div style={{
                minHeight: '100%',
                width: '100%',
                backgroundColor: BG,
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 32px',
            }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 16,
                    minHeight: '60vh',
                    justifyContent: 'center',
                }}>
                    <span style={{ fontSize: 64, lineHeight: 1 }}>✅</span>

                    <span style={{
                        fontSize: 20,
                        fontWeight: 700,
                        textAlign: 'center',
                        color: '#1a1a1a',
                    }}>
                        Запрос отправлен!
                    </span>

                    <span style={{
                        fontSize: 14,
                        color: '#888',
                        textAlign: 'center',
                        lineHeight: 1.5,
                    }}>
                        Менеджер свяжется с вами в ближайшее время
                    </span>

                    <button
                        onClick={() => { setSent(false); setMessage(''); }}
                        style={{
                            width: '100%',
                            padding: '14px 16px',
                            borderRadius: 12,
                            border: 'none',
                            backgroundColor: '#42A5F5',
                            color: '#fff',
                            fontSize: 16,
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            boxSizing: 'border-box',
                            touchAction: 'manipulation',
                            WebkitTapHighlightColor: 'transparent',
                            outline: 'none',
                            transition: 'background-color 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1E88E5'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#42A5F5'}
                        onTouchStart={e => e.currentTarget.style.backgroundColor = '#1E88E5'}
                        onTouchEnd={e => e.currentTarget.style.backgroundColor = '#42A5F5'}
                    >
                        Вернуться
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100%',
            width: '100%',
            backgroundColor: BG,
            boxSizing: 'border-box',
        }}>

            {/* ── FAQ ─────────────────────────────────────────────────────── */}
            <div style={{ padding: '20px 16px 16px' }}>
                <div style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: '#1a1a1a',
                    marginBottom: 10,
                }}>
                    Частые вопросы
                </div>

                <div style={{
                    borderRadius: 12,
                    backgroundColor: CARD_BG,
                    border: `1px solid ${BORDER}`,
                    overflow: 'hidden',
                }}>
                    {FAQ.map((item, i) => (
                        <div key={i}>
                            {i > 0 && (
                                <div style={{
                                    height: 1,
                                    backgroundColor: BORDER,
                                    margin: '0 16px',
                                }} />
                            )}
                            <div
                                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                style={{
                                    padding: '14px 16px',
                                    cursor: 'pointer',
                                    touchAction: 'manipulation',
                                    WebkitTapHighlightColor: 'transparent',
                                    userSelect: 'none',
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: 8,
                                }}>
                                    <span style={{
                                        fontWeight: 600,
                                        fontSize: 14,
                                        flex: 1,
                                        color: '#1a1a1a',
                                        lineHeight: 1.4,
                                    }}>
                                        {item.q}
                                    </span>
                                    <span style={{
                                        fontSize: 18,
                                        color: '#888',
                                        transform: openFaq === i ? 'rotate(90deg)' : 'none',
                                        transition: 'transform 0.2s ease',
                                        flexShrink: 0,
                                        lineHeight: 1,
                                    }}>
                                        ›
                                    </span>
                                </div>

                                {openFaq === i && (
                                    <div style={{
                                        fontSize: 13,
                                        color: '#888',
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
            </div>

            {/* ── Форма обращения ──────────────────────────────────────────── */}
            <div style={{ padding: '0 16px 32px' }}>
                <div style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: '#1a1a1a',
                    marginBottom: 10,
                }}>
                    Написать в поддержку
                </div>

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                }}>

                    {/* Тема */}
                    <div>
                        <div style={{
                            fontSize: 12,
                            color: '#888',
                            marginBottom: 6,
                        }}>
                            Тема обращения
                        </div>
                        <div style={{ position: 'relative' }}>
                            <select
                                style={{
                                    ...inputStyle,
                                    paddingRight: 36,
                                    cursor: 'pointer',
                                }}
                                value={topic}
                                onChange={e => setTopic(e.target.value)}
                            >
                                {TOPICS.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                            {/* Кастомная стрелка */}
                            <span style={{
                                position: 'absolute',
                                right: 12,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                fontSize: 12,
                                color: '#888',
                                pointerEvents: 'none',
                            }}>
                                ▼
                            </span>
                        </div>
                    </div>

                    {/* Сообщение */}
                    <div>
                        <div style={{
                            fontSize: 12,
                            color: '#888',
                            marginBottom: 6,
                        }}>
                            Сообщение
                        </div>
                        <textarea
                            style={{
                                ...inputStyle,
                                resize: 'none',
                                minHeight: 120,
                                lineHeight: 1.5,
                            }}
                            placeholder="Опишите вашу ситуацию..."
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                        />
                    </div>

                    {/* Кнопка отправки */}
                    <button
                        onClick={handleSend}
                        disabled={!message.trim() || sending}
                        style={{
                            width: '100%',
                            padding: '14px 16px',
                            borderRadius: 12,
                            border: 'none',
                            backgroundColor: !message.trim() || sending
                                ? '#B0BEC5'
                                : '#42A5F5',
                            color: '#fff',
                            fontSize: 16,
                            fontWeight: 600,
                            cursor: !message.trim() || sending
                                ? 'not-allowed'
                                : 'pointer',
                            fontFamily: 'inherit',
                            boxSizing: 'border-box',
                            touchAction: 'manipulation',
                            WebkitTapHighlightColor: 'transparent',
                            outline: 'none',
                            transition: 'background-color 0.15s',
                            opacity: !message.trim() || sending ? 0.7 : 1,
                        }}
                        onMouseEnter={e => {
                            if (!(!message.trim() || sending)) {
                                e.currentTarget.style.backgroundColor = '#1E88E5';
                            }
                        }}
                        onMouseLeave={e => {
                            if (!(!message.trim() || sending)) {
                                e.currentTarget.style.backgroundColor = '#42A5F5';
                            }
                        }}
                        onTouchStart={e => {
                            if (!(!message.trim() || sending)) {
                                e.currentTarget.style.backgroundColor = '#1E88E5';
                            }
                        }}
                        onTouchEnd={e => {
                            if (!(!message.trim() || sending)) {
                                e.currentTarget.style.backgroundColor = '#42A5F5';
                            }
                        }}
                    >
                        {sending ? 'Отправка...' : 'Отправить'}
                    </button>

                </div>
            </div>

        </div>
    );
};