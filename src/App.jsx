import React, { useState, useEffect } from 'react';
import { Flex, Spinner } from '@maxhub/max-ui';

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
// Новые моковые данные для профиля
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
    const [profileDetails, setProfileDetails] = useState({}); // Новое состояние для деталей профиля
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('home');

    const webApp = window.WebApp;

    useEffect(() => {
        if (webApp && webApp.ready) {
            webApp.ready();
        }

        const initData = webApp ? webApp.initDataUnsafe : MOCK_USER_DATA;
        setUser(initData.user);

        const fetchAllData = async () => {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setDeals(MOCK_DEALS);
            setPayments(MOCK_PAYMENTS);
            setProfileDetails(MOCK_PROFILE_DETAILS); // Загружаем детали профиля
            setLoading(false);
        };

        fetchAllData();
    }, []);

    const renderScreen = () => {
        switch (activeTab) {
            case 'home':
                return <HomeScreen user={user} deals={deals} payments={payments} />;
            case 'profile':
                // Передаем данные в экран Профиля
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
