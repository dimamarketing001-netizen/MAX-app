import React, { useState, useEffect } from 'react';
import {
    Panel, Container, Typography, Flex, Avatar,
    CellList, CellSimple, CellInput, Button,
    Grid, CellHeader, Switch, CellAction, ToolButton
} from '@maxhub/max-ui';
import styles from './Profile.module.css';

export const ProfileScreen = ({ user, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editableDetails, setEditableDetails] = useState({
        phone: user.phone || '',
        email: user.email || '',
    });

    useEffect(() => {
        setEditableDetails({ phone: user.phone || '', email: user.email || '' });
    }, [user]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditableDetails(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        await onSave(editableDetails);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditableDetails({ phone: user.phone || '', email: user.email || '' });
        setIsEditing(false);
    };

    return (
        <Panel mode="secondary" className={styles.page}>
            <Flex direction="column" gap={24}>
                <Container className={styles.header}>
                    <Flex direction="column" align="center" gap={16}>
                        <Avatar.Container size={96}>
                            <Avatar.Image src={user.photo_url} />
                        </Avatar.Container>
                        <Flex direction="column" align="center" className={styles.details}>
                            <Typography.Headline variant="large-strong">
                                {`${user.first_name} ${user.last_name || ''}`}
                            </Typography.Headline>
                        </Flex>
                        {!isEditing && (
                            <Grid cols={1} gap={8} className={styles.actions}>
                                <ToolButton onClick={() => setIsEditing(true)}>
                                    Редактировать
                                </ToolButton>
                            </Grid>
                        )}
                    </Flex>
                </Container>

                <Flex direction="column" gap={16} className={styles.body}>
                    <CellList mode="island" header={<CellHeader>Контактная информация</CellHeader>}>
                        {isEditing ? (
                            <>
                                <CellInput
                                    placeholder="Телефон"
                                    name="phone"
                                    defaultValue={editableDetails.phone}
                                    onChange={handleInputChange}
                                />
                                <CellInput
                                    placeholder="Email"
                                    name="email"
                                    defaultValue={editableDetails.email}
                                    onChange={handleInputChange}
                                />
                            </>
                        ) : (
                            <>
                                <CellAction subtitle="Телефон">{user.phone || '—'}</CellAction>
                                <CellAction subtitle="Email">{user.email || '—'}</CellAction>
                            </>
                        )}
                    </CellList>

                    {/* Паспортные данные из Б24 (если заполнены) */}
                    {(user.passport_series || user.passport_number) && (
                        <CellList mode="island" header={<CellHeader>Документы</CellHeader>}>
                            {user.passport_series && (
                                <CellSimple subtitle="Серия паспорта">
                                    {user.passport_series}
                                </CellSimple>
                            )}
                            {user.passport_number && (
                                <CellSimple subtitle="Номер паспорта">
                                    {user.passport_number}
                                </CellSimple>
                            )}
                        </CellList>
                    )}

                    <CellList mode="island" header={<CellHeader>Настройки</CellHeader>}>
                        <CellSimple as="label" title="Push-уведомления" after={<Switch defaultChecked />} />
                    </CellList>
                </Flex>

                {isEditing && (
                    <Container className={styles.actions}>
                        <Flex gap={8} justify="center">
                            <Button size="large" mode="secondary" appearance="neutral" stretched onClick={handleCancel}>
                                Отмена
                            </Button>
                            <Button size="large" mode="primary" appearance="themed" stretched onClick={handleSave}>
                                Сохранить
                            </Button>
                        </Flex>
                    </Container>
                )}
            </Flex>
        </Panel>
    );
};