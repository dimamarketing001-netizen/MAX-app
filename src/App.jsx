import React, { useState, useEffect } from 'react';
import { Flex, Spinner, Panel, Container, Typography, Button } from '@maxhub/max-ui'; // Добавил Panel, Container, Typography, Button

import { TabBar } from './components/TabBar';
import { HomeScreen } from './screens/Home';
import { ProfileScreen } from './screens/Profile';
import { HelpScreen } from './screens/Help';
import { PartnersScreen } from './screens/Partners';

// --- Моковые (тестовые) данные ---
const MOCK_DEALS = [
    { id: 1, name: 'Дело о банкротстве физ. лица', status: 'В производстве', price: '150 000 руб.', deadline: '30.12.2024' },
    { id: 2, name: 'Составление иска о разделе имущества', status: 'Завершено', price: '25 000 руб.', deadline: '15.08.2024' },
];
const MOCK_PAYMENTS = [
    { id: 1, dealId: 1, amount: '50 000 руб.', date: '10.07.2024', status: 'Оплачен' },
    { id: 2, dealId: 1, amount: '50 000 руб.', date: '10.08.2024', status: 'Ожидает оплаты' },
    { id: 3, dealId: 2, amount: '25 000 руб.', date: '01.08.2024', status: 'Оплачен' },
];
const MOCK_USER_DATA = {
    user: {
        id: 12345,
        first_name: "Тестовый",
        last_name: "Пользователь",
        photo_url: "https://via.placeholder.com/128"
    }
};
const MOCK_PROFILE_DETAILS = {
    phone: '+7 (999) 123-45-67',
    email: 'test-user@example.com',
    passport_series: '1234',
    passport_number: '567890',
};
// ------------------------------------

function App() {
    const [user, setUser] = useState(null);
    const [deals, setDeals] = useState([]);
    const [payments, setPayments] = useState([]);
    const [profileDetails, setProfileDetails] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // Добавил состояние ошибки
    const [activeTab, setActiveTab] = useState('home');

    const webApp = window.WebApp;

    useEffect(() => {
        if (webApp && webApp.ready) {
            webApp.ready();
        }

        const loadAppData = async () => {
            setLoading(true);
            let currentUser = null;

            const initData = webApp ? webApp.initDataUnsafe : MOCK_USER_DATA;

            // Проверяем, что данные пользователя существуют
            if (initData && initData.user) {
                currentUser = initData.user;
            } else {
                setError("Не удалось получить данные пользователя. Пожалуйста, откройте приложение из чат-бота в MAX.");
                setLoading(false);
                return;
            }

            setUser(currentUser); // Устанавливаем пользователя как только он доступен

            try {
                // Имитируем загрузку других данных
                await new Promise(resolve => setTimeout(resolve, 1000));
                setDeals(MOCK_DEALS);
                setPayments(MOCK_PAYMENTS);
                setProfileDetails(MOCK_PROFILE_DETAILS);
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };

        loadAppData();
    }, []);

    const renderScreen = () => {
        // Убедимся, что user и profileDetails не null перед передачей
        if (!user || !profileDetails) {
            return null; // Или можно показать ошибку, если это не должно происходить
        }

        switch (activeTab) {
            case 'home':
                return <HomeScreen user={user} deals={deals} payments={payments} />;
            case 'profile':
                return <ProfileScreen user={user} profileDetails={profileDetails} />;
            case 'help':
                return <HelpScreen />;
            case 'partners':
                return <PartnersScreen />;
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

    // Если загрузка завершена, но есть ошибка или user все еще null
    if (error || !user) {
        return (
            <Panel>
                <Container>
                    <Typography.Title level={2} weight="1">Ошибка</Typography.Title>
                    <Typography.Body>{error || "Не удалось загрузить данные пользователя."}</Typography.Body>
                     <Button onClick={() => webApp && webApp.close()} style={{marginTop: 20}}>Закрыть</Button>
                </Container>
            </Panel>
        );
    }

    return (
        <Flex direction="column" style={{ height: '100vh' }}>
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {renderScreen()}
            </div>
            <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
        </Flex>
    );
}

export default App;
