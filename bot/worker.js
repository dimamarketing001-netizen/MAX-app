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
  getPendingPaymentChecks,
  updatePaymentStatus,
  getActiveOverdueCycleBot,
  getOverdueClientStatusBot,
  getContactNameBot,
  ensureOverdueClient,
  updateOverdueClientStatusBot,
  createOverdueCycleBot,
  createOverdueNotificationsBot,
  getPendingOverdueNotifications,
  updateOverdueNotificationStatus,
  getOverdueCycle,
  updateOverdueCycleStatus,
} from './db.js';
dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const BITRIX_WEBHOOK = process.env.BITRIX_WEBHOOK;
const WORKER_INTERVAL = parseInt(process.env.WORKER_INTERVAL) || 10000;
const OVERDUE_DAYS = [1, 3, 7, 14, 20, 30, 37];

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

function getDealTypeName(typeId) {
  if (!typeId) return 'Услуга';
  const name = DEAL_TYPE_MAP[String(typeId).trim()];
  if (!name) {
    console.log(`[WORKER] ⚠️ Тип "${typeId}" не найден → "Услуга"`);
    return 'Услуга';
  }
  return name;
}

// ─── Тексты уведомлений ───────────────────────────────────────────────────────

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

// ─── Тексты уведомлений о просрочке ──────────────────────────────────────────

const OVERDUE_MESSAGES = {
  1: (name, contractNumber, contractDate, amount) =>
    `📩 Напоминание об оплате по договору\n\n` +
    `Уважаемый(ая) ${name},\n\n` +
    `Компания «Мой юрист» уведомляет вас о просрочке оплаты ` +
    `по договору № ${contractNumber} от ${contractDate} на сумму ${amount} руб.\n\n` +
    `Возможно, произошла техническая задержка платежа. ` +
    `Просим произвести оплату в ближайшее время.\n\n` +
    `Своевременная оплата необходима для продолжения работы ` +
    `по вашему делу без задержек.\n\n` +
    `Если платёж уже произведён — просим проигнорировать данное сообщение.\n\n` +
    `С уважением,\nООО «Мой юрист»\nмойюрист24.рф`,

  3: (name, contractNumber, contractDate, amount) =>
    `📩 Просрочка оплаты по договору\n\n` +
    `Уважаемый(ая) ${name},\n\n` +
    `по договору № ${contractNumber} от ${contractDate} на сумму ${amount} руб. ` +
    `просрочка составляет 3 дня.\n\n` +
    `Напоминаем, что при нарушении сроков оплаты компания «Мой юрист» ` +
    `вправе приостановить оказание услуг до момента поступления оплаты.\n\n` +
    `Просим произвести оплату в кратчайшие сроки ` +
    `во избежание приостановки работы по вашему делу.\n\n` +
    `С уважением,\nООО «Мой юрист»\nмойюрист24.рф`,

  7: (name, contractNumber, contractDate, amount) =>
    `📩 Предупреждение о приостановке работы по делу\n\n` +
    `Уважаемый(ая) ${name},\n\n` +
    `по договору № ${contractNumber} от ${contractDate} на сумму ${amount} руб. ` +
    `просрочка составляет 7 дней.\n\n` +
    `В случае непоступления оплаты работа по вашему делу будет ` +
    `приостановлена до полного погашения задолженности.\n\n` +
    `Просим урегулировать вопрос оплаты в кратчайшие сроки.\n\n` +
    `С уважением,\nООО «Мой юрист»\nмойюрист24.рф`,

  14: (name, contractNumber, contractDate, amount) =>
    `📩 Уведомление о приостановке оказания услуг\n\n` +
    `Уважаемый(ая) ${name},\n\n` +
    `В связи с просрочкой оплаты более 14 дней по договору № ${contractNumber} ` +
    `от ${contractDate} на сумму ${amount} руб. оказание услуг приостановлено.\n\n` +
    `Обращаем внимание, что задержка оплаты может повлиять ` +
    `на сроки и ход вашего дела.\n\n` +
    `Для возобновления работы необходимо полностью погасить задолженность.\n\n` +
    `С уважением,\nООО «Мой юрист»\nмойюрист24.рф`,

  20: (name, contractNumber, contractDate, amount) =>
    `📩 Уведомление о возможном прекращении дела\n\n` +
    `Уважаемый(ая) ${name},\n\n` +
    `Просрочка оплаты по договору № ${contractNumber} от ${contractDate} ` +
    `на сумму ${amount} руб. составляет 20 дней.\n` +
    `На текущий момент работа по вашему делу приостановлена.\n\n` +
    `В случае непоступления оплаты в течение 7 календарных дней ` +
    `компания «Мой юрист» будет вынуждена прекратить производство ` +
    `по вашему делу.\n\n` +
    `Просим урегулировать вопрос оплаты в указанный срок.\n\n` +
    `С уважением,\nООО «Мой юрист»\nмойюрист24.рф`,

  30: (name, contractNumber, contractDate, amount) =>
    `📩 Финальное уведомление. Прекращение производства по делу\n\n` +
    `Уважаемый(ая) ${name},\n\n` +
    `Просрочка оплаты по договору № ${contractNumber} от ${contractDate} ` +
    `на сумму ${amount} руб. составляет 30 дней.\n\n` +
    `Ранее вам направлялись уведомления о необходимости погашения задолженности.\n\n` +
    `Если оплата не поступит в течение 7 календарных дней с момента ` +
    `получения данного уведомления, производство по вашему делу будет ` +
    `прекращено до момента полной оплаты.\n\n` +
    `Просим вас принять решение в установленный срок.\n\n` +
    `С уважением,\nООО «Мой юрист»\nмойюрист24.рф`,

  37: (name, contractNumber, contractDate, amount) =>
    `📩 Дело остановлено\n\n` +
    `Уважаемый(ая) ${name},\n\n` +
    `В связи с отсутствием оплаты по договору № ${contractNumber} ` +
    `от ${contractDate} на сумму ${amount} руб. ` +
    `производство по вашему делу в компании «Мой юрист» остановлено.\n\n` +
    `Для получения дальнейшей информации и решения вопроса ` +
    `просим срочно связаться с нами.\n\n` +
    `ООО «Мой юрист»\nмойюрист24.рф`,
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
  await processStageNotifications();
  await processPaymentSchedule();
  await processOverdueNotifications();
}

// ─── График платежей ──────────────────────────────────────────────────────────

async function processPaymentSchedule() {
  const payments = await getPendingPaymentChecks();
  if (payments.length === 0) return;

  console.log(`\n⚙️  [WORKER] Проверок платежей: ${payments.length}`);

  for (const payment of payments) {
    await checkOnePayment(payment);
  }
}

async function checkOnePayment(payment) {
  const {
    id, deal_id, contact_id, payment_number,
    payment_date, check_date, amount,
    cumulative_amount, deal_type_id, deal_title,
    contract_number,
  } = payment;

  console.log(`\n[WORKER] Платёж id=${id}, deal_id=${deal_id}, №${payment_number}`);
  console.log(`[WORKER]   Дата платежа: ${payment_date}`);
  console.log(`[WORKER]   День 0 просрочки: ${check_date}`);
  console.log(`[WORKER]   Сумма: ${amount}, кумулятив: ${cumulative_amount}`);

  try {
    const paidAmount = await getConfirmedPaidAmount(deal_id);
    console.log(`[WORKER]   Оплачено подтверждённых: ${paidAmount}`);

    if (paidAmount >= parseFloat(cumulative_amount)) {
      console.log(`[WORKER] ✅ Платёж №${payment_number} оплачен`);
      await updatePaymentStatus(id, 'paid');
      return;
    }

    const overdueAmount = parseFloat(cumulative_amount) - paidAmount;
    console.log(`[WORKER] ❌ Просрочка! Сумма: ${overdueAmount}`);

    await updatePaymentStatus(id, 'overdue');

    const activeCycle = await getActiveOverdueCycleBot(deal_id);
    if (activeCycle) {
      console.log(`[WORKER] ℹ️ Активный цикл id=${activeCycle.id} — лояльность, пропускаем`);
      return;
    }

    const clientStatus = await getOverdueClientStatusBot(contact_id);
    if (clientStatus === 'closed') {
      console.log(`[WORKER] ℹ️ Клиент на стопе — новый цикл не запускаем`);
      return;
    }

    // Получаем имя контакта из Б24 напрямую
    const contactName = await getContactNameFromB24(contact_id);
    console.log(`[WORKER]   Имя контакта: ${contactName}`);

    // Получаем дату договора из Б24
    const contractDate = await getContractDateFromB24(deal_id);
    console.log(`[WORKER]   Дата договора: ${contractDate}`);

    await ensureOverdueClient(contact_id, contactName);
    await updateOverdueClientStatusBot(contact_id, 'overdue');

    const cycleId = await createOverdueCycleBot({
      contactId: contact_id,
      dealId: deal_id,
      dealTypeId: deal_type_id,
      dealTitle: deal_title,
      contractNumber: contract_number,
      contractDate: contractDate,
      overduePaymentDate: payment_date,
      overdueAmount,
      paidAmountAtStart: paidAmount,
      totalSchedule: parseFloat(cumulative_amount),
      overdueStartDate: check_date,
    });

    // Считаем даты уведомлений от check_date (день 0)
    const overdueStart = new Date(check_date);
    overdueStart.setHours(0, 0, 0, 0);

    const todayStr = formatDate(new Date());

    const notifications = OVERDUE_DAYS.map(day => ({
      cycleId,
      contactId: contact_id,
      dayNumber: day,
      scheduledDate: formatDate(addDaysToDate(overdueStart, day)),
    }));

    await createOverdueNotificationsBot(notifications);

    console.log(`✅ [WORKER] Цикл создан: id=${cycleId}, день 0: ${check_date}`);
    notifications.forEach(n => {
      const isPast = n.scheduledDate < todayStr;
      const isToday = n.scheduledDate === todayStr;
      console.log(
        `[WORKER]   День ${n.dayNumber}: ${n.scheduledDate}` +
        `${isPast ? ' ← skipped' : isToday ? ' ← pending (сегодня)' : ' ← pending'}`
      );
    });

  } catch (error) {
    console.error(`[WORKER] ❌ Ошибка checkOnePayment:`, error.message);
    console.error(error.stack);
  }
}

// ─── Рассылка просрочек ───────────────────────────────────────────────────────

async function processOverdueNotifications() {
  const pending = await getPendingOverdueNotifications();
  if (pending.length === 0) return;

  console.log(`\n⚙️  [WORKER] Просрочки pending: ${pending.length}`);

  for (const notification of pending) {
    await processOneOverdue(notification);
  }
}

async function processOneOverdue(notification) {
  const { id, cycle_id, contact_id, day_number } = notification;

  console.log(`\n[WORKER] Просрочка id=${id}, cycle_id=${cycle_id}, день=${day_number}`);

  try {
    // Получаем цикл
    const cycle = await getOverdueCycle(cycle_id);
    if (!cycle) {
      console.log(`[WORKER] ❌ Цикл ${cycle_id} не найден`);
      await updateOverdueNotificationStatus(id, 'skipped', 'Цикл не найден');
      return;
    }

    // Проверяем статус цикла
    if (cycle.cycle_status !== 'active') {
      console.log(`[WORKER] ℹ️ Цикл статус="${cycle.cycle_status}" — пропускаем`);
      await updateOverdueNotificationStatus(id, 'skipped', `Цикл ${cycle.cycle_status}`);
      return;
    }

    // Проверяем статус клиента
    const clientStatus = await getOverdueClientStatusBot(contact_id);
    if (clientStatus === 'stopped') {
      console.log(`[WORKER] ℹ️ Клиент на паузе — пропускаем`);
      await updateOverdueNotificationStatus(id, 'skipped', 'Клиент на паузе');
      return;
    }

    // Актуальная проверка оплаты
    const currentPaid = await getConfirmedPaidAmount(cycle.deal_id);
    const cumulativeNeeded = parseFloat(cycle.paid_amount_at_start) +
      parseFloat(cycle.overdue_amount);

    console.log(`[WORKER]   Нужно: ${cumulativeNeeded}, оплачено: ${currentPaid}`);

    if (currentPaid >= cumulativeNeeded) {
      // Оплатил — закрываем цикл
      console.log(`[WORKER] ✅ Просрочка погашена! Закрываем цикл`);
      await updateOverdueCycleStatus(cycle_id, 'resolved');
      await updateOverdueClientStatusBot(contact_id, 'active');
      await updateOverdueNotificationStatus(id, 'skipped', 'Оплачено');
      return;
    }

    // Ищем пользователя MAX
    const maxUser = await findUserByContactId(contact_id);
    if (!maxUser) {
      console.log(`[WORKER] ❌ Пользователь MAX не найден`);
      await updateOverdueNotificationStatus(id, 'error', 'Пользователь MAX не найден');
      return;
    }

    // ФИО клиента
    const clientName = await getContactNameBot(contact_id);
    const overdueAmountStr = parseFloat(cycle.overdue_amount).toLocaleString('ru-RU');

    // Формируем текст
    const messageFn = OVERDUE_MESSAGES[day_number];
    const text = messageFn
      ? messageFn(
          clientName,
          cycle.contract_number || '—',
          cycle.contract_date || '—',
          overdueAmountStr,
        )
      : `Уведомление о просрочке по договору № ${cycle.contract_number || '—'} (день ${day_number})`;

    // Отправляем
    const sent = await sendMaxMessage(maxUser.max_user_id, text);

    if (sent) {
      await updateOverdueNotificationStatus(id, 'sent');
      console.log(`✅ [WORKER] День ${day_number} отправлен → user_id=${maxUser.max_user_id}`);

      // День 37 — закрываем цикл, клиент на стопе
      if (day_number === 37) {
        console.log(`[WORKER] 🔴 День 37 — дело остановлено`);
        await updateOverdueCycleStatus(cycle_id, 'completed');
        await updateOverdueClientStatusBot(contact_id, 'closed');
      }
    } else {
      await updateOverdueNotificationStatus(id, 'error', 'Ошибка отправки в MAX');
    }

  } catch (error) {
    console.error(`[WORKER] ❌ Ошибка processOneOverdue:`, error.message);
    await updateOverdueNotificationStatus(id, 'error', error.message);
  }
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
  console.log(`\n[WORKER] id=${id}, type=${type}, deal_id=${deal_id}`);

  try {
    const maxUser = await findMaxUser(contact_id, lead_id);
    if (!maxUser) {
      // Не error, а просто пропускаем — попробуем в следующий раз
      console.log(`[WORKER] ℹ️ Пользователь не найден — пропускаем до регистрации`);
      return; // ← не меняем статус, остаётся pending
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
  const { id, invoice_id, deal_id, contact_id, lead_id, amount, currency, notification_type, deal_type_id } = notification;

  try {
    const maxUser = await findMaxUser(contact_id, lead_id);
    if (!maxUser) {
      console.log(`[WORKER] ℹ️ Пользователь не найден — пропускаем до регистрации`);
      return; // ← остаётся pending
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

  try {
    const maxUser = await findMaxUser(contact_id, lead_id);
    if (!maxUser) {
      console.log(`[WORKER] ℹ️ Пользователь не найден — пропускаем до регистрации`);
      return; // ← остаётся pending
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

/**
 * Получить подтверждённую сумму оплат из Б24
 * Только счета со статусом DT31_2:P
 */
async function getConfirmedPaidAmount(dealId) {
  try {
    console.log(`[B24] getConfirmedPaidAmount deal_id=${dealId}`);
    const response = await axios.post(
      `${BITRIX_WEBHOOK}/crm.item.list`,
      {
        entityTypeId: 31,
        filter: { parentId2: dealId },
        select: ['id', 'stageId', 'opportunity'],
      }
    );

    const items = response.data?.result?.items || [];
    const paid = items
      .filter(inv => inv.stageId === 'DT31_2:P')
      .reduce((sum, inv) => sum + parseFloat(inv.opportunity || 0), 0);

    console.log(`[B24] Подтверждённых оплат: ${paid} руб (счетов: ${items.length})`);
    return paid;
  } catch (error) {
    console.error('[B24] Ошибка getConfirmedPaidAmount:', error.message);
    return 0;
  }
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

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function addDaysToDate(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

async function getContactNameFromB24(contactId) {
  try {
    const response = await axios.post(
      `${BITRIX_WEBHOOK}/crm.contact.get`,
      { id: contactId }
    );
    const c = response.data?.result;
    if (!c) return 'Клиент';
    const name = [c.LAST_NAME, c.NAME, c.SECOND_NAME]
      .filter(Boolean).join(' ').trim();
    return name || 'Клиент';
  } catch (error) {
    console.error('[B24] Ошибка getContactNameFromB24:', error.message);
    return 'Клиент';
  }
}

async function getContractDateFromB24(dealId) {
  try {
    const response = await axios.post(
      `${BITRIX_WEBHOOK}/crm.documentgenerator.document.list`,
      {
        select: ['*'],
        order: { id: 'DESC' },
        filter: { entityTypeId: 2, entityId: dealId },
        start: 0,
      }
    );
    const documents = response.data?.result?.documents || [];
    if (documents.length === 0) return '—';

    const doc = documents[0];
    // createTime: "2026-03-20T13:51:45+03:00"
    return doc.createTime
      ? new Date(doc.createTime).toLocaleDateString('ru-RU')
      : '—';
  } catch (error) {
    console.error('[B24] Ошибка getContractDateFromB24:', error.message);
    return '—';
  }
}