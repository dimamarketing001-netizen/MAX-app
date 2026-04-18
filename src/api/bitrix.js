import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const B24_URL = process.env.B24_WEBHOOK_URL;

/**
 * Получить контакт из Б24 по ID контакта
 */
export async function getContact(contactId) {
    const response = await axios.get(`${B24_URL}/crm.contact.get`, {
        params: { id: contactId }
    });
    return response.data.result;
}

/**
 * Получить сделки контакта из Б24
 */
export async function getDealsByContact(contactId) {
    const response = await axios.get(`${B24_URL}/crm.deal.list`, {
        params: {
            filter: { CONTACT_ID: contactId },
            select: ['ID', 'TITLE', 'STAGE_ID', 'OPPORTUNITY', 'CURRENCY_ID', 'CLOSEDATE', 'DATE_CREATE']
        }
    });
    return response.data.result;
}

/**
 * Получить стадии сделок (для расшифровки STAGE_ID)
 */
export async function getDealStages() {
    const response = await axios.get(`${B24_URL}/crm.dealcategory.stage.list`, {
        params: { id: 0 } // 0 = воронка по умолчанию
    });
    return response.data.result;
}

/**
 * Получить счета/платежи по сделке из Б24
 * Используем смарт-процессы или задачи — здесь используем crm.invoice или активности
 * Если у вас обычные счета:
 */
export async function getInvoicesByDeal(dealId) {
    try {
        const response = await axios.get(`${B24_URL}/crm.item.list`, {
            params: {
                entityTypeId: 31, // 31 = Счета в новом формате
                filter: { parentId2: dealId },
                select: ['id', 'title', 'opportunity', 'stageId', 'createdTime']
            }
        });
        return response.data.result?.items || [];
    } catch {
        return [];
    }
}

/**
 * Получить телефон контакта из структуры Б24
 */
export function extractPhone(contact) {
    const phones = contact?.PHONE || [];
    return phones.length > 0 ? phones[0].VALUE : null;
}

/**
 * Получить email контакта из структуры Б24
 */
export function extractEmail(contact) {
    const emails = contact?.EMAIL || [];
    return emails.length > 0 ? emails[0].VALUE : null;
}

/**
 * Расшифровать стадию сделки на человекочитаемый вид
 */
export function mapStageToStatus(stageId) {
    const stageMap = {
        'NEW': 'Новая',
        'PREPARATION': 'В подготовке',
        'EXECUTING': 'В производстве',
        'FINAL_INVOICE': 'Финальный счёт',
        'WON': 'Завершено',
        'LOSE': 'Провалено',
        'APOLOGY': 'Анализ',
    };
    return stageMap[stageId] || stageId;
}