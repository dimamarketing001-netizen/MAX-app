import React, { useState, useEffect } from 'react';
import { Panel, Container, Flex, Avatar, Button } from '@maxhub/max-ui';

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
    marginBottom: 6,
    display: 'block',
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

            {/* Аватар */}
            <Container style={{ padding: '32px 16px 20px' }}>
                <Flex direction="column" align="center" gap={12}>
                    <Avatar.Container size={80} form="squircle">
                        {user.photo_url
                            ? <Avatar.Image src={user.photo_url} />
                            : <Avatar.Text>{user.first_name?.[0] || '?'}</Avatar.Text>
                        }
                    </Avatar.Container>
                    <Flex direction="column" align="center" gap={4}>
                        <span style={{
                            fontSize: 20,
                            fontWeight: 700,
                            color: 'var(--max--color-text-primary)',
                        }}>
                            {user.first_name} {user.last_name || ''}
                        </span>
                        <span style={{
                            fontSize: 13,
                            color: 'var(--max--color-text-secondary)',
                        }}>
                            ID: {user.id}
                        </span>
                    </Flex>
                </Flex>
            </Container>

            {/* Контакты */}
            <Container style={{ padding: '0 16px 16px' }}>
                <div style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: 'var(--max--color-text-primary)',
                    marginBottom: 10,
                }}>
                    Контактная информация
                </div>

                <div style={{
                    borderRadius: 12,
                    padding: '16px',
                    backgroundColor: 'var(--max--color-background-content)',
                    marginBottom: 12,
                }}>
                    <Flex direction="column" gap={16}>
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
                                <span style={{ fontSize: 15, color: 'var(--max--color-text-primary)' }}>
                                    {user.phone || '—'}
                                </span>
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
                                <span style={{ fontSize: 15, color: 'var(--max--color-text-primary)' }}>
                                    {user.email || '—'}
                                </span>
                            )}
                        </div>
                    </Flex>
                </div>
            </Container>

            {/* Документы */}
            {(user.passport_series || user.passport_number) && (
                <Container style={{ padding: '0 16px 16px' }}>
                    <div style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: 'var(--max--color-text-primary)',
                        marginBottom: 10,
                    }}>
                        Документы
                    </div>
                    <div style={{
                        borderRadius: 12,
                        padding: '16px',
                        backgroundColor: 'var(--max--color-background-content)',
                    }}>
                        <Flex direction="column" gap={12}>
                            {user.passport_series && (
                                <div>
                                    <span style={labelStyle}>Серия паспорта</span>
                                    <span style={{ fontSize: 15 }}>{user.passport_series}</span>
                                </div>
                            )}
                            {user.passport_number && (
                                <div>
                                    <span style={labelStyle}>Номер паспорта</span>
                                    <span style={{ fontSize: 15 }}>{user.passport_number}</span>
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
                        <Button size="l" appearance="accent" stretched onClick={handleSave} disabled={saving}>
                            {saving ? 'Сохранение...' : 'Сохранить'}
                        </Button>
                        <Button size="l" appearance="neutral" mode="secondary" stretched onClick={handleCancel}>
                            Отмена
                        </Button>
                    </Flex>
                ) : (
                    <Button size="l" appearance="accent" mode="secondary" stretched onClick={() => setIsEditing(true)}>
                        Редактировать
                    </Button>
                )}
            </Container>

        </Panel>
    );
};