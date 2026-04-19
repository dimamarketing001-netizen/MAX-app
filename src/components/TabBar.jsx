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
            paddingBottom: 'env(safe-area-inset-bottom, 8px)',
            backgroundColor: '#FFFFFF',
            borderTop: '1px solid rgba(0,0,0,0.08)',
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
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
                }}
            >
                <span style={{ fontSize: 22 }}>
                    {tab.emoji}
                </span>
                <span
                    style={{
                        fontSize: 10,
                        fontWeight: activeTab === tab.id ? 700 : 400,
                        color: activeTab === tab.id ? '#42A5F5' : '#888888',
                    }}
                >
                    {tab.label}
                </span>
            </button>
        ))}
    </div>
);