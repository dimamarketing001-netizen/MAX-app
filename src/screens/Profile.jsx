import React, { useState, useEffect } from 'react';
import {
    Panel,
    Container,
    Flex,
    Typography,
    Avatar,
    Button,
} from '@maxhub/max-ui';

const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    border: '1px solid var(--max--color-separator)',
    background: 'var(--max--color-background-content)',
    color: 'var(--max--color-text-primary)',
    fontSize: 15,
    boxSizing: 'border-box',
    outline: 'none',
    fontFamily: 'inherit',
};

const labelStyle = {
    fontSize: 12,
    color: 'var(--max--color-text-secondary)',
    marginBottom: 4,
    display: 'block',
};

const sectionStyle = {
    borderRadius: 12,
    padding: '16px',
    backgroundColor: 'var(--max--color-background-content)',
    marginBottom: 12,
};

export const ProfileScreen = ({ user, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [fields, setFields] = useState({
        phone: user.phone || '',
        email: user.email || '',
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setFields({ phone: user.phone || '', email: user.email || '' });
    }, [user]);

    const handleChange = (e) => {
        setFields(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = async () => {
        setSaving(true);
        await onSave(fields);
        setSaving(false);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setFields({ phone: user.phone || '', email: user.email || '' });
        setIsEditing(false);
    };

    return (
        <Panel mode="secondary" style={{ minHeight: '100%', width: '100%' }}>

            {/* Аватар и имя */}
            <Container style={{ padding: '32px 16px 20px' }}>
                <Flex direction="column" align="center" gap={12}>
                    <Avatar.Container size={80} form="squircle">
                        {user.photo_url
                            ? <Avatar.Image src={user.photo_url} />
                            : <Avatar.Text style={{ fontSize: 28 }}>
                                {user.first_name?.[0] || '?'}
                            </Avatar.Text>
                        }
                    </Avatar.Container>
                    <Flex direction="column" align="center" gap={2}>
                        <Typography.Title style={{ margin: 0, fontSize: 20 }}>
                            {user.first_name} {user.last_name || ''}
                        </Typography.Title>
                        <Typography.Text style={{
                            color: 'var(--max--color-text-secondary)',
                            fontSize: 13,
                        }}>
                            ID: {user.id}
                        </Typography.Text>
                    </Flex>
                </Flex>
            </Container>

            {/* Контактные данные */}
            <Container style={{ padding: '0 16px 16px' }}>
                <Typography.Title style={{
                    fontSize: 15,
                    fontWeight: 700,
                    margin: '0 0 10px',
                }}>
                    Контактная информация
                </Typography.Title>

                <div style={sectionStyle}>
                    <Flex direction="column" gap={14}>
                        <div>
                            <span style={labelStyle}>Телефон</span>
                            {isEditing ? (
                                <input
                                    style={inputStyle}
                                    name="phone"
                                    value={fields.phone}
                                    onChange={handleChange}
                                    placeholder="+7 (999) 000-00-00"
                                    type="tel"
                                />
                            ) : (
                                <Typography.Text style={{ fontSize: 15 }}>
                                    {user.phone || '—'}
                                </Typography.Text>
                            )}
                        </div>

                        <div>
                            <span style={labelStyle}>Email</span>
                            {isEditing ? (
                                <input
                                    style={inputStyle}
                                    name="email"
                                    value={fields.email}
                                    onChange={handleChange}
                                    placeholder="example@mail.ru"
                                    type="email"
                                />
                            ) : (
                                <Typography.Text style={{ fontSize: 15 }}>
                                    {user.email || '—'}
                                </Typography.Text>
                            )}
                        </div>
                    </Flex>
                </div>
            </Container>

            {/* Документы (если есть) */}
            {(user.passport_series || user.passport_number) && (
                <Container style={{ padding: '0 16px 16px' }}>
                    <Typography.Title style={{
                        fontSize: 15,
                        fontWeight: 700,
                        margin: '0 0 10px',
                    }}>
                        Документы
                    </Typography.Title>
                    <div style={sectionStyle}>
                        <Flex direction="column" gap={12}>
                            {user.passport_series && (
                                <div>
                                    <span style={labelStyle}>Серия паспорта</span>
                                    <Typography.Text style={{ fontSize: 15 }}>
                                        {user.passport_series}
                                    </Typography.Text>
                                </div>
                            )}
                            {user.passport_number && (
                                <div>
                                    <span style={labelStyle}>Номер паспорта</span>
                                    <Typography.Text style={{ fontSize: 15 }}>
                                        {user.passport_number}
                                    </Typography.Text>
                                </div>
                            )}
                        </Flex>
                    </div>
                </Container>
            )}

            {/* Кнопки */}
            <Container style={{ padding: '0 16px 32px' }}>
                {isEditing ? (
                    <Flex direction="column" gap={8}>
                        <Button
                            size="l"
                            appearance="accent"
                            stretched
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? 'Сохранение...' : 'Сохранить'}
                        </Button>
                        <Button
                            size="l"
                            appearance="neutral"
                            mode="secondary"
                            stretched
                            onClick={handleCancel}
                        >
                            Отмена
                        </Button>
                    </Flex>
                ) : (
                    <Button
                        size="l"
                        appearance="accent"
                        mode="secondary"
                        stretched
                        onClick={() => setIsEditing(true)}
                    >
                        Редактировать
                    </Button>
                )}
            </Container>

        </Panel>
    );
};