import React, { useState, useEffect } from 'react';
import {
    Panel,
    Container,
    Typography,
    Flex,
    Avatar,
    CellList,
    CellSimple,
    CellInput,
    IconButton,
    Button,
    Grid,
    CellHeader, // Добавлено
    Switch,     // Добавлено
    Counter,    // Добавлено
    ToolButton, // Добавлено
    CellAction, // Добавлено
} from '@maxhub/max-ui';

// --- SVG иконки для ProfileScreen ---
const EditIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z" fill="currentColor"/>
    </svg>
);

const NotificationIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z" fill="currentColor"/>
    </svg>
);

const SearchIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3C5.91 3 3 5.91 3 9.5C3 13.09 5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5C5 7.01 7.01 5 9.5 5C11.99 5 14 7.01 14 9.5C14 11.99 11.99 14 9.5 14Z" fill="currentColor"/>
    </svg>
);

const AudioIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 14C13.66 14 15 12.66 15 11V5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14ZM17 11H16C16 14.1 13.86 16.62 11 16.97V20H13V22H11V20H8V18H16V16H17V11Z" fill="currentColor"/>
    </svg>
);

const MoreIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 8C13.1 8 14 7.1 14 6C14 4.9 13.1 4 12 4C10.9 4 10 4.9 10 6C10 7.1 10.9 8 12 8ZM12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12C14 10.9 13.1 10 12 10ZM12 16C10.9 16 10 16.9 10 18C10 19.1 10.9 20 12 20C13.1 20 14 19.1 14 18C14 16.9 13.1 16 12 16Z" fill="currentColor"/>
    </svg>
);

const AttachmentIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16.5 6V17.5C16.5 19.71 14.71 21.5 12.5 21.5C10.29 21.5 8.5 19.71 8.5 17.5V7H10.5V17.5C10.5 18.6 11.4 19.5 12.5 19.5C13.6 19.5 14.5 18.6 14.5 17.5V6C14.5 4.62 13.38 3.5 12 3.5C10.62 3.5 9.5 4.62 9.5 6V15.5H7.5V6C7.5 3.51 9.51 1.5 12 1.5C14.49 1.5 16.5 3.51 16.5 6Z" fill="currentColor"/>
    </svg>
);

const ExitIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 7L15.59 8.41L18.17 11H8V13H18.17L15.59 15.59L17 17L22 12L17 7ZM4 5H12V3H4C2.9 3 2 3.9 2 5V19C2 20.1 2.9 21 4 21H12V19H4V5Z" fill="currentColor"/>
    </svg>
);

export const ProfileScreen = ({ user, profileDetails }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editableDetails, setEditableDetails] = useState(profileDetails);

    useEffect(() => {
        setEditableDetails(profileDetails);
    }, [profileDetails]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditableDetails(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        console.log('Сохранение данных:', editableDetails);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditableDetails(profileDetails);
        setIsEditing(false);
    };

    return (
        <Panel>
            <Flex direction="column" gap={24}>
                {/* --- Header Section --- */}
                <Container>
                    <Flex direction="column" align="center" gap={16}>
                        <Avatar.Container size={96} rightBottomCorner={<Avatar.OnlineDot />}>
                            <Avatar.Image fallback="ME" src={user.photo_url} />
                        </Avatar.Container>

                        <Flex direction="column" align="center">
                            <Typography.Headline variant="large-strong">{`${user.first_name} ${user.last_name || ''}`}</Typography.Headline>
                            <Typography.Body variant="small" style={{ color: 'var(--max--color-text-secondary)' }}>Личный кабинет</Typography.Body>
                        </Flex>

                        <Grid cols={4} gap={8} style={{ width: '100%' }}>
                            <ToolButton icon={<NotificationIcon />} onClick={() => {}}>Уведомл.</ToolButton>
                            <ToolButton icon={<SearchIcon />} onClick={() => {}}>Поиск</ToolButton>
                            <ToolButton icon={<AudioIcon />} onClick={() => {}}>Аудио</ToolButton>
                            <ToolButton icon={<MoreIcon />} onClick={() => {}}>Еще</ToolButton>
                        </Grid>
                    </Flex>
                </Container>

                {/* --- About Me Section --- */}
                <CellList mode="island" header={<CellHeader>О себе</CellHeader>}>
                    <CellSimple height="compact" title="Frontend engineer 👨‍💻" /> {/* Placeholder for actual data */}
                </CellList>

                {/* --- Contact Info Section --- */}
                <CellList mode="island" header={<CellHeader>Контактная информация</CellHeader>}>
                    {isEditing ? (
                        <>
                            <CellInput before="Телефон" name="phone" value={editableDetails.phone} onChange={handleInputChange} />
                            <CellInput before="Email" name="email" value={editableDetails.email} onChange={handleInputChange} />
                        </>
                    ) : (
                        <>
                            <CellAction height="compact" onClick={() => {}} showChevron title="Телефон">
                                {profileDetails.phone}
                            </CellAction>
                            <CellAction height="compact" onClick={() => {}} showChevron title="Email">
                                {profileDetails.email}
                            </CellAction>
                        </>
                    )}
                </CellList>

                {/* --- Attachments Section --- */}
                <CellList mode="island">
                    <CellSimple
                        showChevron
                        before={<AttachmentIcon />}
                        onClick={() => {}}
                        title="Вложения"
                        after={(
                            <Counter value={1245} rounded />
                        )}
                        subtitle="Фото, видео, файлы и ссылки"
                    />
                </CellList>

                {/* --- Settings Section --- */}
                <CellList mode="island" header={<CellHeader>Настройки</CellHeader>}>
                    {isEditing ? (
                        <>
                            <CellInput before="Статус" name="status" value={editableDetails.status || ''} onChange={handleInputChange} placeholder="Укажите статус" />
                            <CellInput before="Страна" name="country" value={editableDetails.country || ''} onChange={handleInputChange} placeholder="Укажите страну" />
                            <CellInput before="Город" name="city" value={editableDetails.city || ''} onChange={handleInputChange} placeholder="Укажите город" />
                        </>
                    ) : (
                        <>
                            <CellSimple title="Статус">{editableDetails.status || 'Не указан'}</CellSimple>
                            <CellSimple title="Страна">{editableDetails.country || 'Не указана'}</CellSimple>
                            <CellSimple title="Город">{editableDetails.city || 'Не указан'}</CellSimple>
                        </>
                    )}
                    <CellSimple as="label" title="Закрытый профиль" after={<Switch defaultChecked={false} />} />
                </CellList>

                {/* --- Bottom Actions --- */}
                <Container style={{ marginBottom: 16 }}>
                    {isEditing ? (
                        <Grid cols={2} gap={8}>
                            <Button size="large" mode="secondary" appearance="neutral" stretched onClick={handleCancel}>
                                Отмена
                            </Button>
                            <Button size="large" mode="primary" appearance="themed" stretched onClick={handleSave}>
                                Сохранить
                            </Button>
                        </Grid>
                    ) : (
                        <Flex gap={8}>
                            <Button size="large" mode="secondary" appearance="neutral" stretched onClick={() => console.log('Выйти')}>
                                Выйти
                            </Button>
                            <IconButton size="large" mode="secondary" appearance="neutral" onClick={() => console.log('Дополнительное действие')}>
                                <MoreIcon /> {/* Используем иконку "Еще" */}
                            </IconButton>
                        </Flex>
                    )}
                </Container>
            </Flex>
        </Panel>
    );
};
