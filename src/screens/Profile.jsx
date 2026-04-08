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
} from '@maxhub/max-ui';

// Временная заглушка для иконки редактирования
const IconEditPlaceholder = () => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5.83331 20.4167H7.58331L17.5 10.5L15.75 8.75002L5.83331 18.6667V20.4167ZM21.5416 8.75002L19.5 6.70835L21.5416 4.66669L23.5833 6.70835L21.5416 8.75002ZM17.5 6.70835L4.66665 19.5417V23.3334H8.45831L21.2916 10.5L17.5 6.70835Z" fill="var(--max--color-icon-accent)"/>
    </svg>
);

export const ProfileScreen = ({ user, profileDetails }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editableDetails, setEditableDetails] = useState(profileDetails);

    // Синхронизируем состояние, если исходные данные изменятся
    useEffect(() => {
        setEditableDetails(profileDetails);
    }, [profileDetails]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditableDetails(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        console.log('Сохранение данных:', editableDetails);
        // Здесь в будущем будет отправка данных на бэкенд
        // После успешной отправки нужно будет обновить profileDetails в App.jsx
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditableDetails(profileDetails); // Возвращаем исходные значения
        setIsEditing(false);
    };

    return (
        <Panel>
            <Container>
                {/* --- Шапка --- */}
                <Flex align="center" justify="between" style={{ marginBottom: 24 }}>
                    <Flex align="center" gap={16}>
                        <Avatar.Container size={64} form="squircle">
                            <Avatar.Image src={user.photo_url} />
                        </Avatar.Container>
                        <Typography.Title level={2} weight="1">{`${user.first_name} ${user.last_name || ''}`}</Typography.Title>
                    </Flex>
                    {!isEditing && (
                        <IconButton aria-label="Редактировать" onClick={() => setIsEditing(true)}>
                            <IconEditPlaceholder />
                        </IconButton>
                    )}
                </Flex>

                {/* --- Списки с данными --- */}
                <CellList header={<Typography.Body weight="3">Контактная информация</Typography.Body>}>
                    {isEditing ? (
                        <>
                            <CellInput before="Телефон" name="phone" value={editableDetails.phone} onChange={handleInputChange} />
                            <CellInput before="Email" name="email" value={editableDetails.email} onChange={handleInputChange} />
                        </>
                    ) : (
                        <>
                            <CellSimple title="Телефон">{profileDetails.phone}</CellSimple>
                            <CellSimple title="Email">{profileDetails.email}</CellSimple>
                        </>
                    )}
                </CellList>

                <CellList header={<Typography.Body weight="3" style={{marginTop: 16}}>Документы (нередактируемые)</Typography.Body>}>
                    <CellSimple title="Серия паспорта">{profileDetails.passport_series}</CellSimple>
                    <CellSimple title="Номер паспорта">{profileDetails.passport_number}</CellSimple>
                </CellList>

                {/* --- Кнопки в режиме редактирования --- */}
                {isEditing && (
                    <Grid cols={2} gap={8} style={{ marginTop: 24 }}>
                        <Button size="large" mode="secondary" appearance="neutral" stretched onClick={handleCancel}>
                            Отмена
                        </Button>
                        <Button size="large" mode="primary" appearance="themed" stretched onClick={handleSave}>
                            Сохранить
                        </Button>
                    </Grid>
                )}
            </Container>
        </Panel>
    );
};
