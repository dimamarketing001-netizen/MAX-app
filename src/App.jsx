import React, { useState, useEffect } from 'react';
import { Flex, Spinner, Panel, Container, Typography, Button, MaxUI } from '@maxhub/max-ui';

import { TabBar } from './components/TabBar';
import { HomeScreen } from './screens/Home';
import { ProfileScreen } from './screens/Profile';
import { HelpScreen } from './screens/Help';
import { PartnersScreen } from './screens/Partners';

// ─── Безопасное получение WebApp ─────────────────────────────────────────────
function getWebApp() {
    try {
        return window.WebApp || null;
    } catch (e) {
        return null;
    }
}

// ─── Безопасное получение initDataUnsafe ─────────────────────────────────────
function getInitDataUnsafe(webApp) {
    try {
        return webApp?.initDataUnsafe || null;
    } catch (e) {
        return null;
    }
}

// ─── Безопасное получение поля из объекта ────────────────────────────────────
function safeGet(obj, path, fallback = null) {
    try {
        return path.split('.').reduce((acc, key) => acc?.[key], obj) ?? fallback;
    } catch (e) {
        return fallback;
    }
}

function App() {
    const [user, setUser] = useState(null);
    const [deals, setDeals] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('home');
    const [platform, setPlatform] = useState('web');

    useEffect(() => {
        const loadAppData = async () => {
            setLoading(true);

            // ── Шаг 1: Получаем WebApp безопасно ──────────────────────────
            const webApp = getWebApp();
            const initDataUnsafe = getInitDataUnsafe(webApp);

            // Логируем на сервер
            const logData = {
                ts: new Date().toISOString(),
                userAgent: navigator.userAgent,
                href: window.location.href,
                webAppType: typeof window.WebApp,
                hasWebApp: !!webApp,
                platform: safeGet(webApp, 'platform'),
                version: safeGet(webApp, 'version'),
                initDataRaw: (() => {
                    try { return webApp?.initData || null; } catch { return 'ERROR_READING'; }
                })(),
                initDataUnsafe: initDataUnsafe,
                userId: safeGet(initDataUnsafe, 'user.id'),
            };

            // Отправляем лог на сервер (не ждём)
            fetch('/api/debug', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(logData),
            }).catch(() => {});

            // ── Шаг 2: Вызываем ready() только если метод существует ──────
            try {
                if (webApp && typeof webApp.ready === 'function') {
                    webApp.ready();
                }
            } catch (e) {
                console.warn('webApp.ready() failed:', e);
            }

            // ── Шаг 3: Получаем платформу ─────────────────────────────────
            try {
                const p = webApp?.platform;
                if (p && typeof p === 'string') {
                    setPlatform(p);
                }
            } catch (e) {
                console.warn('platform read failed:', e);
            }

            // ── Шаг 4: Получаем userId ─────────────────────────────────────
            const maxUserId = safeGet(initDataUnsafe, 'user.id');

            if (!maxUserId) {
                setError(
                    `ID пользователя не получен.\n\n` +
                    `WebApp: ${logData.hasWebApp}\n` +
                    `initDataUnsafe: ${JSON.stringify(initDataUnsafe)}\n` +
                    `initData: ${logData.initDataRaw}\n` +
                    `UserAgent: ${navigator.userAgent}`
                );
                setLoading(false);
                return;
            }

            // ── Шаг 5: Запросы к API ───────────────────────────────────────
            try {
                const userRes = await fetch(`/api/user/${maxUserId}`);

                if (!userRes.ok) {
                    const err = await userRes.json().catch(() => ({}));
                    throw new Error(err.error || `HTTP ${userRes.status}`);
                }

                const userData = await userRes.json();

                // Добавляем фото из MAX (в Б24 не хранится)
                userData.photo_url = safeGet(initDataUnsafe, 'user.photo_url') || '';

                setUser(userData);

                // Сделки и платежи
                const dealsRes = await fetch(`/api/deals/${maxUserId}`);
                if (dealsRes.ok) {
                    const dealsData = await dealsRes.json();
                    setDeals(dealsData.deals || []);
                    setPayments(dealsData.payments || []);
                }

            } catch (e) {
                setError(`Ошибка загрузки данных: ${e.message}`);
            } finally {
                setLoading(false);
            }
        };

        loadAppData();
    }, []);

    const handleProfileSave = async (updatedFields) => {
        if (!user) return;
        try {
            const res = await fetch(`/api/user/${user.id}/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedFields),
            });
            if (!res.ok) throw new Error('Ошибка сохранения');
            setUser(prev => ({ ...prev, ...updatedFields }));
        } catch (e) {
            console.error('handleProfileSave:', e);
        }
    };

    const handleSupportTicket = async (topic, message) => {
        if (!user) return false;
        try {
            const res = await fetch('/api/support', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ maxUserId: user.id, topic, message }),
            });
            return res.ok;
        } catch {
            return false;
        }
    };

    const renderScreen = () => {
        if (!user) return null;
        switch (activeTab) {
            case 'home':
                return <HomeScreen user={user} deals={deals} payments={payments} />;
            case 'profile':
                return <ProfileScreen user={user} onSave={handleProfileSave} />;
            case 'help':
                return <HelpScreen onSendTicket={handleSupportTicket} />;
            case 'partners':
                return <PartnersScreen userId={user.id} />;
            default:
                return <HomeScreen user={user} deals={deals} payments={payments} />;
        }
    };

    // ── Экран загрузки ─────────────────────────────────────────────────────────
    if (loading) {
        return (
            <Flex style={{ height: '100vh' }} justify="center" align="center">
                <Spinner size={44} />
            </Flex>
        );
    }

    // ── Экран ошибки с debug-инфо ──────────────────────────────────────────────
    if (error || !user) {
        return (
            <Panel mode="secondary">
                <Container>
                    <Flex direction="column" gap={16} style={{ padding: 16 }}>
                        <Typography.Title>Ошибка запуска</Typography.Title>
                        <div style={{
                            background: '#0d0d0d',
                            color: '#00ff41',
                            padding: 12,
                            borderRadius: 8,
                            fontSize: 10,
                            fontFamily: 'monospace',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-all',
                            maxHeight: '75vh',
                            overflowY: 'auto',
                            border: '1px solid #00ff41',
                        }}>
                            {error || 'Нет данных пользователя'}
                        </div>
                    </Flex>
                </Container>
            </Panel>
        );
    }

    // ── Основной экран ─────────────────────────────────────────────────────────
    return (
        <MaxUI platform={platform}>
            <Flex direction="column" style={{ height: '100vh' }}>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {renderScreen()}
                </div>
                <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
            </Flex>
        </MaxUI>
    );
}

export default App;