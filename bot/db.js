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

export default pool;