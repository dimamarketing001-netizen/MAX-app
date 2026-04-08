import React from 'react';
import { Flex, ToolButton } from '@maxhub/max-ui';
// В будущем здесь можно будет импортировать настоящие иконки
// import { Icon28UserCircleOutline, Icon28HelpCircleOutline, Icon28UsersOutline, Icon28HomeOutline } from '@maxhub/icons';

// Используем временные заглушки для иконок
const IconPlaceholder = () => <div style={{ width: 28, height: 28 }} />;

const tabs = [
    { id: 'home', title: 'Главная' },
    { id: 'profile', title: 'Профиль' },
    { id: 'help', title: 'Помощь' },
    { id: 'partners', title: 'Партнерам' },
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
                    icon={<IconPlaceholder />}
                    appearance={activeTab === tab.id ? 'themed' : 'default'}
                    style={{ flex: 1 }}
                >
                    {tab.title}
                </ToolButton>
            ))}
        </Flex>
    );
};
