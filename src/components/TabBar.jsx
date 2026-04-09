import React from 'react';
import { Flex, ToolButton } from '@maxhub/max-ui';
import { Icon28UserCircleOutline, Icon28HelpCircleOutline, Icon28UsersOutline, Icon28HomeOutline } from '@maxhub/icons';

const tabs = [
    { id: 'home', title: 'Главная', icon: <Icon28HomeOutline /> },
    { id: 'profile', title: 'Профиль', icon: <Icon28UserCircleOutline /> },
    { id: 'help', title: 'Помощь', icon: <Icon28HelpCircleOutline /> },
    { id: 'partners', title: 'Партнерам', icon: <Icon28UsersOutline /> },
];

export const TabBar = ({ activeTab, onTabChange }) => {
    return (
        <Flex
            style={{
                padding: '4px 0 8px',
                backgroundColor: 'var(--max--color-background-content)',
                borderTop: '1px solid var(--max--color-background-tertiary)',
            }}
        >
            {tabs.map((tab) => (
                <ToolButton
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    icon={tab.icon} // Используем реальную иконку
                    appearance={activeTab === tab.id ? 'themed' : 'default'}
                    style={{ flex: 1, minWidth: 0 }} // flex:1 для равномерного распределения, minWidth:0 для корректного сжатия
                >
                    {tab.title}
                </ToolButton>
            ))}
        </Flex>
    );
};
