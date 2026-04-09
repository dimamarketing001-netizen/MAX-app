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
import { Icon28EditOutline } from '@maxhub/icons';

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
                            <Icon28EditOutline />
                        </IconButton>
                    )}
                </Flex>

                {/* --- Списки с данными --- */}
                <CellList header={<Typography.Headline variant="small-caps">Контактная информация</Typography.Headline>}>
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

                <CellList header={<Typography.Headline variant="small-caps" style={{marginTop: 16}}>Документы (нередактируемые)</Typography.Headline>}>
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
