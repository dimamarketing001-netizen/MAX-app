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
    CellHeader,
    Switch,
    CellAction,
    ToolButton,
    Icon28Placeholder,
    Icon24Placeholder
} from '@maxhub/max-ui';

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
        <Panel mode="secondary">
            <Flex direction="column" gap={24}>
                <Container>
                    <Flex direction="column" align="center" gap={16}>
                        <Avatar.Container size={96}>
                            <Avatar.Image src={user.photo_url} />
                        </Avatar.Container>

                        <Flex direction="column" align="center">
                            <Typography.Headline variant="large-strong">{`${user.first_name} ${user.last_name || ''}`}</Typography.Headline>
                        </Flex>

                        {!isEditing && (
                            <Grid cols={1} gap={8}>
                                <ToolButton icon={<Icon24Placeholder />} onClick={() => setIsEditing(true)}>
                                    Редактировать
                                </ToolButton>
                            </Grid>
                        )}
                    </Flex>
                </Container>

                <Flex direction="column" gap={16}>
                    <CellList mode="island" header={<CellHeader>Контактная информация</CellHeader>}>
                        {isEditing ? (
                            <>
                                <CellInput before={<Icon28Placeholder />} placeholder="Телефон" name="phone" defaultValue={editableDetails.phone} onChange={handleInputChange} />
                                <CellInput before={<Icon28Placeholder />} placeholder="Email" name="email" defaultValue={editableDetails.email} onChange={handleInputChange} />
                            </>
                        ) : (
                            <>
                                <CellAction before={<Icon28Placeholder />} subtitle="Телефон">{profileDetails.phone}</CellAction>
                                <CellAction before={<Icon28Placeholder />} subtitle="Email">{profileDetails.email}</CellAction>
                            </>
                        )}
                    </CellList>

                    <CellList mode="island" header={<CellHeader>Документы</CellHeader>}>
                        <CellSimple before={<Icon28Placeholder />} subtitle="Серия паспорта">{profileDetails.passport_series}</CellSimple>
                        <CellSimple before={<Icon28Placeholder />} subtitle="Номер паспорта">{profileDetails.passport_number}</CellSimple>
                    </CellList>

                    <CellList mode="island" header={<CellHeader>Настройки</CellHeader>}>
                        <CellAction before={<Icon28Placeholder />} showChevron title="Изменить пароль" />
                        <CellSimple as="label" before={<Icon28Placeholder />} title="Push-уведомления" after={<Switch defaultChecked />} />
                    </CellList>
                </Flex>

                {isEditing && (
                    <Container>
                        <Flex gap={8} justify="center">
                            <Button size="large" mode="secondary" appearance="neutral" stretched onClick={handleCancel} before={<Icon24Placeholder />}>
                                Отмена
                            </Button>
                            <Button size="large" mode="primary" appearance="themed" stretched onClick={handleSave} before={<Icon24Placeholder />}>
                                Сохранить
                            </Button>
                        </Flex>
                    </Container>
                )}

                <Container>
                    <Flex gap={8} justify="center">
                        <Button size="large" mode="secondary" appearance="negative" stretched before={<Icon24Placeholder />}>
                            Выйти
                        </Button>
                    </Flex>
                </Container>
            </Flex>
        </Panel>
    );
};
