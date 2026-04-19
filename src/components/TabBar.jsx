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
            backgroundColor: '#FFFFFF',
            borderTop: '1px solid rgba(0,0,0,0.08)',
            flexShrink: 0,
        }}
        justify="space-around"
        align="center"
    >
        {tabs.map(tab => (
            <ToolButton
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                appearance="default"
                icon={<span style={{ fontSize: 22 }}>{tab.emoji}</span>}
                style={{
                    flex: 1,
                    minWidth: 0,
                    color: activeTab === tab.id ? '#42A5F5' : '#1a1a1a'
                }}
            >
                {tab.label}
            </ToolButton>
        ))}
    </Flex>
);