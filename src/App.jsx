import React, { useState, useEffect } from 'react';
import { Flex, MaxUI } from '@maxhub/max-ui';

import { TabBar } from './components/TabBar';
import { HomeScreen } from './screens/Home';
import { ProfileScreen } from './screens/Profile';
import { HelpScreen } from './screens/Help';
import { PartnersScreen } from './screens/Partners';

function App() {
    const [user, setUser] = useState(null);
    const [deals, setDeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('home');

    useEffect(() => {
        const load = async () => {
            try {
                const webApp = window.WebApp;
                const maxUserId = webApp?.initDataUnsafe?.user?.id;

                const userRes = await fetch(`/api/user/${maxUserId}`);
                const userData = await userRes.json();
                userData.photo_url =
                    webApp?.initDataUnsafe?.user?.photo_url || '';
                setUser(userData);

                const dealsRes = await fetch(
                    `/api/deals-full/${maxUserId}`
                );
                const dealsData = await dealsRes.json();
                setDeals(dealsData.deals || []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    /* ───────────────────────────────────────── Skeleton ───────────────────────────────────────── */

    if (loading) {
        return (
            <div style={{ padding: 16 }}>
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        style={{
                            height: 90,
                            borderRadius: 14,
                            background:
                                'linear-gradient(90deg,#eee,#f5f5f5,#eee)',
                            backgroundSize: '200% 100%',
                            animation: 'skeleton 1.5s infinite',
                            marginBottom: 12,
                        }}
                    />
                ))}
            </div>
        );
    }

    if (!user) return null;

    const renderScreen = () => {
        switch (activeTab) {
            case 'home':
                return (
                    <HomeScreen
                        user={user}
                        deals={deals}
                    />
                );
            case 'profile':
                return (
                    <ProfileScreen user={user} />
                );
            case 'help':
                return <HelpScreen />;
            case 'partners':
                return (
                    <PartnersScreen userId={user.id} />
                );
            default:
                return null;
        }
    };

    return (
        <MaxUI>
            <Flex
                direction="column"
                style={{ height: '100dvh' }}
            >
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {renderScreen()}
                </div>

                <TabBar
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                />
            </Flex>
        </MaxUI>
    );
}

export default App;