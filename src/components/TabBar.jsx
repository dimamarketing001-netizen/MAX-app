import React from 'react';

const tabs = [
    { id: 'home',     label: 'Главная',   emoji: '🏠' },
    { id: 'profile',  label: 'Профиль',   emoji: '👤' },
    { id: 'help',     label: 'Помощь',    emoji: '💬' },
    { id: 'partners', label: 'Партнёрам', emoji: '🤝' },
];

export const TabBar = ({ activeTab, onTabChange }) => (
    <div
        style={{
            width: '100%',
            backgroundColor: '#FFFFFF',
            borderTop: '1px solid rgba(0,0,0,0.08)',
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            // Безопасная зона для iPhone (notch/home bar)
            paddingBottom: 'env(safe-area-inset-bottom, 8px)',
            // Минимальная высота таббара
            minHeight: 56,
            boxSizing: 'border-box',
            // Фиксируем от скролла
            position: 'relative',
            zIndex: 100,
        }}
    >
        {tabs.map(tab => (
            <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                style={{
                    flex: 1,
                    minWidth: 0,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px 4px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 3,
                    fontFamily: 'inherit',
                    // Убираем задержку клика на мобильных
                    touchAction: 'manipulation',
                    // Активное состояние при тапе
                    WebkitTapHighlightColor: 'transparent',
                    outline: 'none',
                    transition: 'opacity 0.15s',
                }}
                // Лёгкое затемнение при нажатии
                onTouchStart={e => e.currentTarget.style.opacity = '0.6'}
                onTouchEnd={e => e.currentTarget.style.opacity = '1'}
                onMouseDown={e => e.currentTarget.style.opacity = '0.6'}
                onMouseUp={e => e.currentTarget.style.opacity = '1'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
                <span style={{
                    fontSize: 22,
                    lineHeight: 1,
                    display: 'block',
                }}>
                    {tab.emoji}
                </span>
                <span
                    style={{
                        fontSize: 10,
                        fontWeight: activeTab === tab.id ? 700 : 400,
                        color: activeTab === tab.id ? '#42A5F5' : '#888888',
                        lineHeight: 1,
                        // Плавный переход цвета
                        transition: 'color 0.15s, font-weight 0.15s',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {tab.label}
                </span>
            </button>
        ))}
    </div>
);