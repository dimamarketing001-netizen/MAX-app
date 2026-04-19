import React, { useState, useEffect } from 'react';

const BG = '#F2F3F5';
const CARD_BG = '#FFFFFF';
const BORDER = 'rgba(0,0,0,0.08)';

const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    border: `1px solid ${BORDER}`,
    backgroundColor: CARD_BG,
    color: '#1a1a1a',
    fontSize: 15,
    boxSizing: 'border-box',
    outline: 'none',
    fontFamily: 'inherit',
    appearance: 'none',
    WebkitAppearance: 'none',
    transition: 'border-color 0.15s',
};

const labelStyle = {
    fontSize: 12,
    color: '#888',
    marginBottom: 6,
    display: 'block',
};

// ─── Аватар пользователя ──────────────────────────────────────────────────────
const UserAvatar = ({ user, size = 80 }) => {
    const initials = (user.first_name?.[0] || '?').toUpperCase();

    if (user.photo_url) {
        return (
            <img
                src={user.photo_url}
                alt="avatar"
                style={{
                    width: size,
                    height: size,
                    borderRadius: '22%',
                    objectFit: 'cover',
                    flexShrink: 0,
                    display: 'block',
                }}
            />
        );
    }

    return (
        <div style={{
            width: size,
            height: size,
            borderRadius: '22%',
            backgroundColor: '#42A5F5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: '#fff',
            fontSize: size * 0.38,
            fontWeight: 700,
            letterSpacing: 1,
        }}>
            {initials}
        </div>
    );
};

export const ProfileScreen = ({ user, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [fields, setFields] = useState({
        phone: user.phone || '',
        email: user.email || '',
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setFields({
            phone: user.phone || '',
            email: user.email || '',
        });
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
        setFields({
            phone: user.phone || '',
            email: user.email || '',
        });
        setIsEditing(false);
    };

    return (
        <div style={{
            minHeight: '100%',
            width: '100%',
            backgroundColor: BG,
            boxSizing: 'border-box',
        }}>

            {/* ── Аватар и имя ─────────────────────────────────────────────── */}
            <div style={{ padding: '32px 16px 20px' }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 12,
                }}>
                    <UserAvatar user={user} size={80} />

                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                    }}>
                        <span style={{
                            fontSize: 20,
                            fontWeight: 700,
                            color: '#1a1a1a',
                            textAlign: 'center',
                            // Длинное имя не ломает верстку
                            wordBreak: 'break-word',
                            lineHeight: 1.3,
                        }}>
                            {user.first_name} {user.last_name || ''}
                        </span>
                        <span style={{
                            fontSize: 13,
                            color: '#888',
                        }}>
                            ID: {user.id}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Контактная информация ─────────────────────────────────────── */}
            <div style={{ padding: '0 16px 16px' }}>
                <div style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: '#1a1a1a',
                    marginBottom: 10,
                }}>
                    Контактная информация
                </div>

                <div style={{
                    borderRadius: 12,
                    padding: '16px',
                    backgroundColor: CARD_BG,
                    border: `1px solid ${BORDER}`,
                    marginBottom: 12,
                    boxSizing: 'border-box',
                }}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16,
                    }}>

                        {/* Телефон */}
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
                                    // На мобильных показывает цифровую клавиатуру
                                    inputMode="tel"
                                />
                            ) : (
                                <span style={{
                                    fontSize: 15,
                                    color: '#1a1a1a',
                                    display: 'block',
                                    lineHeight: 1.4,
                                }}>
                                    {user.phone || '—'}
                                </span>
                            )}
                        </div>

                        {/* Разделитель */}
                        <div style={{
                            height: 1,
                            backgroundColor: BORDER,
                            margin: '0 -16px',
                        }} />

                        {/* Email */}
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
                                    // На мобильных показывает клавиатуру с @
                                    inputMode="email"
                                    autoCapitalize="none"
                                    autoCorrect="off"
                                />
                            ) : (
                                <span style={{
                                    fontSize: 15,
                                    color: '#1a1a1a',
                                    display: 'block',
                                    lineHeight: 1.4,
                                    // Длинный email не ломает верстку
                                    wordBreak: 'break-all',
                                }}>
                                    {user.email || '—'}
                                </span>
                            )}
                        </div>

                    </div>
                </div>
            </div>

            {/* ── Документы ────────────────────────────────────────────────── */}
            {(user.passport_series || user.passport_number) && (
                <div style={{ padding: '0 16px 16px' }}>
                    <div style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: '#1a1a1a',
                        marginBottom: 10,
                    }}>
                        Документы
                    </div>

                    <div style={{
                        borderRadius: 12,
                        padding: '16px',
                        backgroundColor: CARD_BG,
                        border: `1px solid ${BORDER}`,
                        boxSizing: 'border-box',
                    }}>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12,
                        }}>
                            {user.passport_series && (
                                <div>
                                    <span style={labelStyle}>Серия паспорта</span>
                                    <span style={{
                                        fontSize: 15,
                                        color: '#1a1a1a',
                                        display: 'block',
                                    }}>
                                        {user.passport_series}
                                    </span>
                                </div>
                            )}

                            {/* Разделитель между полями */}
                            {user.passport_series && user.passport_number && (
                                <div style={{
                                    height: 1,
                                    backgroundColor: BORDER,
                                    margin: '0 -16px',
                                }} />
                            )}

                            {user.passport_number && (
                                <div>
                                    <span style={labelStyle}>Номер паспорта</span>
                                    <span style={{
                                        fontSize: 15,
                                        color: '#1a1a1a',
                                        display: 'block',
                                    }}>
                                        {user.passport_number}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Кнопки ───────────────────────────────────────────────────── */}
            <div style={{ padding: '0 16px 32px' }}>
                {isEditing ? (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                    }}>
                        {/* Сохранить */}
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                borderRadius: 12,
                                border: 'none',
                                backgroundColor: saving ? '#B0BEC5' : '#42A5F5',
                                color: '#fff',
                                fontSize: 16,
                                fontWeight: 600,
                                cursor: saving ? 'not-allowed' : 'pointer',
                                fontFamily: 'inherit',
                                boxSizing: 'border-box',
                                touchAction: 'manipulation',
                                WebkitTapHighlightColor: 'transparent',
                                outline: 'none',
                                transition: 'background-color 0.15s',
                                opacity: saving ? 0.7 : 1,
                            }}
                            onMouseEnter={e => {
                                if (!saving) e.currentTarget.style.backgroundColor = '#1E88E5';
                            }}
                            onMouseLeave={e => {
                                if (!saving) e.currentTarget.style.backgroundColor = '#42A5F5';
                            }}
                            onTouchStart={e => {
                                if (!saving) e.currentTarget.style.backgroundColor = '#1E88E5';
                            }}
                            onTouchEnd={e => {
                                if (!saving) e.currentTarget.style.backgroundColor = '#42A5F5';
                            }}
                        >
                            {saving ? 'Сохранение...' : 'Сохранить'}
                        </button>

                        {/* Отмена */}
                        <button
                            onClick={handleCancel}
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                borderRadius: 12,
                                border: `1px solid ${BORDER}`,
                                backgroundColor: CARD_BG,
                                color: '#1a1a1a',
                                fontSize: 16,
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                boxSizing: 'border-box',
                                touchAction: 'manipulation',
                                WebkitTapHighlightColor: 'transparent',
                                outline: 'none',
                                transition: 'background-color 0.15s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F2F3F5'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = CARD_BG}
                            onTouchStart={e => e.currentTarget.style.backgroundColor = '#F2F3F5'}
                            onTouchEnd={e => e.currentTarget.style.backgroundColor = CARD_BG}
                        >
                            Отмена
                        </button>
                    </div>
                ) : (
                    /* Редактировать */
                    <button
                        onClick={() => setIsEditing(true)}
                        style={{
                            width: '100%',
                            padding: '14px 16px',
                            borderRadius: 12,
                            border: `1px solid #42A5F5`,
                            backgroundColor: 'transparent',
                            color: '#42A5F5',
                            fontSize: 16,
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            boxSizing: 'border-box',
                            touchAction: 'manipulation',
                            WebkitTapHighlightColor: 'transparent',
                            outline: 'none',
                            transition: 'background-color 0.15s, color 0.15s',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = '#42A5F5';
                            e.currentTarget.style.color = '#fff';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#42A5F5';
                        }}
                        onTouchStart={e => {
                            e.currentTarget.style.backgroundColor = '#42A5F5';
                            e.currentTarget.style.color = '#fff';
                        }}
                        onTouchEnd={e => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#42A5F5';
                        }}
                    >
                        Редактировать
                    </button>
                )}
            </div>

        </div>
    );
};