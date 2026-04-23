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

// ─── Маппинг типов сделок ─────────────────────────────────────────────────────
const DEAL_TYPE_MAP = {
  'SALE':      'Банкротство физических лиц',
  'COMPLEX':   'Юридическая услуга',
  'GOODS':     'Расторжение кредитного договора',
  'SERVICES':  'Сбор документов',
  'SERVICE':   'Кредитный брокер',
  '1':         'Исправление кредитной истории',
  'UC_YHXSUE': 'Внесудебное банкротство',
  'UC_UABTV4': 'Реструктуризация долга',
};

/**
 * Получить название типа сделки
 */
function getDealTypeName(typeId) {
  return DEAL_TYPE_MAP[typeId] || `Услуга`;
}

// ─── Тексты уведомлений ───────────────────────────────────────────────────────
const MESSAGES = {
  // Производство началось
  deal_won: (dealTypeName) =>
    `⚖️ Ваше дело принято в работу!\n\n` +
    `По делу: ${dealTypeName}\n\n` +
    `Мы приступили к производству по вашему делу.\n` +
    `Наши специалисты уже работают над вашим вопросом.\n\n` +
    `Если у вас есть вопросы — напишите нам.`,

  // Договор
  contract_ready: (dealTypeName) =>
    `📄 Ваш договор сформирован!\n\n` +
    `По делу: ${dealTypeName}\n\n` +
    `Пожалуйста, ознакомьтесь с документом.\n` +
    `Если есть вопросы — напишите нам.`,

  // Счета
  invoice_unconfirmed: (dealTypeName, amount, currency) =>
    `🧾 Получена неподтверждённая оплата!\n\n` +
    `По делу: ${dealTypeName}\n` +
    `Сумма: ${amount} ${currency}\n\n` +
    `Ваш платёж получен и ожидает подтверждения менеджером.\n` +
    `Мы уведомим вас, как только оплата будет подтверждена.`,

  invoice_confirmed: (dealTypeName, amount, currency) =>
    `✅ Ваша оплата подтверждена!\n\n` +
    `По делу: ${dealTypeName}\n` +
    `Сумма: ${amount} ${currency}\n\n` +
    `Спасибо за оплату! Если есть вопросы — напишите нам.`,
};

// ─── Запуск воркера ───────────────────────────────────────────────────────────

export function startWorker() {
  console.log(`\n⚙️  [WORKER] Запуск воркера`);
  console.log(`⏱️  [WORKER] Интервал: ${WORKER_INTERVAL / 1000} сек`);

  processAll();
  setInterval(processAll, WORKER_INTERVAL);
}

async function processAll() {
  await processContractNotifications();
  await processInvoiceNotifications();
}

// ─── Договоры и производство ──────────────────────────────────────────────────

async function processContractNotifications() {
  const pending = await getPendingNotifications();
  if (pending.length === 0) return;

  console.log(`\n⚙️  [WORKER] Уведомления pending: ${pending.length}`);

  for (const notification of pending) {
    await processOneContract(notification);
  }
}

async function processOneContract(notification) {
  const { id, deal_id, type, contact_id, lead_id, deal_title, deal_type_id } = notification;

  console.log(`\n[WORKER] Уведомление id=${id}, type=${type}, deal_id=${deal_id}`);
  console.log(`[WORKER]   deal_type_id: ${deal_type_id}`);

  try {
    const maxUser = await findMaxUser(contact_id, lead_id);
    if (!maxUser) {
      console.log(`[WORKER] ❌ Пользователь MAX не найден`);
      await updateNotificationStatus(id, 'error', 'Пользователь не найден');
      return;
    }

    // Получаем название типа сделки
    const dealTypeName = getDealTypeName(deal_type_id);
    console.log(`[WORKER]   dealTypeName: ${dealTypeName}`);

    let text = null;

    switch (type) {
      case 'deal_won':
        text = MESSAGES.deal_won(dealTypeName);
        break;

      case 'contract_ready':
        text = MESSAGES.contract_ready(dealTypeName);
        break;

      default:
        text = `Уведомление по делу: ${dealTypeName}`;
    }

    const sent = await sendMaxMessage(maxUser.max_user_id, text);

    if (sent) {
      await updateNotificationStatus(id, 'sent');
      console.log(`✅ [WORKER] Отправлено → user_id=${maxUser.max_user_id}`);
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
    amount, currency, notification_type, deal_type_id,
  } = notification;

  console.log(`\n[WORKER] Счёт id=${id}, invoice_id=${invoice_id}, type=${notification_type}`);
  console.log(`[WORKER]   deal_type_id: ${deal_type_id}`);

  try {
    const maxUser = await findMaxUser(contact_id, lead_id);
    if (!maxUser) {
      console.log(`[WORKER] ❌ Пользователь MAX не найден`);
      await updateInvoiceNotificationStatus(id, 'error', 'Пользователь не найден');
      return;
    }

    const dealTypeName = getDealTypeName(deal_type_id);
    console.log(`[WORKER]   dealTypeName: ${dealTypeName}`);

    const amountStr = amount
      ? parseFloat(amount).toLocaleString('ru-RU')
      : '—';
    const currencyStr = currency || 'RUB';

    let text = null;

    switch (notification_type) {
      case 'invoice_unconfirmed':
        text = MESSAGES.invoice_unconfirmed(dealTypeName, amountStr, currencyStr);
        break;

      case 'invoice_confirmed':
        text = MESSAGES.invoice_confirmed(dealTypeName, amountStr, currencyStr);
        break;

      default:
        text = `Уведомление по счёту #${invoice_id}`;
    }

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