import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const BITRIX_WEBHOOK = process.env.BITRIX_WEBHOOK;

function normalizePhone(phone) {
  return phone.replace(/\D/g, '');
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
  console.log(`🔍 Поиск по телефону: ${rawPhone} → нормализован: ${phone}`);

  // ШАГ 1: Ищем лид по телефону
  console.log('📋 Шаг 1: Ищем лид по телефону...');
  const lead = await searchLead(phone);

  if (lead) {
    console.log(`✅ Лид найден: ID=${lead.leadId}`);

    // ШАГ 2: Лид найден — ищем контакт у лида
    let contactId = null;

    if (lead.contactId) {
      console.log(`👤 Шаг 2: У лида есть CONTACT_ID=${lead.contactId}, проверяем контакт...`);
      const contact = await getContactById(lead.contactId);

      if (contact) {
        contactId = contact.contactId;
        console.log(`✅ Контакт найден: ID=${contactId}`);
      } else {
        console.log(`⚠️ Контакт с ID=${lead.contactId} не найден в CRM`);
      }
    } else {
      console.log('ℹ️ Шаг 2: У лида нет привязанного контакта');
    }

    return {
      leadId: lead.leadId,
      contactId: contactId,
      name: lead.name,
      source: 'lead',
    };
  }

  // ШАГ 3: Лид не найден — ищем контакт по телефону
  console.log('📋 Шаг 3: Лид не найден, ищем контакт по телефону...');
  const contact = await searchContact(phone);

  if (contact) {
    console.log(`✅ Контакт найден: ID=${contact.contactId}`);
    return {
      leadId: null,
      contactId: contact.contactId,
      name: contact.name,
      source: 'contact',
    };
  }

  // ШАГ 4: Ничего не найдено
  console.log('❌ Ничего не найдено ни в лидах, ни в контактах');
  return null;
}

/**
 * Поиск лида по телефону
 */
async function searchLead(phone) {
  try {
    const response = await axios.post(
      `${BITRIX_WEBHOOK}/crm.lead.list`,
      {
        filter: { 'PHONE': phone },
        select: ['ID', 'NAME', 'CONTACT_ID', 'PHONE'],
        order: { 'DATE_CREATE': 'DESC' },
      }
    );

    const leads = response.data?.result;

    if (!leads || leads.length === 0) {
      console.log('   → Лиды не найдены');
      return null;
    }

    const lead = leads[0];
    console.log(`   → Найдено лидов: ${leads.length}, берём первый ID=${lead.ID}`);

    return {
      leadId: parseInt(lead.ID),
      contactId: lead.CONTACT_ID ? parseInt(lead.CONTACT_ID) : null,
      name: lead.NAME || '',
    };
  } catch (error) {
    console.error('❌ Ошибка поиска лида:', error.message);
    return null;
  }
}

/**
 * Поиск контакта по телефону
 */
async function searchContact(phone) {
  try {
    const response = await axios.post(
      `${BITRIX_WEBHOOK}/crm.contact.list`,
      {
        filter: { 'PHONE': phone },
        select: ['ID', 'NAME', 'LAST_NAME', 'PHONE'],
      }
    );

    const contacts = response.data?.result;

    if (!contacts || contacts.length === 0) {
      console.log('   → Контакты не найдены');
      return null;
    }

    const contact = contacts[0];
    console.log(`   → Найдено контактов: ${contacts.length}, берём первый ID=${contact.ID}`);

    return {
      contactId: parseInt(contact.ID),
      name: `${contact.NAME || ''} ${contact.LAST_NAME || ''}`.trim(),
    };
  } catch (error) {
    console.error('❌ Ошибка поиска контакта:', error.message);
    return null;
  }
}

/**
 * Получить контакт по ID
 */
async function getContactById(contactId) {
  try {
    const response = await axios.post(
      `${BITRIX_WEBHOOK}/crm.contact.get`,
      { id: contactId }
    );

    const contact = response.data?.result;
    if (!contact) return null;

    return {
      contactId: parseInt(contact.ID),
      name: `${contact.NAME || ''} ${contact.LAST_NAME || ''}`.trim(),
    };
  } catch (error) {
    console.error(`❌ Ошибка получения контакта ID=${contactId}:`, error.message);
    return null;
  }
}