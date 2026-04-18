import React, { useState, useEffect } from 'react';
import { Flex, Spinner, Panel, Container, Typography, Button, MaxUI } from '@maxhub/max-ui';

import { TabBar } from './components/TabBar';
import { HomeScreen } from './screens/Home';
import { ProfileScreen } from './screens/Profile';
import { HelpScreen } from './screens/Help';
import { PartnersScreen } from './screens/Partners';

function App() {
    const [user, setUser] = useState(null);
    const [deals, setDeals] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [debugInfo, setDebugInfo] = useState(''); // для отладки на экране
    const [activeTab, setActiveTab] = useState('home');
    const [platform, setPlatform] = useState('web');

    useEffect(() => {
        const loadAppData = async () => {
            setLoading(true);

            // ── Шаг 1: Смотрим что есть в window ──────────────────────────
            const debugLines = [];
            debugLines.push(`window.WebApp: ${typeof window.WebApp}`);
            debugLines.push(`window.Telegram: ${typeof window.Telegram}`);

            const webApp = window.WebApp;

            if (webApp) {
                debugLines.push(`webApp keys: ${Object.keys(webApp).join(', ')}`);
                debugLines.push(`webApp.platform: ${webApp.platform}`);
                debugLines.push(`webApp.version: ${webApp.version}`);
                debugLines.push(`webApp.initData (raw): ${webApp.initData}`);
                debugLines.push(`webApp.initDataUnsafe: ${JSON.stringify(webApp.initDataUnsafe)}`);

                if (webApp.platform) setPlatform(webApp.platform);
                if (webApp.ready) webApp.ready();
            } else {
                debugLines.push('WebApp НЕ найден в window!');
                debugLines.push(`Все ключи window: ${Object.keys(window).filter(k => k.toLowerCase().includes('web') || k.toLowerCase().includes('tg') || k.toLowerCase().includes('max') || k.toLowerCase().includes('telegram')).join(', ')}`);
            }

            // ── Шаг 2: Отправляем debug на сервер ─────────────────────────
            const debugText = debugLines.join('\n');
            setDebugInfo(debugText);

            try {
                await fetch('/api/debug', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        debugLines,
                        userAgent: navigator.userAgent,
                        href: window.location.href,
                        webAppExists: !!webApp,
                        initDataRaw: webApp?.initData || null,
                        initDataUnsafe: webApp?.initDataUnsafe || null,
                    }),
                });
            } catch (e) {
                console.error('Debug отправка не удалась:', e);
            }

            // ── Шаг 3: Пробуем получить userId ────────────────────────────
            let maxUserId = null;

            try {
                maxUserId = webApp?.initDataUnsafe?.user?.id || null;
            } catch (e) {
                debugLines.push(`Ошибка чтения initDataUnsafe: ${e.message}`);
            }

            if (!maxUserId) {
                setError(`Не удалось получить ID пользователя.\n\nDebug:\n${debugText}`);
                setLoading(false);
                return;
            }

            // ── Шаг 4: Запросы к API ───────────────────────────────────────
            try {
                const userRes = await fetch(`/api/user/${maxUserId}`);

                if (!userRes.ok) {
                    const err = await userRes.json();
                    throw new Error(err.error || `HTTP ${userRes.status}`);
                }

                const userData = await userRes.json();
                userData.photo_url = webApp?.initDataUnsafe?.user?.photo_url || '';
                setUser(userData);

                const dealsRes = await fetch(`/api/deals/${maxUserId}`);
                if (dealsRes.ok) {
                    const dealsData = await dealsRes.json();
                    setDeals(dealsData.deals || []);
                    setPayments(dealsData.payments || []);
                }

            } catch (e) {
                setError(`Ошибка API: ${e.message}`);
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
            console.error(e);
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

    if (loading) {
        return (
            <Flex style={{ height: '100vh' }} justify="center" align="center">
                <Spinner size={44} />
            </Flex>
        );
    }

    if (error || !user) {
        return (
            <Panel mode="secondary">
                <Container>
                    <Flex direction="column" gap={16} style={{ padding: 16 }}>
                        <Typography.Title>Ошибка запуска</Typography.Title>
                        {/* Показываем debug прямо на экране */}
                        <div style={{
                            background: '#1a1a1a',
                            color: '#00ff00',
                            padding: 12,
                            borderRadius: 8,
                            fontSize: 11,
                            fontFamily: 'monospace',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-all',
                            maxHeight: '70vh',
                            overflowY: 'auto',
                        }}>
                            {error || 'Нет данных пользователя'}
                        </div>
                    </Flex>
                </Container>
            </Panel>
        );
    }

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