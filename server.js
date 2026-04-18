import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cors from 'cors';
import pool from './src/db/mysql.js';
import {
    getContact,
    getDealsByContact,
    getInvoicesByDeal,
    extractPhone,
    extractEmail,
    mapStageToStatus
} from './src/api/bitrix.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5004;

app.use(cors());
app.use(express.json());

// ─── Статика ────────────────────────────────────────────────────────────────
const staticPath = path.join(__dirname, 'dist');
app.use(express.static(staticPath));

// ─── API: Получить данные пользователя по max_user_id ───────────────────────
app.get('/api/user/:maxUserId', async (req, res) => {
    const { maxUserId } = req.params;

    try {
        // 1. Ищем пользователя в MySQL
        const [rows] = await pool.query(
            'SELECT * FROM users WHERE max_user_id = ?',
            [maxUserId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден в базе данных' });
        }

        const dbUser = rows[0];
        const contactId = dbUser.bitrix_contact_id;

        // 2. Получаем данные из Б24
        const contact = await getContact(contactId);

        // 3. Формируем ответ
        const userData = {
            id: dbUser.max_user_id,
            bitrix_contact_id: contactId,
            first_name: contact.NAME || '',
            last_name: contact.LAST_NAME || '',
            phone: extractPhone(contact) || dbUser.phone || '',
            email: extractEmail(contact) || '',
            passport_series: contact.UF_CRM_PASSPORT_SERIES || '', // поле в Б24, если есть
            passport_number: contact.UF_CRM_PASSPORT_NUMBER || '', // поле в Б24, если есть
        };

        res.json(userData);

    } catch (error) {
        console.error('Ошибка /api/user:', error.message);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// ─── API: Получить сделки и платежи пользователя ────────────────────────────
app.get('/api/deals/:maxUserId', async (req, res) => {
    const { maxUserId } = req.params;

    try {
        // 1. Ищем в MySQL
        const [rows] = await pool.query(
            'SELECT bitrix_contact_id FROM users WHERE max_user_id = ?',
            [maxUserId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        const contactId = rows[0].bitrix_contact_id;

        // 2. Получаем сделки из Б24
        const b24Deals = await getDealsByContact(contactId);

        // 3. Для каждой сделки получаем счета
        const deals = [];
        const payments = [];

        for (const deal of b24Deals) {
            deals.push({
                id: deal.ID,
                name: deal.TITLE,
                status: mapStageToStatus(deal.STAGE_ID),
                price: deal.OPPORTUNITY
                    ? `${Number(deal.OPPORTUNITY).toLocaleString('ru-RU')} ${deal.CURRENCY_ID}`
                    : 'Не указана',
                deadline: deal.CLOSEDATE
                    ? new Date(deal.CLOSEDATE).toLocaleDateString('ru-RU')
                    : 'Не указан',
            });

            // Получаем счета по сделке
            const invoices = await getInvoicesByDeal(deal.ID);
            for (const inv of invoices) {
                payments.push({
                    id: inv.id,
                    dealId: deal.ID,
                    amount: inv.opportunity
                        ? `${Number(inv.opportunity).toLocaleString('ru-RU')} руб.`
                        : 'Не указана',
                    date: inv.createdTime
                        ? new Date(inv.createdTime).toLocaleDateString('ru-RU')
                        : '',
                    status: inv.stageId === 'DT31_1:WON' ? 'Оплачен' : 'Ожидает оплаты',
                });
            }
        }

        res.json({ deals, payments });

    } catch (error) {
        console.error('Ошибка /api/deals:', error.message);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// ─── API: Обновить контактные данные в Б24 ──────────────────────────────────
app.post('/api/user/:maxUserId/update', async (req, res) => {
    const { maxUserId } = req.params;
    const { phone, email } = req.body;

    try {
        const [rows] = await pool.query(
            'SELECT bitrix_contact_id FROM users WHERE max_user_id = ?',
            [maxUserId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        const contactId = rows[0].bitrix_contact_id;

        // Обновляем в Б24
        const fields = {};
        if (phone) fields.PHONE = [{ VALUE: phone, VALUE_TYPE: 'WORK' }];
        if (email) fields.EMAIL = [{ VALUE: email, VALUE_TYPE: 'WORK' }];

        const axios = (await import('axios')).default;
        await axios.post(`${process.env.B24_WEBHOOK_URL}/crm.contact.update`, {
            id: contactId,
            fields
        });

        // Обновляем телефон в MySQL тоже
        if (phone) {
            await pool.query(
                'UPDATE users SET phone = ? WHERE max_user_id = ?',
                [phone, maxUserId]
            );
        }

        res.json({ success: true });

    } catch (error) {
        console.error('Ошибка /api/user/update:', error.message);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// ─── API: Создать тикет поддержки (задача в Б24) ────────────────────────────
app.post('/api/support', async (req, res) => {
    const { maxUserId, topic, message } = req.body;

    try {
        const [rows] = await pool.query(
            'SELECT bitrix_contact_id FROM users WHERE max_user_id = ?',
            [maxUserId]
        );

        const contactId = rows.length > 0 ? rows[0].bitrix_contact_id : null;

        const axios = (await import('axios')).default;

        // Создаём задачу в Б24
        await axios.post(`${process.env.B24_WEBHOOK_URL}/tasks.task.add`, {
            fields: {
                TITLE: `[Поддержка] ${topic}`,
                DESCRIPTION: message,
                RESPONSIBLE_ID: 1, // ID ответственного в Б24
                UF_CRM_TASK: contactId ? [`C_${contactId}`] : [], // привязка к контакту
                PRIORITY: 1,
            }
        });

        res.json({ success: true });

    } catch (error) {
        console.error('Ошибка /api/support:', error.message);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// ─── Все остальные запросы → index.html ─────────────────────────────────────
app.get('*', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});