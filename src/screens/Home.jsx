import React, { useState, useEffect } from 'react';
import { Flex, Spinner, Panel, Container, Typography, Button, MaxUI } from '@maxhub/max-ui';

import { HomeScreen } from './screens/Home';
import { ProfileScreen } from './screens/Profile';
import { HelpScreen } from './screens/Help';
import { PartnersScreen } from './screens/Partners';

// ─── Ждём пока MAX Bridge инициализирует WebApp ───────────────────────────────
async function waitForWebApp(timeout = 5000) {
    return new Promise((resolve) => {
        if (window.WebApp?.initDataUnsafe?.user?.id) {
            return resolve(window.WebApp);
        }
        const start = Date.now();
        const interval = setInterval(() => {
            if (window.WebApp?.initDataUnsafe?.user?.id) {
                clearInterval(interval);
                resolve(window.WebApp);
            } else if (Date.now() - start > timeout) {
                clearInterval(interval);
                resolve(null);
            }
        }, 50);
    });
}

function safeGet(obj, path, fallback = null) {
    try {
        return path.split('.').reduce((acc, key) => acc?.[key], obj) ?? fallback;
    } catch {
        return fallback;
    }
}

function App() {
    const [user, setUser] = useState(null);
    const [deals, setDeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('home');
    const [platform, setPlatform] = useState('web');
    const [theme, setTheme] = useState('light');

    useEffect(() => {
        const loadAppData = async () => {
            setLoading(true);

            // ── Шаг 1: Ждём WebApp от MAX Bridge ──────────────────────────
            const webApp = await waitForWebApp(5000);
            const initDataUnsafe = webApp?.initDataUnsafe || null;

            // ── Шаг 2: Определяем тему ─────────────────────────────────────
            const colorScheme = webApp?.colorScheme ||
                (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
            setTheme(colorScheme);

            // ── Шаг 3: Логируем на сервер ──────────────────────────────────
            const logData = {
                ts: new Date().toISOString(),
                userAgent: navigator.userAgent,
                href: window.location.href,
                hasWebApp: !!webApp,
                platform: safeGet(webApp, 'platform'),
                version: safeGet(webApp, 'version'),
                colorScheme,
                initDataRaw: (() => {
                    try { return webApp?.initData || null; } catch { return 'ERROR'; }
                })(),
                initDataUnsafe,
                userId: safeGet(initDataUnsafe, 'user.id'),
            };

            fetch('/api/debug', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(logData),
            }).catch(() => {});

            // ── Шаг 4: ready() и platform ─────────────────────────────────
            try {
                if (webApp && typeof webApp.ready === 'function') webApp.ready();
            } catch (e) {
                console.warn('webApp.ready() error:', e);
            }

            try {
                const p = webApp?.platform;
                if (p && typeof p === 'string') setPlatform(p);
            } catch (e) {
                console.warn('platform error:', e);
            }

            // ── Шаг 5: Получаем userId ─────────────────────────────────────
            const maxUserId = safeGet(initDataUnsafe, 'user.id');

            if (!maxUserId) {
                setError(
                    `ID пользователя не получен за 5 секунд.\n\n` +
                    `WebApp: ${logData.hasWebApp}\n` +
                    `initData: ${logData.initDataRaw}\n` +
                    `initDataUnsafe: ${JSON.stringify(initDataUnsafe)}\n` +
                    `URL: ${window.location.href}\n` +
                    `UA: ${navigator.userAgent}`
                );
                setLoading(false);
                return;
            }

            // ── Шаг 6: Запрос данных пользователя ─────────────────────────
            try {
                const userRes = await fetch(`/api/user/${maxUserId}`);
                const contentType = userRes.headers.get('content-type') || '';
                const responseText = await userRes.text();

                // Логируем ответ API
                fetch('/api/debug', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ts: new Date().toISOString(),
                        type: 'api_response',
                        url: `/api/user/${maxUserId}`,
                        status: userRes.status,
                        contentType,
                        responsePreview: responseText.substring(0, 500),
                    }),
                }).catch(() => {});

                if (!userRes.ok) {
                    throw new Error(
                        `HTTP ${userRes.status}\n` +
                        `Content-Type: ${contentType}\n` +
                        `Ответ: ${responseText.substring(0, 300)}`
                    );
                }

                let userData;
                try {
                    userData = JSON.parse(responseText);
                } catch {
                    throw new Error(`Ответ не JSON:\n${responseText.substring(0, 200)}`);
                }

                // Добавляем фото из MAX
                userData.photo_url = safeGet(initDataUnsafe, 'user.photo_url') || '';
                setUser(userData);

                // ── Шаг 7: Запрос сделок (расширенные данные) ─────────────
                try {
                    const dealsRes = await fetch(`/api/deals-full/${maxUserId}`);
                    if (dealsRes.ok) {
                        const dealsData = await dealsRes.json();
                        setDeals(dealsData.deals || []);
                    } else {
                        console.warn('Сделки не загружены:', dealsRes.status);
                    }
                } catch (dealsErr) {
                    console.warn('Ошибка загрузки сделок:', dealsErr.message);
                }

            } catch (e) {
                setError(`Ошибка загрузки данных:\n${e.message}`);
            } finally {
                setLoading(false);
            }
        };

        loadAppData();
    }, []);

    // ── Обработчики ────────────────────────────────────────────────────────────

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
                body: JSON.stringify({
                    maxUserId: user.id,
                    topic,
                    message,
                }),
            });
            return res.ok;
        } catch {
            return false;
        }
    };

    const handleContactLawyer = () => {
        try {
            const webApp = window.WebApp;
            if (webApp?.openMaxLink) {
                webApp.openMaxLink('https://max.ru/id6658577091_bot');
            }
        } catch (e) {
            console.warn('openMaxLink error:', e);
        }
    };

    // ── Рендер экранов ─────────────────────────────────────────────────────────

    const renderScreen = () => {
        if (!user) return null;
        switch (activeTab) {
            case 'home':
                return (
                    <HomeScreen
                        user={user}
                        deals={deals}
                        onContactLawyer={handleContactLawyer}
                    />
                );
            case 'profile':
                return (
                    <ProfileScreen
                        user={user}
                        onSave={handleProfileSave}
                    />
                );
            case 'help':
                return (
                    <HelpScreen
                        onSendTicket={handleSupportTicket}
                    />
                );
            case 'partners':
                return (
                    <PartnersScreen
                        userId={user.id}
                    />
                );
            default:
                return (
                    <HomeScreen
                        user={user}
                        deals={deals}
                        onContactLawyer={handleContactLawyer}
                    />
                );
        }
    };

    // ── Экран загрузки ─────────────────────────────────────────────────────────
    if (loading) {
        return (
            <Flex
                style={{ height: '100dvh' }}
                justify="center"
                align="center"
            >
                <Spinner size={44} />
            </Flex>
        );
    }

    // ── Экран ошибки ───────────────────────────────────────────────────────────
    if (error || !user) {
        return (
            <Panel mode="secondary">
                <Container>
                    <Flex direction="column" gap={16} style={{ padding: 16 }}>
                        <span style={{
                            fontSize: 18,
                            fontWeight: 700,
                            color: 'var(--max--color-text-primary)',
                        }}>
                            Ошибка запуска
                        </span>
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
                            border: '1px solid #333',
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
        <MaxUI platform={platform} appearance={theme}>
            <Flex
                direction="column"
                style={{
                    height: '100dvh',
                    width: '100%',
                    overflow: 'hidden',
                }}
            >
                <div style={{ flex: 1, overflowY: 'auto', width: '100%' }}>
                    {renderScreen()}
                </div>
                <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
            </Flex>
        </MaxUI>
    );
}

export default App;