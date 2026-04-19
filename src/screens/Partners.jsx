import React from 'react';

const BOT_NAME = 'id6658577091_bot';

const BENEFITS = [
    { emoji: '💰', title: '10% с каждой сделки', desc: 'Бонус от суммы первой услуги приглашённого' },
    { emoji: '📊', title: 'Статистика в реальном времени', desc: 'Следите за переходами и успешными сделками' },
    { emoji: '🚀', title: 'Мгновенные выплаты', desc: 'Бонусы начисляются сразу после завершения сделки' },
    { emoji: '🔗', title: 'Уникальная ссылка', desc: 'Ваша персональная реферальная ссылка всегда доступна' },
];

const BG = '#F2F3F5';
const CARD_BG = '#FFFFFF';
const BORDER = 'rgba(0,0,0,0.08)';

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
        <div style={{
            minHeight: '100%',
            width: '100%',
            backgroundColor: BG,
            boxSizing: 'border-box',
        }}>

            {/* ── Заголовок ───────────────────────────────────────────────── */}
            <div style={{ padding: '24px 16px 20px' }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                }}>
                    <span style={{
                        fontSize: 48,
                        lineHeight: 1,
                    }}>
                        🤝
                    </span>
                    <span style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: '#1a1a1a',
                        textAlign: 'center',
                    }}>
                        Партнёрская программа
                    </span>
                    <span style={{
                        fontSize: 14,
                        color: '#888',
                        textAlign: 'center',
                        lineHeight: 1.5,
                        maxWidth: 280,
                    }}>
                        Приглашайте друзей и получайте{' '}
                        <strong style={{ color: '#1a1a1a' }}>10%</strong>{' '}
                        от стоимости их первой услуги
                    </span>
                </div>
            </div>

            {/* ── Преимущества ─────────────────────────────────────────────── */}
            <div style={{ padding: '0 16px 20px' }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                }}>
                    {BENEFITS.map((b, i) => (
                        <div
                            key={i}
                            style={{
                                borderRadius: 12,
                                padding: '14px 16px',
                                backgroundColor: CARD_BG,
                                border: `1px solid ${BORDER}`,
                                boxSizing: 'border-box',
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 14,
                            }}>
                                <span style={{
                                    fontSize: 28,
                                    flexShrink: 0,
                                    lineHeight: 1,
                                }}>
                                    {b.emoji}
                                </span>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 2,
                                    flex: 1,
                                    minWidth: 0,
                                }}>
                                    <span style={{
                                        fontWeight: 600,
                                        fontSize: 14,
                                        color: '#1a1a1a',
                                        lineHeight: 1.3,
                                    }}>
                                        {b.title}
                                    </span>
                                    <span style={{
                                        fontSize: 12,
                                        color: '#888',
                                        lineHeight: 1.4,
                                    }}>
                                        {b.desc}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Реферальная ссылка ───────────────────────────────────────── */}
            <div style={{ padding: '0 16px 16px' }}>
                <div style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: '#1a1a1a',
                    marginBottom: 10,
                }}>
                    Ваша ссылка
                </div>

                <div
                    onClick={handleCopy}
                    style={{
                        borderRadius: 12,
                        padding: '14px 16px',
                        backgroundColor: CARD_BG,
                        border: `1px solid ${BORDER}`,
                        cursor: 'pointer',
                        boxSizing: 'border-box',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent',
                        userSelect: 'none',
                        transition: 'opacity 0.15s',
                    }}
                    onTouchStart={e => e.currentTarget.style.opacity = '0.6'}
                    onTouchEnd={e => e.currentTarget.style.opacity = '1'}
                    onMouseDown={e => e.currentTarget.style.opacity = '0.6'}
                    onMouseUp={e => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 8,
                    }}>
                        <span style={{
                            fontSize: 12,
                            color: '#888',
                            wordBreak: 'break-all',
                            flex: 1,
                            lineHeight: 1.4,
                        }}>
                            {referralLink}
                        </span>
                        <span style={{
                            fontSize: 18,
                            flexShrink: 0,
                            lineHeight: 1,
                        }}>
                            📋
                        </span>
                    </div>

                    {/* Подсказка */}
                    <div style={{
                        marginTop: 6,
                        fontSize: 11,
                        color: '#42A5F5',
                        fontWeight: 500,
                    }}>
                        Нажмите, чтобы скопировать
                    </div>
                </div>
            </div>

            {/* ── Кнопка поделиться ────────────────────────────────────────── */}
            <div style={{ padding: '0 16px 32px' }}>
                <button
                    onClick={handleShare}
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
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1E88E5'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#42A5F5'}
                    onTouchStart={e => e.currentTarget.style.backgroundColor = '#1E88E5'}
                    onTouchEnd={e => e.currentTarget.style.backgroundColor = '#42A5F5'}
                >
                    <span style={{ fontSize: 18, lineHeight: 1 }}>🔗</span>
                    <span>Поделиться ссылкой</span>
                </button>
            </div>

        </div>
    );
};