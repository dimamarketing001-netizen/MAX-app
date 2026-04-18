import React from 'react';
import { Flex, ToolButton } from '@maxhub/max-ui';

const tabs = [
    { id: 'home',     label: 'Главная',   emoji: '🏠' },
    { id: 'profile',  label: 'Профиль',   emoji: '👤' },
    { id: 'help',     label: 'Помощь',    emoji: '💬' },
    { id: 'partners', label: 'Партнёрам', emoji: '🤝' },
];

export const TabBar = ({ activeTab, onTabChange }) => (
    <Flex
        style={{
            width: '100%',
            paddingBottom: 'env(safe-area-inset-bottom, 8px)',
            backgroundColor: 'var(--max--color-background-content)',
            borderTop: '1px solid var(--max--color-separator)',
            flexShrink: 0,
        }}
        justify="space-around"
        align="center"
    >
        {tabs.map(tab => (
            <ToolButton
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                appearance={activeTab === tab.id ? 'themed' : 'default'}
                icon={<span style={{ fontSize: 22 }}>{tab.emoji}</span>}
                style={{ flex: 1, minWidth: 0 }}
            >
                {tab.label}
            </ToolButton>
        ))}
    </Flex>
);