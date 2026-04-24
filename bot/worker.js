import dotenv from 'dotenv';
import axios from 'axios';
import {
  getPendingNotifications,
  findUserByContactId,
  findUserByLeadId,
  updateNotificationStatus,
  getPendingInvoiceNotifications,
  updateInvoiceNotificationStatus,
  getPendingStageNotifications,
  updateStageNotificationStatus,
} from './db.js';
dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const WORKER_INTERVAL = parseInt(process.env.WORKER_INTERVAL) || 10000;

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

function getDealTypeName(typeId) {
  if (!typeId) return 'Услуга';
  const name = DEAL_TYPE_MAP[String(typeId).trim()];
  if (!name) {
    console.log(`[WORKER] ⚠️ Тип "${typeId}" не найден → "Услуга"`);
    return 'Услуга';
  }
  return name;
}

const MESSAGES = {
  deal_won: (dealTypeName) =>
    `⚖️ Ваше дело принято в работу!\n\n` +
    `По делу: ${dealTypeName}\n\n` +
    `Мы приступили к производству по вашему делу.\n` +
    `Наши специалисты уже работают над вашим вопросом.\n\n` +
    `Если есть вопросы — напишите нам.`,

  contract_ready: (dealTypeName) =>
    `📄 Ваш договор сформирован!\n\n` +
    `По делу: ${dealTypeName}\n\n` +
    `Пожалуйста, ознакомьтесь с документом.\n` +
    `Если есть вопросы — напишите нам.`,

  invoice_unconfirmed: (dealTypeName, amount, currency) =>
    `🧾 Получена неподтверждённая оплата!\n\n` +
    `По делу: ${dealTypeName}\n` +
    `Сумма: ${amount} ${currency}\n\n` +
    `Ваш платёж получен и ожидает подтверждения менеджером.\n` +
    `Мы уведомим вас как только оплата будет подтверждена.`,

  invoice_confirmed: (dealTypeName, amount, currency) =>
    `✅ Ваша оплата подтверждена!\n\n` +
    `По делу: ${dealTypeName}\n` +
    `Сумма: ${amount} ${currency}\n\n` +
    `Спасибо за оплату! Если есть вопросы — напишите нам.`,

  deal_stage: (dealTypeName, stageName) =>
    `📋 Статус вашего дела изменился!\n\n` +
    `Дело: ${dealTypeName}\n` +
    `Стадия: ${stageName}\n\n` +
    `Если есть вопросы — напишите нам.`,
};

// ─── Запуск ───────────────────────────────────────────────────────────────────

export function startWorker() {
  console.log(`\n⚙️  [WORKER] Запуск воркера`);
  console.log(`⏱️  [WORKER] Интервал: ${WORKER_INTERVAL / 1000} сек`);
  processAll();
  setInterval(processAll, WORKER_INTERVAL);
}

async function processAll() {
  await processContractNotifications();
  await processInvoiceNotifications();
  await processStageNotifications();
}

// ─── Договоры и WON ───────────────────────────────────────────────────────────

async function processContractNotifications() {
  const pending = await getPendingNotifications();
  if (pending.length === 0) return;

  console.log(`\n⚙️  [WORKER] Договоры/WON pending: ${pending.length}`);
  for (const n of pending) {
    await processOneContract(n);
  }
}

async function processOneContract(notification) {
  const { id, deal_id, type, contact_id, lead_id, deal_type_id } = notification;
  console.log(`\n[WORKER] id=${id}, type=${type}, deal_id=${deal_id}, deal_type_id=${deal_type_id}`);

  try {
    const maxUser = await findMaxUser(contact_id, lead_id);
    if (!maxUser) {
      await updateNotificationStatus(id, 'error', 'Пользователь не найден');
      return;
    }

    const dealTypeName = getDealTypeName(deal_type_id);
    let text;

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
    await updateNotificationStatus(id, sent ? 'sent' : 'error', sent ? null : 'Ошибка отправки');

    if (sent) console.log(`✅ [WORKER] Отправлено → user_id=${maxUser.max_user_id}`);
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
  for (const n of pending) {
    await processOneInvoice(n);
  }
}

async function processOneInvoice(notification) {
  const {
    id, invoice_id, deal_id, contact_id, lead_id,
    amount, currency, notification_type, deal_type_id,
  } = notification;

  console.log(`\n[WORKER] Счёт id=${id}, invoice_id=${invoice_id}, type=${notification_type}`);

  try {
    const maxUser = await findMaxUser(contact_id, lead_id);
    if (!maxUser) {
      await updateInvoiceNotificationStatus(id, 'error', 'Пользователь не найден');
      return;
    }

    const dealTypeName = getDealTypeName(deal_type_id);
    const amountStr = amount ? parseFloat(amount).toLocaleString('ru-RU') : '—';
    const currencyStr = currency || 'RUB';

    let text;
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
    await updateInvoiceNotificationStatus(id, sent ? 'sent' : 'error', sent ? null : 'Ошибка отправки');

    if (sent) console.log(`✅ [WORKER] Счёт отправлен → user_id=${maxUser.max_user_id}`);
  } catch (error) {
    console.error(`[WORKER] ❌ Ошибка:`, error.message);
    await updateInvoiceNotificationStatus(id, 'error', error.message);
  }
}

// ─── Стадии ───────────────────────────────────────────────────────────────────

async function processStageNotifications() {
  const pending = await getPendingStageNotifications();
  if (pending.length === 0) return;

  console.log(`\n⚙️  [WORKER] Стадии pending: ${pending.length}`);
  for (const n of pending) {
    await processOneStage(n);
  }
}

async function processOneStage(notification) {
  const { id, deal_id, stage_id, stage_name, contact_id, lead_id, deal_type_id } = notification;

  console.log(`\n[WORKER] Стадия id=${id}, deal_id=${deal_id}, stage="${stage_id}", name="${stage_name}"`);

  try {
    const maxUser = await findMaxUser(contact_id, lead_id);
    if (!maxUser) {
      await updateStageNotificationStatus(id, 'error', 'Пользователь не найден');
      return;
    }

    const dealTypeName = getDealTypeName(deal_type_id);
    const text = MESSAGES.deal_stage(dealTypeName, stage_name || stage_id);

    const sent = await sendMaxMessage(maxUser.max_user_id, text);
    await updateStageNotificationStatus(id, sent ? 'sent' : 'error', sent ? null : 'Ошибка отправки');

    if (sent) console.log(`✅ [WORKER] Стадия отправлена → user_id=${maxUser.max_user_id}`);
  } catch (error) {
    console.error(`[WORKER] ❌ Ошибка:`, error.message);
    await updateStageNotificationStatus(id, 'error', error.message);
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