import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

console.log('[DB] Инициализация подключения...');
console.log('[DB] Config:', {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD ? '***' : '❌ НЕ ЗАДАН',
});

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  connectTimeout: 10000,
});

try {
  const conn = await pool.getConnection();
  console.log('✅ [DB] Подключение к MySQL успешно!');
  conn.release();
} catch (error) {
  console.error('❌ [DB] Ошибка подключения к MySQL:', error.message);
}

// ─── Пользователи ─────────────────────────────────────────────────────────────

export async function findUserByMaxId(maxUserId) {
  console.log(`\n[DB] findUserByMaxId: max_user_id=${maxUserId}`);
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE max_user_id = ?',
      [maxUserId]
    );
    console.log(`[DB] findUserByMaxId: найдено=${rows.length}`);
    if (rows[0]) {
      console.log(`[DB] findUserByMaxId:`, JSON.stringify(rows[0], null, 2));
    }
    return rows[0] || null;
  } catch (error) {
    console.error('[DB] Ошибка findUserByMaxId:', error.message);
    return null;
  }
}

export async function saveUser({ maxUserId, bitrixContactId, bitrixLeadId, phone }) {
  console.log(`\n[DB] saveUser:`, { maxUserId, bitrixContactId, bitrixLeadId, phone });
  try {
    const [result] = await pool.execute(
      `INSERT INTO users (max_user_id, bitrix_contact_id, bitrix_lead_id, phone)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         bitrix_contact_id = VALUES(bitrix_contact_id),
         bitrix_lead_id = VALUES(bitrix_lead_id),
         phone = VALUES(phone),
         updated_at = CURRENT_TIMESTAMP`,
      [maxUserId, bitrixContactId || null, bitrixLeadId || null, phone]
    );
    console.log(`✅ [DB] Пользователь сохранён:`, {
      affectedRows: result.affectedRows,
      insertId: result.insertId,
    });
    return result;
  } catch (error) {
    console.error('[DB] Ошибка saveUser:', error.message);
    throw error;
  }
}

export async function findUserByContactId(contactId) {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE bitrix_contact_id = ?',
      [contactId]
    );
    console.log(`[DB] findUserByContactId=${contactId}: найдено=${rows.length}`);
    return rows[0] || null;
  } catch (error) {
    console.error('[DB] Ошибка findUserByContactId:', error.message);
    return null;
  }
}

export async function findUserByLeadId(leadId) {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE bitrix_lead_id = ?',
      [leadId]
    );
    console.log(`[DB] findUserByLeadId=${leadId}: найдено=${rows.length}`);
    return rows[0] || null;
  } catch (error) {
    console.error('[DB] Ошибка findUserByLeadId:', error.message);
    return null;
  }
}

// ─── Уведомления по договорам ─────────────────────────────────────────────────

export async function getPendingNotifications() {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM notifications 
       WHERE status = 'pending' 
       ORDER BY created_at ASC`
    );
    return rows;
  } catch (error) {
    console.error('[DB] Ошибка getPendingNotifications:', error.message);
    return [];
  }
}

export async function updateNotificationStatus(id, status, errorMessage = null) {
  try {
    await pool.execute(
      `UPDATE notifications 
       SET status = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, errorMessage, id]
    );
    console.log(`[DB] notifications id=${id} → ${status}`);
  } catch (error) {
    console.error('[DB] Ошибка updateNotificationStatus:', error.message);
  }
}

// ─── Уведомления по счетам ────────────────────────────────────────────────────

export async function getPendingInvoiceNotifications() {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM invoice_notifications 
       WHERE status = 'pending' 
       ORDER BY created_at ASC`
    );
    return rows;
  } catch (error) {
    console.error('[DB] Ошибка getPendingInvoiceNotifications:', error.message);
    return [];
  }
}

export async function updateInvoiceNotificationStatus(id, status, errorMessage = null) {
  try {
    await pool.execute(
      `UPDATE invoice_notifications 
       SET status = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, errorMessage, id]
    );
    console.log(`[DB] invoice_notifications id=${id} → ${status}`);
  } catch (error) {
    console.error('[DB] Ошибка updateInvoiceNotificationStatus:', error.message);
  }
}

// Добавить к существующим методам в db.js бота:

export async function getPendingStageNotifications() {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM deal_stage_notifications 
       WHERE status = 'pending' 
       ORDER BY created_at ASC`
    );
    return rows;
  } catch (error) {
    console.error('[DB] Ошибка getPendingStageNotifications:', error.message);
    return [];
  }
}

export async function updateStageNotificationStatus(id, status, errorMessage = null) {
  try {
    await pool.execute(
      `UPDATE deal_stage_notifications 
       SET status = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, errorMessage, id]
    );
    console.log(`[DB] deal_stage_notifications id=${id} → ${status}`);
  } catch (error) {
    console.error('[DB] Ошибка updateStageNotificationStatus:', error.message);
  }
}

/**
 * Получить платежи у которых наступила дата проверки
 */
export async function getPendingPaymentChecks() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [rows] = await pool.execute(
      `SELECT * FROM payment_schedule
       WHERE status = 'pending'
         AND check_date <= ?
       ORDER BY check_date ASC, payment_number ASC`,
      [today]
    );
    return rows;
  } catch (error) {
    console.error('[DB] Ошибка getPendingPaymentChecks:', error.message);
    return [];
  }
}

export async function updatePaymentStatus(id, status) {
  try {
    await pool.execute(
      `UPDATE payment_schedule
       SET status = ?, checked_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, id]
    );
    console.log(`[DB] payment_schedule id=${id} → ${status}`);
  } catch (error) {
    console.error('[DB] Ошибка updatePaymentStatus:', error.message);
  }
}

export async function getActiveOverdueCycleBot(dealId) {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM overdue_cycles
       WHERE deal_id = ? AND cycle_status = 'active'
       LIMIT 1`,
      [dealId]
    );
    return rows[0] || null;
  } catch (error) {
    console.error('[DB] Ошибка getActiveOverdueCycleBot:', error.message);
    return null;
  }
}

export async function getOverdueClientStatusBot(contactId) {
  try {
    const [rows] = await pool.execute(
      'SELECT client_status FROM overdue_clients WHERE contact_id = ?',
      [contactId]
    );
    return rows[0]?.client_status || null;
  } catch (error) {
    console.error('[DB] Ошибка getOverdueClientStatusBot:', error.message);
    return null;
  }
}

export async function getOverdueClientNameBot(contactId) {
  try {
    const [rows] = await pool.execute(
      'SELECT contact_name FROM overdue_clients WHERE contact_id = ?',
      [contactId]
    );
    return rows[0]?.contact_name || 'Клиент';
  } catch (error) {
    console.error('[DB] Ошибка getOverdueClientNameBot:', error.message);
    return 'Клиент';
  }
}

export async function ensureOverdueClient(contactId, contactName) {
  try {
    const [rows] = await pool.execute(
      'SELECT id FROM overdue_clients WHERE contact_id = ?',
      [contactId]
    );

    if (rows.length > 0) return rows[0];

    // Берём max_user_id из users
    const [userRows] = await pool.execute(
      'SELECT max_user_id FROM users WHERE bitrix_contact_id = ?',
      [contactId]
    );
    const maxUserId = userRows[0]?.max_user_id || null;

    const [result] = await pool.execute(
      `INSERT INTO overdue_clients (contact_id, max_user_id, contact_name, client_status)
       VALUES (?, ?, ?, 'active')`,
      [contactId, maxUserId, contactName || null]
    );

    return { id: result.insertId };
  } catch (error) {
    console.error('[DB] Ошибка ensureOverdueClient:', error.message);
  }
}

export async function updateOverdueClientStatusBot(contactId, status) {
  try {
    const extra = status === 'closed'
      ? ', closed_at = CURRENT_TIMESTAMP'
      : status === 'active'
        ? ', closed_at = NULL'
        : '';

    await pool.execute(
      `UPDATE overdue_clients
       SET client_status = ? ${extra}, updated_at = CURRENT_TIMESTAMP
       WHERE contact_id = ?`,
      [status, contactId]
    );
  } catch (error) {
    console.error('[DB] Ошибка updateOverdueClientStatusBot:', error.message);
  }
}

export async function createOverdueCycleBot({
  contactId, dealId, dealTypeId, dealTitle, contractNumber,
  overduePaymentDate, overdueAmount, paidAmountAtStart,
  totalSchedule, overdueStartDate,
}) {
  try {
    const [result] = await pool.execute(
      `INSERT INTO overdue_cycles
        (contact_id, deal_id, deal_type_id, deal_title, contract_number,
         overdue_payment_date, overdue_amount, paid_amount_at_start,
         total_schedule, overdue_start_date, cycle_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [
        contactId, dealId, dealTypeId || null, dealTitle || null,
        contractNumber || null, overduePaymentDate, overdueAmount,
        paidAmountAtStart || 0, totalSchedule || 0, overdueStartDate,
      ]
    );
    console.log(`✅ [DB] overdue_cycles создан: id=${result.insertId}`);
    return result.insertId;
  } catch (error) {
    console.error('[DB] Ошибка createOverdueCycleBot:', error.message);
    throw error;
  }
}

export async function createOverdueNotificationsBot(notifications) {
  try {
    for (const n of notifications) {
      await pool.execute(
        `INSERT INTO overdue_notifications
          (cycle_id, contact_id, day_number, status, scheduled_date)
         VALUES (?, ?, ?, 'pending', ?)`,
        [n.cycleId, n.contactId, n.dayNumber, n.scheduledDate]
      );
    }
    console.log(`✅ [DB] overdue_notifications: ${notifications.length} записей`);
  } catch (error) {
    console.error('[DB] Ошибка createOverdueNotificationsBot:', error.message);
    throw error;
  }
}

export async function getContactNameBot(contactId) {
  try {
    const [rows] = await pool.execute(
      'SELECT contact_name FROM overdue_clients WHERE contact_id = ?',
      [contactId]
    );
    return rows[0]?.contact_name || 'Клиент';
  } catch (error) {
    return 'Клиент';
  }
}

export default pool;