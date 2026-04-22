import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const BITRIX_WEBHOOK = process.env.BITRIX_WEBHOOK;

function normalizePhone(phone) {
  return phone.replace(/\D/g, '');
}

export async function findByPhone(rawPhone) {
  const phone = normalizePhone(rawPhone);
  console.log(`\n🔍 [BITRIX] Начало поиска`);
  console.log(`   Исходный номер: "${rawPhone}"`);
  console.log(`   Нормализованный: "${phone}"`);
  console.log(`   Webhook URL: ${BITRIX_WEBHOOK}`);

  // ШАГ 1: Ищем лид
  console.log('\n📋 [BITRIX] Шаг 1: Поиск лида по телефону...');
  const lead = await searchLead(phone);

  if (lead) {
    console.log(`✅ [BITRIX] Лид найден:`, JSON.stringify(lead, null, 2));

    let contactId = null;

    if (lead.contactId) {
      console.log(`\n👤 [BITRIX] Шаг 2: У лида есть CONTACT_ID=${lead.contactId}, ищем контакт...`);
      const contact = await getContactById(lead.contactId);

      if (contact) {
        contactId = contact.contactId;
        console.log(`✅ [BITRIX] Контакт найден:`, JSON.stringify(contact, null, 2));
      } else {
        console.log(`⚠️ [BITRIX] Контакт с ID=${lead.contactId} не найден`);
      }
    } else {
      console.log(`ℹ️ [BITRIX] У лида нет привязанного контакта`);
    }

    const result = {
      leadId: lead.leadId,
      contactId: contactId,
      name: lead.name,
      source: 'lead',
    };
    console.log(`\n✅ [BITRIX] Итоговый результат:`, JSON.stringify(result, null, 2));
    return result;
  }

  // ШАГ 2: Лид не найден — ищем контакт
  console.log('\n📋 [BITRIX] Шаг 2: Лид не найден, ищем контакт по телефону...');
  const contact = await searchContact(phone);

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

  console.log('❌ [BITRIX] Ничего не найдено ни в лидах, ни в контактах');
  return null;
}

async function searchLead(phone) {
  try {
    console.log(`   [BITRIX] Запрос crm.lead.list с PHONE="${phone}"`);

    const response = await axios.post(
      `${BITRIX_WEBHOOK}/crm.lead.list`,
      {
        filter: { 'PHONE': phone },
        select: ['ID', 'NAME', 'CONTACT_ID', 'PHONE'],
        order: { 'DATE_CREATE': 'DESC' },
      }
    );

    console.log(`   [BITRIX] Ответ crm.lead.list:`, JSON.stringify(response.data, null, 2));

    const leads = response.data?.result;

    if (!leads || leads.length === 0) {
      console.log('   [BITRIX] → Лиды не найдены');
      return null;
    }

    const lead = leads[0];
    console.log(`   [BITRIX] → Найдено лидов: ${leads.length}, берём первый ID=${lead.ID}`);

    return {
      leadId: parseInt(lead.ID),
      contactId: lead.CONTACT_ID ? parseInt(lead.CONTACT_ID) : null,
      name: lead.NAME || '',
    };
  } catch (error) {
    console.error('❌ [BITRIX] Ошибка запроса crm.lead.list:');
    console.error('   message:', error.message);
    console.error('   response:', JSON.stringify(error.response?.data, null, 2));
    return null;
  }
}

async function searchContact(phone) {
  try {
    console.log(`   [BITRIX] Запрос crm.contact.list с PHONE="${phone}"`);

    const response = await axios.post(
      `${BITRIX_WEBHOOK}/crm.contact.list`,
      {
        filter: { 'PHONE': phone },
        select: ['ID', 'NAME', 'LAST_NAME', 'PHONE'],
      }
    );

    console.log(`   [BITRIX] Ответ crm.contact.list:`, JSON.stringify(response.data, null, 2));

    const contacts = response.data?.result;

    if (!contacts || contacts.length === 0) {
      console.log('   [BITRIX] → Контакты не найдены');
      return null;
    }

    const contact = contacts[0];
    console.log(`   [BITRIX] → Найдено контактов: ${contacts.length}, берём первый ID=${contact.ID}`);

    return {
      contactId: parseInt(contact.ID),
      name: `${contact.NAME || ''} ${contact.LAST_NAME || ''}`.trim(),
    };
  } catch (error) {
    console.error('❌ [BITRIX] Ошибка запроса crm.contact.list:');
    console.error('   message:', error.message);
    console.error('   response:', JSON.stringify(error.response?.data, null, 2));
    return null;
  }
}

async function getContactById(contactId) {
  try {
    console.log(`   [BITRIX] Запрос crm.contact.get с ID=${contactId}`);

    const response = await axios.post(
      `${BITRIX_WEBHOOK}/crm.contact.get`,
      { id: contactId }
    );

    console.log(`   [BITRIX] Ответ crm.contact.get:`, JSON.stringify(response.data, null, 2));

    const contact = response.data?.result;
    if (!contact) return null;

    return {
      contactId: parseInt(contact.ID),
      name: `${contact.NAME || ''} ${contact.LAST_NAME || ''}`.trim(),
    };
  } catch (error) {
    console.error(`❌ [BITRIX] Ошибка запроса crm.contact.get ID=${contactId}:`);
    console.error('   message:', error.message);
    console.error('   response:', JSON.stringify(error.response?.data, null, 2));
    return null;
  }
}