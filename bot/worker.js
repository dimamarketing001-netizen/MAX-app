import dotenv from 'dotenv';
import axios from 'axios';
import {
  getPendingNotifications,
  findUserByContactId,
  findUserByLeadId,
  updateNotificationStatus,
  getPendingInvoiceNotifications,
  updateInvoiceNotificationStatus,
} from './db.js';
dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const WORKER_INTERVAL = parseInt(process.env.WORKER_INTERVAL) || 10000;

// Тексты уведомлений
const MESSAGES = {
  // Договор
  contract_ready: (dealTitle) =>
    `📄 Ваш договор сформирован!\n\n` +
    `По сделке: ${dealTitle}\n\n` +
    `Пожалуйста, ознакомьтесь с документом.\n` +
    `Если есть вопросы — напишите нам.`,

  // Счета
  invoice_unconfirmed: (dealTitle, amount, currency) =>
    `🧾 Пришла неподтверждённая оплата!\n\n` +
    `По сделке: ${dealTitle}\n` +
    `Сумма: ${amount} ${currency}\n\n` +
    `Ожидайте подтверждения менеджером.`,

  invoice_confirmed: (dealTitle, amount, currency) =>
    `✅ Ваша оплата подтверждена!\n\n` +
    `По сделке: ${dealTitle}\n` +
    `Сумма: ${amount} ${currency}\n\n` +
    `Спасибо за оплату! Если есть вопросы — напишите нам.`,
};

export function startWorker() {
  console.log(`\n⚙️  [WORKER] Запуск воркера`);
  console.log(`⏱️  [WORKER] Интервал: ${WORKER_INTERVAL / 1000} сек`);

  processAll();
  setInterval(processAll, WORKER_INTERVAL);
}

async function processAll() {
  // Обрабатываем договоры
  await processContractNotifications();

  // Обрабатываем счета
  await processInvoiceNotifications();
}

// ─── Договоры ─────────────────────────────────────────────────────────────────

async function processContractNotifications() {
  const pending = await getPendingNotifications();
  if (pending.length === 0) return;

  console.log(`\n⚙️  [WORKER] Договоры pending: ${pending.length}`);

  for (const notification of pending) {
    await processOneContract(notification);
  }
}

async function processOneContract(notification) {
  const { id, deal_id, type, contact_id, lead_id, deal_title } = notification;

  console.log(`\n[WORKER] Договор id=${id}, type=${type}, deal_id=${deal_id}`);

  try {
    const maxUser = await findMaxUser(contact_id, lead_id);
    if (!maxUser) {
      console.log(`[WORKER] ❌ Пользователь MAX не найден`);
      await updateNotificationStatus(id, 'error', `Пользователь не найден`);
      return;
    }

    const text = MESSAGES[type]
      ? MESSAGES[type](deal_title || `Сделка #${deal_id}`)
      : `Уведомление по сделке ${deal_title}`;

    const sent = await sendMaxMessage(maxUser.max_user_id, text);

    if (sent) {
      await updateNotificationStatus(id, 'sent');
      console.log(`✅ [WORKER] Договор отправлен → user_id=${maxUser.max_user_id}`);
    } else {
      await updateNotificationStatus(id, 'error', 'Ошибка отправки в MAX');
    }
  } catch (error) {
    console.error(`[WORKER] ❌ Ошибка:`, error.message);
    await updateNotificationStatus(id, 'error', error.message);
  }
}

// ─── Счета ────────────────────────────────────────────────────────────────────

async function processInvoiceNotifications() {
  const pending = await getPendingInvoiceNotifications();
  if (pending.length === 0) return;

  console.log(`\n⚙️  [WORKER] Счета pending: ${pending.length}`);

  for (const notification of pending) {
    await processOneInvoice(notification);
  }
}

async function processOneInvoice(notification) {
  const {
    id, invoice_id, deal_id, contact_id, lead_id,
    deal_title, amount, currency, notification_type,
  } = notification;

  console.log(`\n[WORKER] Счёт id=${id}, invoice_id=${invoice_id}, type=${notification_type}`);

  try {
    const maxUser = await findMaxUser(contact_id, lead_id);
    if (!maxUser) {
      console.log(`[WORKER] ❌ Пользователь MAX не найден`);
      await updateInvoiceNotificationStatus(id, 'error', 'Пользователь не найден');
      return;
    }

    const dealTitle = deal_title || `Сделка #${deal_id}`;
    const amountStr = amount ? parseFloat(amount).toLocaleString('ru-RU') : '—';
    const currencyStr = currency || 'RUB';

    const messageFn = MESSAGES[notification_type];
    const text = messageFn
      ? messageFn(dealTitle, amountStr, currencyStr)
      : `Уведомление по счёту #${invoice_id}`;

    const sent = await sendMaxMessage(maxUser.max_user_id, text);

    if (sent) {
      await updateInvoiceNotificationStatus(id, 'sent');
      console.log(`✅ [WORKER] Счёт отправлен → user_id=${maxUser.max_user_id}`);
    } else {
      await updateInvoiceNotificationStatus(id, 'error', 'Ошибка отправки в MAX');
    }
  } catch (error) {
    console.error(`[WORKER] ❌ Ошибка:`, error.message);
    await updateInvoiceNotificationStatus(id, 'error', error.message);
  }
}

// ─── Общие функции ────────────────────────────────────────────────────────────

async function findMaxUser(contactId, leadId) {
  if (contactId) {
    const user = await findUserByContactId(contactId);
    if (user) return user;
  }
  if (leadId) {
    const user = await findUserByLeadId(leadId);
    if (user) return user;
  }
  return null;
}

async function sendMaxMessage(maxUserId, text) {
  try {
    console.log(`[MAX] Отправка → user_id=${maxUserId}`);
    const response = await axios.post(
      `https://platform-api.max.ru/messages`,
      { text },
      {
        headers: {
          Authorization: BOT_TOKEN,
          'Content-Type': 'application/json',
        },
        params: { user_id: maxUserId },
      }
    );
    console.log(`[MAX] Ответ:`, JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('[MAX] Ошибка:', error.message);
    console.error('[MAX] Response:', JSON.stringify(error.response?.data, null, 2));
    return false;
  }
}