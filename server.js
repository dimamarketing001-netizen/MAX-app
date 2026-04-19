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

// staticPath — сразу после импортов
const staticPath = path.join(__dirname, 'dist');

app.use(cors());
app.use(express.json());

// ─── Логирование ──────────────────────────────────────────────────────────────
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// ─── Debug endpoint ───────────────────────────────────────────────────────────
app.post('/api/debug', (req, res) => {
    const d = req.body;
    console.log('\n' + '═'.repeat(60));
    console.log('📱 DEBUG ОТ КЛИЕНТА');
    console.log('═'.repeat(60));
    console.log(`🕐 Время:         ${d.ts}`);
    console.log(`🌐 URL:           ${d.href}`);
    console.log(`📟 UserAgent:     ${d.userAgent}`);
    console.log(`✅ WebApp есть:   ${d.hasWebApp}`);
    console.log(`🖥️  Platform:      ${d.platform}`);
    console.log(`📦 Version:       ${d.version}`);
    console.log(`👤 userId:        ${d.userId}`);
    console.log(`📄 initData raw:  ${d.initDataRaw}`);
    console.log(`📋 initDataUnsafe:`);
    console.log(JSON.stringify(d.initDataUnsafe, null, 2));
    if (d.type === 'api_response') {
        console.log(`\n🔁 API ОТВЕТ:`);
        console.log(`   URL:    ${d.url}`);
        console.log(`   Status: ${d.status}`);
        console.log(`   Type:   ${d.contentType}`);
        console.log(`   Body:   ${d.responsePreview}`);
    }
    console.log('═'.repeat(60) + '\n');
    res.json({ ok: true });
});

// ─── API: Получить данные пользователя ───────────────────────────────────────
app.get('/api/user/:maxUserId', async (req, res) => {
    const { maxUserId } = req.params;
    console.log(`👤 Запрос пользователя: ${maxUserId}`);

    try {
        const [rows] = await pool.query(
            'SELECT * FROM users WHERE max_user_id = ?',
            [maxUserId]
        );

        if (rows.length === 0) {
            console.log(`❌ Пользователь ${maxUserId} не найден в БД`);
            return res.status(404).json({ error: 'Пользователь не найден в базе данных' });
        }

        const dbUser = rows[0];
        const contactId = dbUser.bitrix_contact_id;
        console.log(`✅ Найден в БД. Bitrix contact_id: ${contactId}`);

        const contact = await getContact(contactId);
        console.log(`✅ Контакт из Б24: ${contact.NAME} ${contact.LAST_NAME}`);

        const userData = {
            id: dbUser.max_user_id,
            bitrix_contact_id: contactId,
            first_name: contact.NAME || '',
            last_name: contact.LAST_NAME || '',
            phone: extractPhone(contact) || dbUser.phone || '',
            email: extractEmail(contact) || '',
            passport_series: contact.UF_CRM_PASSPORT_SERIES || '',
            passport_number: contact.UF_CRM_PASSPORT_NUMBER || '',
        };

        res.json(userData);

    } catch (error) {
        console.error('❌ Ошибка /api/user:', error.message);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// ─── API: Получить сделки и платежи ──────────────────────────────────────────
app.get('/api/deals/:maxUserId', async (req, res) => {
    const { maxUserId } = req.params;
    console.log(`📋 Запрос сделок для: ${maxUserId}`);

    try {
        const [rows] = await pool.query(
            'SELECT bitrix_contact_id FROM users WHERE max_user_id = ?',
            [maxUserId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        const contactId = rows[0].bitrix_contact_id;
        const b24Deals = await getDealsByContact(contactId);
        console.log(`✅ Сделок из Б24: ${b24Deals.length}`);

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
        console.error('❌ Ошибка /api/deals:', error.message);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// ─── API: Обновить контактные данные ─────────────────────────────────────────
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
        const fields = {};
        if (phone) fields.PHONE = [{ VALUE: phone, VALUE_TYPE: 'WORK' }];
        if (email) fields.EMAIL = [{ VALUE: email, VALUE_TYPE: 'WORK' }];

        const axios = (await import('axios')).default;
        await axios.post(`${process.env.B24_WEBHOOK_URL}/crm.contact.update`, {
            id: contactId,
            fields
        });

        if (phone) {
            await pool.query(
                'UPDATE users SET phone = ? WHERE max_user_id = ?',
                [phone, maxUserId]
            );
        }

        res.json({ success: true });

    } catch (error) {
        console.error('❌ Ошибка /api/user/update:', error.message);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// ─── API: Создать тикет поддержки ────────────────────────────────────────────
app.post('/api/support', async (req, res) => {
    const { maxUserId, topic, message } = req.body;

    try {
        const [rows] = await pool.query(
            'SELECT bitrix_contact_id FROM users WHERE max_user_id = ?',
            [maxUserId]
        );

        const contactId = rows.length > 0 ? rows[0].bitrix_contact_id : null;

        const axios = (await import('axios')).default;
        await axios.post(`${process.env.B24_WEBHOOK_URL}/tasks.task.add`, {
            fields: {
                TITLE: `[Поддержка] ${topic}`,
                DESCRIPTION: message,
                RESPONSIBLE_ID: 1,
                UF_CRM_TASK: contactId ? [`C_${contactId}`] : [],
                PRIORITY: 1,
            }
        });

        res.json({ success: true });

    } catch (error) {
        console.error('❌ Ошибка /api/support:', error.message);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// ─── API: Получить детали сделки ─────────────────────────────────────────────
app.get('/api/deal/:dealId', async (req, res) => {
    const { dealId } = req.params;
    const axios = (await import('axios')).default;

    try {
        // Основная сделка
        const dealRes = await axios.get(`${process.env.B24_WEBHOOK_URL}/crm.deal.get`, {
            params: { id: dealId }
        });
        const deal = dealRes.data.result;

        // Товары сделки (график платежей)
        const productsRes = await axios.get(`${process.env.B24_WEBHOOK_URL}/crm.deal.productrows.get`, {
            params: { id: dealId }
        });
        const products = productsRes.data.result || [];

        // Счета (category_id=16) — дочерние сделки
        const invoicesRes = await axios.get(`${process.env.B24_WEBHOOK_URL}/crm.deal.list`, {
            params: {
                filter: {
                    'PARENT_ID': dealId,
                    'CATEGORY_ID': 16
                },
                select: ['ID', 'TITLE', 'OPPORTUNITY', 'STAGE_ID', 'CLOSEDATE', 'DATE_CREATE']
            }
        });
        const invoices = invoicesRes.data.result || [];

        // Депозиты (category_id=18)
        const depositsRes = await axios.get(`${process.env.B24_WEBHOOK_URL}/crm.deal.list`, {
            params: {
                filter: {
                    'PARENT_ID': dealId,
                    'CATEGORY_ID': 18
                },
                select: ['ID', 'TITLE', 'OPPORTUNITY', 'STAGE_ID', 'CLOSEDATE', 'DATE_CREATE']
            }
        });
        const deposits = depositsRes.data.result || [];

        res.json({ deal, products, invoices, deposits });

    } catch (error) {
        console.error('❌ Ошибка /api/deal:', error.message);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// ─── API: Получить все сделки пользователя (расширенные данные) ───────────────
app.get('/api/deals-full/:maxUserId', async (req, res) => {
    const { maxUserId } = req.params;
    const axios = (await import('axios')).default;

    try {
        const [rows] = await pool.query(
            'SELECT bitrix_contact_id FROM users WHERE max_user_id = ?',
            [maxUserId]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Не найден' });

        const contactId = rows[0].bitrix_contact_id;

        // Все сделки контакта category_id=0 (основные)
        const dealsRes = await axios.get(`${process.env.B24_WEBHOOK_URL}/crm.deal.list`, {
            params: {
                filter: {
                    CONTACT_ID: contactId,
                    CATEGORY_ID: 0
                },
                select: [
                    'ID', 'TITLE', 'STAGE_ID', 'OPPORTUNITY',
                    'CURRENCY_ID', 'DATE_CREATE', 'CLOSEDATE',
                    'TYPE_ID', 'CATEGORY_ID', 'UF_CRM_CONTRACT_NUM'
                ]
            }
        });
        const deals = dealsRes.data.result || [];

        // Получаем стадии для всех воронок
        const stagesCache = {};
        const getStages = async (categoryId) => {
            if (stagesCache[categoryId]) return stagesCache[categoryId];
            try {
                const r = await axios.get(`${process.env.B24_WEBHOOK_URL}/crm.dealcategory.stage.list`, {
                    params: { id: categoryId }
                });
                stagesCache[categoryId] = r.data.result || [];
                return stagesCache[categoryId];
            } catch {
                return [];
            }
        };

        // Для каждой сделки получаем данные
        const enrichedDeals = await Promise.all(deals.map(async (deal) => {

            // Товары сделки (график платежей)
            let products = [];
            try {
                const productsRes = await axios.get(
                    `${process.env.B24_WEBHOOK_URL}/crm.deal.productrows.get`,
                    { params: { id: deal.ID } }
                );
                products = productsRes.data.result || [];
            } catch {}

            // Счета через crm.item.list (entityTypeId=31, parentId2=dealId)
            let invoices = [];
            try {
                const invoicesRes = await axios.get(`${process.env.B24_WEBHOOK_URL}/crm.item.list`, {
                    params: {
                        entityTypeId: 31,
                        filter: { parentId2: deal.ID },
                        select: ['id', 'title', 'opportunity', 'currencyId', 'stageId', 'createdTime']
                    }
                });
                const rawInvoices = invoicesRes.data.result?.items || [];

                // Для каждого счёта получаем товары
                invoices = await Promise.all(rawInvoices.map(async (inv) => {
                    let invProducts = [];
                    try {
                        const invProdRes = await axios.get(
                            `${process.env.B24_WEBHOOK_URL}/crm.item.productrow.list`,
                            {
                                params: {
                                    filter: {
                                        '=ownerType': 'SI',
                                        '=ownerId': inv.id
                                    }
                                }
                            }
                        );
                        invProducts = invProdRes.data.result?.productRows || [];
                    } catch {}
                    return { ...inv, products: invProducts };
                }));
            } catch {}

            // Дочерние сделки category_id=16 (Публикации) и 18 (Депозиты)
            let publications = [];
            let deposits = [];
            try {
                const childRes = await axios.get(`${process.env.B24_WEBHOOK_URL}/crm.deal.list`, {
                    params: {
                        filter: { PARENT_ID: deal.ID },
                        select: ['ID', 'TITLE', 'OPPORTUNITY', 'STAGE_ID', 'DATE_CREATE', 'CATEGORY_ID']
                    }
                });
                const children = childRes.data.result || [];
                publications = children.filter(c => parseInt(c.CATEGORY_ID) === 16);
                deposits = children.filter(c => parseInt(c.CATEGORY_ID) === 18);
            } catch {}

            // Стадии основной воронки (category_id=0)
            const stages0 = await getStages(0);

            // Стадии воронки по type_id
            const typeMap = {
                'SALE':      2,  'UC_YHXSUE': 2, 'UC_UABTV4': 2,
                'COMPLEX':   4,  'GOODS':     8, 'SERVICES':  6,
                'SERVICE':  10,  '1':        12,
            };
            const relatedCategoryId = typeMap[deal.TYPE_ID];
            let relatedStages = [];
            if (relatedCategoryId) {
                relatedStages = await getStages(relatedCategoryId);
            }

            // Текущая стадия
            const isWon = deal.STAGE_ID?.endsWith(':WON');
            const currentStages = isWon ? relatedStages : stages0;
            const currentStage = currentStages.find(s => s.STATUS_ID === deal.STAGE_ID);

            // Оплаченная сумма = счета со stageId содержащим 'P' (оплачен)
            const paidAmount = invoices
                .filter(inv => inv.stageId === 'DT31_2:P')
                .reduce((sum, inv) => sum + parseFloat(inv.opportunity || 0), 0);

            return {
                ...deal,
                products,
                invoices,
                publications,
                deposits,
                paidAmount,
                currentStage: currentStage || null,
                isWon,
                relatedCategoryId,
            };
        }));

        res.json({ deals: enrichedDeals });

    } catch (error) {
        console.error('❌ Ошибка /api/deals-full:', error.message);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// ─── Статика под /page4/ (ПОСЛЕ всех API) ────────────────────────────────────
app.use('/page4', express.static(staticPath));

// ─── Fallback для React Router ────────────────────────────────────────────────
app.get('/page4', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
});
app.get('/page4/*', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Сервер запущен на порту ${PORT}`);
    console.log(`📁 Статика из: ${staticPath}`);
    console.log(`🌐 Приложение: https://xn--b1ajdba5acbodeeeaj1qb.xn--p1ai/page4/\n`);
});