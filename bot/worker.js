import dotenv from 'dotenv';
import axios from 'axios';
import {
  getPendingNotifications,
  findUserByContactId,
  findUserByLeadId,
  updateNotificationStatus,
} from './db.js';
dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const WORKER_INTERVAL = parseInt(process.env.WORKER_INTERVAL) || 10000; // 10 секунд

// Сообщения по типу уведомления
const MESSAGES = {
  contract_ready: (dealTitle) =>
    `📄 Ваш договор сформирован!\n\n` +
    `По сделке: ${dealTitle}\n\n` +
    `Пожалуйста, ознакомьтесь с документом.\n` +
    `Если есть вопросы — напишите нам.`,

  invoice_new: (dealTitle) =>
    `🧾 Пришла неподтверждённая оплата!\n\n` +
    `По сделке: ${dealTitle}\n\n` +
    `Ваш платёж получен и ожидает подтверждения менеджером.`,

  invoice_confirmed: (dealTitle) =>
    `✅ Ваша оплата подтверждена!\n\n` +
    `По сделке: ${dealTitle}\n\n` +
    `Спасибо за оплату! Если есть вопросы — напишите нам.`,
};

/**
 * Запуск воркера
 */
export function startWorker() {
  console.log(`\n⚙️  [WORKER] Запуск воркера уведомлений`);
  console.log(`⏱️  [WORKER] Интервал проверки: ${WORKER_INTERVAL / 1000} сек`);

  // Первый запуск сразу
  processNotifications();

  // Затем по интервалу
  setInterval(processNotifications, WORKER_INTERVAL);
}

/**
 * Обработка всех pending уведомлений
 */
async function processNotifications() {
  const pending = await getPendingNotifications();

  if (pending.length === 0) {
    return; // Тихо пропускаем если нет задач
  }

  console.log(`\n⚙️  [WORKER] Найдено pending уведомлений: ${pending.length}`);

  for (const notification of pending) {
    await processOne(notification);
  }
}

/**
 * Обработка одного уведомления
 */
async function processOne(notification) {
  const { id, deal_id, type, contact_id, lead_id, deal_title } = notification;

  console.log(`\n[WORKER] Обработка уведомления id=${id}`);
  console.log(`[WORKER]   type:       ${type}`);
  console.log(`[WORKER]   deal_id:    ${deal_id}`);
  console.log(`[WORKER]   contact_id: ${contact_id}`);
  console.log(`[WORKER]   lead_id:    ${lead_id}`);
  console.log(`[WORKER]   deal_title: ${deal_title}`);

  try {
    // Ищем пользователя MAX
    const maxUser = await findMaxUser(contact_id, lead_id);

    if (!maxUser) {
      console.log(`[WORKER] ❌ Пользователь MAX не найден`);
      console.log(`[WORKER]    contact_id=${contact_id}, lead_id=${lead_id} не в БД`);
      await updateNotificationStatus(
        id,
        'error',
        `Пользователь MAX не найден: contact_id=${contact_id}, lead_id=${lead_id}`
      );
      return;
    }

    console.log(`[WORKER] ✅ Пользователь найден: max_user_id=${maxUser.max_user_id}`);

    // Формируем текст сообщения
    const messageText = MESSAGES[type]
      ? MESSAGES[type](deal_title || `Сделка #${deal_id}`)
      : `Уведомление по сделке: ${deal_title || `#${deal_id}`}`;

    // Отправляем сообщение в MAX
    const sent = await sendMaxMessage(maxUser.max_user_id, messageText);

    if (sent) {
      await updateNotificationStatus(id, 'sent');
      console.log(`✅ [WORKER] Уведомление id=${id} отправлено → max_user_id=${maxUser.max_user_id}`);
    } else {
      await updateNotificationStatus(id, 'error', 'Ошибка отправки в MAX API');
    }

  } catch (error) {
    console.error(`[WORKER] ❌ Ошибка обработки уведомления id=${id}:`, error.message);
    await updateNotificationStatus(id, 'error', error.message);
  }
}

/**
 * Найти пользователя MAX по contact_id или lead_id
 */
async function findMaxUser(contactId, leadId) {
  // Сначала по контакту
  if (contactId) {
    console.log(`[WORKER] Поиск по contact_id=${contactId}`);
    const user = await findUserByContactId(contactId);
    if (user) {
      console.log(`[WORKER] Найден через contact_id`);
      return user;
    }
  }

  // Затем по лиду
  if (leadId) {
    console.log(`[WORKER] Поиск по lead_id=${leadId}`);
    const user = await findUserByLeadId(leadId);
    if (user) {
      console.log(`[WORKER] Найден через lead_id`);
      return user;
    }
  }

  return null;
}

/**
 * Отправить сообщение пользователю в MAX
 */
async function sendMaxMessage(maxUserId, text) {
  try {
    console.log(`[MAX] Отправка сообщения → user_id=${maxUserId}`);

    const response = await axios.post(
      `https://platform-api.max.ru/messages`,
      { text },
      {
        headers: {
          Authorization: BOT_TOKEN,
          'Content-Type': 'application/json',
        },
        params: {
          user_id: maxUserId,
        },
      }
    );

    console.log(`[MAX] Ответ:`, JSON.stringify(response.data, null, 2));
    return true;

  } catch (error) {
    console.error('[MAX] Ошибка отправки:', error.message);
    console.error('[MAX] Response:', JSON.stringify(error.response?.data, null, 2));
    return false;
  }
}