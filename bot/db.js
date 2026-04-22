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

// ─── Методы для пользователей ─────────────────────────────────────────────────

export async function findUserByMaxId(maxUserId) {
  console.log(`\n[DB] findUserByMaxId: поиск пользователя max_user_id=${maxUserId}`);
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE max_user_id = ?',
      [maxUserId]
    );
    console.log(`[DB] findUserByMaxId: найдено записей=${rows.length}`);
    if (rows[0]) {
      console.log(`[DB] findUserByMaxId: запись=`, JSON.stringify(rows[0], null, 2));
    }
    return rows[0] || null;
  } catch (error) {
    console.error('[DB] Ошибка findUserByMaxId:', error.message);
    return null;
  }
}

export async function saveUser({ maxUserId, bitrixContactId, bitrixLeadId, phone }) {
  console.log(`\n[DB] saveUser: сохранение пользователя`);
  console.log(`[DB] saveUser: данные=`, { maxUserId, bitrixContactId, bitrixLeadId, phone });

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
    console.log(`[DB] saveUser: результат=`, {
      affectedRows: result.affectedRows,
      insertId: result.insertId,
    });
    console.log(`✅ [DB] Пользователь успешно сохранён`);
    return result;
  } catch (error) {
    console.error('[DB] Ошибка saveUser:', error.message);
    throw error;
  }
}

// ─── Методы для уведомлений ───────────────────────────────────────────────────

/**
 * Получить все pending уведомления
 */
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

/**
 * Найти пользователя MAX по contact_id
 */
export async function findUserByContactId(contactId) {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE bitrix_contact_id = ?',
      [contactId]
    );
    return rows[0] || null;
  } catch (error) {
    console.error('[DB] Ошибка findUserByContactId:', error.message);
    return null;
  }
}

/**
 * Найти пользователя MAX по lead_id
 */
export async function findUserByLeadId(leadId) {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE bitrix_lead_id = ?',
      [leadId]
    );
    return rows[0] || null;
  } catch (error) {
    console.error('[DB] Ошибка findUserByLeadId:', error.message);
    return null;
  }
}

/**
 * Обновить статус уведомления
 */
export async function updateNotificationStatus(id, status, errorMessage = null) {
  try {
    await pool.execute(
      `UPDATE notifications 
       SET status = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, errorMessage, id]
    );
    console.log(`[DB] Уведомление id=${id} → статус="${status}"`);
  } catch (error) {
    console.error('[DB] Ошибка updateNotificationStatus:', error.message);
  }
}

export default pool;