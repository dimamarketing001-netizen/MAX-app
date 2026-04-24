import React, { useState, useEffect } from 'react';

import { TabBar } from './components/TabBar';
import { HomeScreen } from './screens/Home';
import { ProfileScreen } from './screens/Profile';
import { HelpScreen } from './screens/Help';
import { PartnersScreen } from './screens/Partners';
import { DocumentsScreen } from './screens/Documents';


// ─── Error Boundary ───────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    componentDidCatch(error, info) {
        console.error('React Error:', error, info);
        fetch('/api/debug', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ts: new Date().toISOString(),
                type: 'react_error',
                error: error.message,
                stack: error.stack,
                componentStack: info.componentStack,
            }),
        }).catch(() => {});
    }

    static getDerivedStateFromError(error) {
        return { error: error.message + '\n' + error.stack };
    }

    render() {
        if (this.state.error) {
            return (
                <div style={{
                    padding: 16,
                    background: '#0d0d0d',
                    color: '#00ff41',
                    fontFamily: 'monospace',
                    fontSize: 11,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    minHeight: '100vh',
                    overflowY: 'auto',
                }}>
                    {'REACT ERROR:\n' + this.state.error}
                </div>
            );
        }
        return this.props.children;
    }
}

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

    useEffect(() => {
        const loadAppData = async () => {
            setLoading(true);

            const webApp = await waitForWebApp(5000);
            const initDataUnsafe = webApp?.initDataUnsafe || null;

            const logData = {
                ts: new Date().toISOString(),
                userAgent: navigator.userAgent,
                href: window.location.href,
                hasWebApp: !!webApp,
                platform: safeGet(webApp, 'platform'),
                version: safeGet(webApp, 'version'),
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

            try {
                const userRes = await fetch(`/api/user/${maxUserId}`);
                const contentType = userRes.headers.get('content-type') || '';
                const responseText = await userRes.text();

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

                userData.photo_url = safeGet(initDataUnsafe, 'user.photo_url') || '';
                setUser(userData);

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

    const handleUploadDocument = () => {
        try {
            const webApp = window.WebApp;
            if (webApp?.close) {
                webApp.close();
            }
        } catch (e) {
            console.warn('webApp.close error:', e);
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
            case 'documents':
                return (
                    <DocumentsScreen
                        deals={deals}
                        onUploadDocument={handleUploadDocument}
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
            <ErrorBoundary>
                <div style={{
                    minHeight: '100dvh',
                    backgroundColor: '#F2F3F5',
                    padding: 16,
                    boxSizing: 'border-box',
                }}>
                    {[1, 2, 3].map(i => (
                        <div
                            key={i}
                            style={{
                                height: 90,
                                borderRadius: 14,
                                background: 'linear-gradient(90deg,#e0e0e0,#f5f5f5,#e0e0e0)',
                                backgroundSize: '200% 100%',
                                animation: 'skeleton 1.5s infinite',
                                marginBottom: 12,
                            }}
                        />
                    ))}
                </div>
            </ErrorBoundary>
        );
    }

    // ── Экран ошибки ───────────────────────────────────────────────────────────
    if (error || !user) {
        return (
            <ErrorBoundary>
                <div style={{ padding: 16, backgroundColor: '#F2F3F5', minHeight: '100dvh' }}>
                    <div style={{
                        background: '#0d0d0d',
                        color: '#00ff41',
                        padding: 12,
                        borderRadius: 8,
                        fontSize: 10,
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                    }}>
                        {error || 'Нет данных пользователя'}
                    </div>
                </div>
            </ErrorBoundary>
        );
    }

    // ── Основной экран ─────────────────────────────────────────────────────────
    return (
        <ErrorBoundary>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100dvh',
                    width: '100%',
                    overflow: 'hidden',
                    backgroundColor: '#F2F3F5',
                }}
            >
                {/* Контент с прокруткой */}
                <div
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        width: '100%',
                        WebkitOverflowScrolling: 'touch',
                        animation: 'fadeIn .2s ease',
                    }}
                >
                    {renderScreen()}
                </div>

                {/* Нижняя навигация */}
                <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
            </div>
        </ErrorBoundary>
    );
}


export default App;