import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const BITRIX_WEBHOOK = process.env.BITRIX_WEBHOOK;

/**
 * Нормализация телефона — убираем всё кроме цифр
 */
function normalizePhone(phone) {
  return phone.replace(/\D/g, '');
}

/**
 * Выполняет POST запрос к Битрикс24
 */
async function bitrixRequest(method, params) {
  console.log(`\n   [BITRIX] POST ${method}`);
  console.log(`   [BITRIX] Params:`, JSON.stringify(params, null, 2));

  const response = await axios.post(
    `${BITRIX_WEBHOOK}/${method}`,
    params
  );

  console.log(`   [BITRIX] Response:`, JSON.stringify(response.data, null, 2));
  return response.data;
}

/**
 * Главная функция поиска:
 * 1. Ищем лид по телефону
 * 2. Если лид найден — смотрим есть ли контакт у лида
 * 3. Если лид не найден — ищем контакт по телефону
 * 4. Если ничего не найдено — возвращаем null
 */
export async function findByPhone(rawPhone) {
  const phone = normalizePhone(rawPhone);
  console.log(`\n🔍 [BITRIX] Начало поиска`);
  console.log(`   Исходный номер: "${rawPhone}"`);
  console.log(`   Нормализованный: "${phone}"`);

  // ШАГ 1: Ищем лид по телефону
  console.log('\n📋 [BITRIX] Шаг 1: Поиск лида по телефону...');
  const lead = await searchLeadByPhone(phone);

  if (lead) {
    console.log(`✅ [BITRIX] Лид найден: ID=${lead.leadId}, CONTACT_ID=${lead.contactId}`);

    let contactId = null;
    let contactName = null;

    if (lead.contactId) {
      console.log(`\n👤 [BITRIX] Шаг 2: У лида есть CONTACT_ID=${lead.contactId}, получаем контакт...`);
      const contact = await getContactById(lead.contactId);

      if (contact) {
        contactId = contact.contactId;
        contactName = contact.name;
        console.log(`✅ [BITRIX] Контакт найден: ID=${contactId}, Name="${contactName}"`);
      } else {
        console.log(`⚠️ [BITRIX] Контакт с ID=${lead.contactId} не найден`);
      }
    } else {
      console.log(`ℹ️ [BITRIX] У лида нет привязанного контакта`);
    }

    const result = {
      leadId: lead.leadId,
      contactId: contactId,
      name: contactName || lead.name,
      source: 'lead',
    };
    console.log(`\n✅ [BITRIX] Итог:`, JSON.stringify(result, null, 2));
    return result;
  }

  // ШАГ 2: Лид не найден — ищем контакт
  console.log('\n📋 [BITRIX] Шаг 2: Лид не найден, ищем контакт по телефону...');
  const contact = await searchContactByPhone(phone);

  if (contact) {
    const result = {
      leadId: null,
      contactId: contact.contactId,
      name: contact.name,
      source: 'contact',
    };
    console.log(`✅ [BITRIX] Контакт найден:`, JSON.stringify(result, null, 2));
    return result;
  }

  console.log('❌ [BITRIX] Ничего не найдено');
  return null;
}

/**
 * Поиск лида по телефону
 * Пробуем разные варианты номера
 */
async function searchLeadByPhone(phone) {
  // Варианты номера для поиска
  const phoneVariants = getPhoneVariants(phone);
  console.log(`   [BITRIX] Варианты номера для поиска лида:`, phoneVariants);

  for (const variant of phoneVariants) {
    console.log(`\n   [BITRIX] Пробуем лид с номером: "${variant}"`);

    try {
      // Используем crm.item.list с entityTypeId=1 (лид) — как в документации
      const data = await bitrixRequest('crm.item.list', {
        entityTypeId: 1,
        filter: { PHONE: variant },
        select: ['id', 'name', 'contactId', 'phone'],
        order: { createdTime: 'DESC' },
      });

      const items = data?.result?.items;
      if (items && items.length > 0) {
        const lead = items[0];
        console.log(`   [BITRIX] → Лид найден через crm.item.list: ID=${lead.id}`);
        return {
          leadId: parseInt(lead.id),
          contactId: lead.contactId ? parseInt(lead.contactId) : null,
          name: lead.name || '',
        };
      }
    } catch (error) {
      console.error(`   [BITRIX] crm.item.list ошибка:`, error.message);
    }

    // Пробуем через crm.lead.list
    try {
      const data = await bitrixRequest('crm.lead.list', {
        filter: { PHONE: variant },
        select: ['ID', 'NAME', 'CONTACT_ID', 'PHONE'],
        order: { DATE_CREATE: 'DESC' },
      });

      const leads = data?.result;
      if (leads && leads.length > 0) {
        const lead = leads[0];
        console.log(`   [BITRIX] → Лид найден через crm.lead.list: ID=${lead.ID}`);
        return {
          leadId: parseInt(lead.ID),
          contactId: lead.CONTACT_ID ? parseInt(lead.CONTACT_ID) : null,
          name: lead.NAME || '',
        };
      }
    } catch (error) {
      console.error(`   [BITRIX] crm.lead.list ошибка:`, error.message);
    }
  }

  console.log(`   [BITRIX] → Лиды не найдены ни по одному варианту номера`);
  return null;
}

/**
 * Поиск контакта по телефону
 * Пробуем разные варианты номера
 */
async function searchContactByPhone(phone) {
  const phoneVariants = getPhoneVariants(phone);
  console.log(`   [BITRIX] Варианты номера для поиска контакта:`, phoneVariants);

  for (const variant of phoneVariants) {
    console.log(`\n   [BITRIX] Пробуем контакт с номером: "${variant}"`);

    try {
      const data = await bitrixRequest('crm.contact.list', {
        filter: { PHONE: variant },
        select: ['ID', 'NAME', 'LAST_NAME', 'SECOND_NAME', 'PHONE'],
        order: { LAST_NAME: 'ASC', NAME: 'ASC' },
      });

      const contacts = data?.result;
      if (contacts && contacts.length > 0) {
        const contact = contacts[0];
        console.log(`   [BITRIX] → Контакт найден: ID=${contact.ID}`);

        const name = [
          contact.LAST_NAME || '',
          contact.NAME || '',
          contact.SECOND_NAME || '',
        ].filter(Boolean).join(' ').trim();

        return {
          contactId: parseInt(contact.ID),
          name: name,
        };
      }
    } catch (error) {
      console.error(`   [BITRIX] crm.contact.list ошибка:`, error.message);
    }
  }

  console.log(`   [BITRIX] → Контакты не найдены ни по одному варианту номера`);
  return null;
}

/**
 * Получить контакт по ID
 */
async function getContactById(contactId) {
  try {
    const data = await bitrixRequest('crm.contact.get', {
      id: contactId,
    });

    const contact = data?.result;
    if (!contact) return null;

    const name = [
      contact.LAST_NAME || '',
      contact.NAME || '',
      contact.SECOND_NAME || '',
    ].filter(Boolean).join(' ').trim();

    return {
      contactId: parseInt(contact.ID),
      name: name,
    };
  } catch (error) {
    console.error(`   [BITRIX] crm.contact.get ошибка:`, error.message);
    return null;
  }
}

/**
 * Генерируем варианты номера телефона для поиска
 * Битрикс хранит телефоны в разных форматах
 */
function getPhoneVariants(phone) {
  // phone уже нормализован (только цифры)
  const variants = new Set();

  // Исходный (только цифры): 79655443802
  variants.add(phone);

  // С плюсом: +79655443802
  variants.add('+' + phone);

  // Если начинается с 7 — добавляем с 8: 89655443802
  if (phone.startsWith('7') && phone.length === 11) {
    variants.add('8' + phone.slice(1));
  }

  // Если начинается с 8 — добавляем с 7: 79655443802
  if (phone.startsWith('8') && phone.length === 11) {
    variants.add('7' + phone.slice(1));
    variants.add('+7' + phone.slice(1));
  }

  // Последние 10 цифр (без кода страны): 9655443802
  if (phone.length >= 10) {
    variants.add(phone.slice(-10));
  }

  return Array.from(variants);
}

/**
 * Открыть или получить существующую сессию открытой линии
 */
export async function openLineSession(userCode) {
  try {
    console.log('[BITRIX] imopenlines.session.open →', userCode);

    const response = await axios.post(
      `${BITRIX_WEBHOOK}/imopenlines.session.open`,
      {
        USER_CODE: userCode,
        CONFIG_ID: process.env.OPENLINE_ID, // ID линии
      }
    );

    console.log('[BITRIX] session.open result:', response.data?.result);
    return response.data?.result;

  } catch (error) {
    console.error('[BITRIX] session.open error:',
      error.response?.data || error.message
    );
    return null;
  }
}

/**
 * Отправить сообщение в открытую линию
 */
export async function sendMessageToOpenLine(chatId, text) {
  try {
    console.log('[BITRIX] imopenlines.crm.message.add → CHAT_ID=', chatId);

    const response = await axios.post(
      `${BITRIX_WEBHOOK}/imopenlines.crm.message.add`,
      {
        CHAT_ID: chatId,
        MESSAGE: text,
      }
    );

    console.log('[BITRIX] message.add result:', response.data?.result);
    return response.data?.result;

  } catch (error) {
    console.error('[BITRIX] message.add error:',
      error.response?.data || error.message
    );
    return null;
  }
}

/**
 * Главная функция отправки сообщения в ОЛ
 */
export async function sendToBitrixOpenLine({
  maxUserId,
  text
}) {
  const userCode = `max_${maxUserId}`;

  const session = await openLineSession(userCode);

  if (!session?.CHAT_ID) {
    console.error('[BITRIX] Не удалось получить CHAT_ID');
    return false;
  }

  await sendMessageToOpenLine(session.CHAT_ID, text);

  return true;
}