import React from 'react';
import { Flex, ToolButton } from '@maxhub/max-ui';

// SVG иконки для TabBar
const HomeIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L3 9V20H21V9L12 2ZM19 18H14V12H10V18H5V10L12 4L19 10V18Z" fill="currentColor"/>
    </svg>
);

const ProfileIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4ZM12 14C7.86 14 4 17.14 4 21H20C20 17.14 16.14 14 12 14Z" fill="currentColor"/>
    </svg>
);

const HelpIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 19H11V17H13V19ZM13 15H11V7H13V15Z" fill="currentColor"/>
    </svg>
);

const PartnersIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 11C17.66 11 19 9.66 19 8C19 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11ZM8 11C9.66 11 11 9.66 11 8C11 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11ZM16 13C13.33 13 10 14.34 10 17V19H22V17C22 14.34 18.67 13 16 13ZM8 13C5.33 13 2 14.34 2 17V19H8V17C8 14.34 4.67 13 8 13Z" fill="currentColor"/>
    </svg>
);


const tabs = [
    { id: 'home', title: 'Главная', icon: <HomeIcon /> },
    { id: 'profile', title: 'Профиль', icon: <ProfileIcon /> },
    { id: 'help', title: 'Помощь', icon: <HelpIcon /> },
    { id: 'partners', title: 'Партнерам', icon: <PartnersIcon /> },
];

export const TabBar = ({ activeTab, onTabChange }) => {
    return (
        <Flex
            style={{
                padding: '4px 0 8px',
                backgroundColor: 'var(--max--color-background-content)',
                borderTop: '1px solid var(--max--color-background-tertiary)',
                justifyContent: 'space-around', // Распределяем кнопки равномерно
            }}
        >
            {tabs.map((tab) => (
                <ToolButton
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    icon={tab.icon}
                    appearance={activeTab === tab.id ? 'themed' : 'default'}
                    style={{ flex: 1, minWidth: 0, maxWidth: '25%' }} // flex:1 для равномерного распределения, minWidth:0 для корректного сжатия, maxWidth для предотвращения слишком большого растяжения
                >
                    {tab.title}
                </ToolButton>
            ))}
        </Flex>
    );
};
