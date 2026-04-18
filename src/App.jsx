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
    const [activeTab, setActiveTab] = useState('home');
    const [platform, setPlatform] = useState('web');

    const webApp = window.WebApp;

    useEffect(() => {
        if (webApp?.ready) webApp.ready();
        if (webApp?.platform) setPlatform(webApp.platform);

        const loadAppData = async () => {
            setLoading(true);

            // Получаем ID пользователя из MAX WebApp
            const initData = webApp ? webApp.initDataUnsafe : null;
            const maxUserId = initData?.user?.id;

            if (!maxUserId) {
                setError('Не удалось получить данные пользователя. Откройте приложение из MAX.');
                setLoading(false);
                return;
            }

            try {
                // Запрос 1: данные пользователя
                const userRes = await fetch(`/api/user/${maxUserId}`);
                if (!userRes.ok) {
                    const err = await userRes.json();
                    throw new Error(err.error || 'Ошибка загрузки пользователя');
                }
                const userData = await userRes.json();

                // Добавляем photo_url из MAX (Б24 его не хранит)
                userData.photo_url = initData?.user?.photo_url || '';

                setUser(userData);

                // Запрос 2: сделки и платежи
                const dealsRes = await fetch(`/api/deals/${maxUserId}`);
                if (dealsRes.ok) {
                    const dealsData = await dealsRes.json();
                    setDeals(dealsData.deals || []);
                    setPayments(dealsData.payments || []);
                }

            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };

        loadAppData();
    }, []);

    // Функция обновления профиля (передаём в ProfileScreen)
    const handleProfileSave = async (updatedFields) => {
        if (!user) return;
        try {
            const res = await fetch(`/api/user/${user.id}/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedFields),
            });
            if (!res.ok) throw new Error('Ошибка сохранения');
            // Обновляем локальный стейт
            setUser(prev => ({ ...prev, ...updatedFields }));
        } catch (e) {
            console.error(e);
        }
    };

    // Функция отправки тикета (передаём в HelpScreen)
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
            <Panel>
                <Container>
                    <Typography.Title>Ошибка</Typography.Title>
                    <Typography.Body>{error || 'Не удалось загрузить данные.'}</Typography.Body>
                    <Button onClick={() => webApp?.close()} style={{ marginTop: 20 }}>
                        Закрыть
                    </Button>
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