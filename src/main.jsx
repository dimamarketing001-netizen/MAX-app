import React from 'react';
import { createRoot } from 'react-dom/client';
// import { MaxUI } from '@maxhub/max-ui'; // Убираем импорт MaxUI
import '@maxhub/max-ui/dist/styles.css';
import App from './App';
import './index.css';

const Root = () => (
    // <MaxUI> // Убираем MaxUI отсюда
        <App />
    // </MaxUI>
);

createRoot(document.getElementById('root')).render(<Root />);
