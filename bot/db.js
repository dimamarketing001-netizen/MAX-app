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

// Проверяем подключение при старте
try {
  const conn = await pool.getConnection();
  console.log('✅ [DB] Подключение к MySQL успешно!');
  conn.release();
} catch (error) {
  console.error('❌ [DB] Ошибка подключения к MySQL:');
  console.error('   host:', process.env.DB_HOST);
  console.error('   port:', process.env.DB_PORT || 3306);
  console.error('   error:', error.message);
  console.error('\n💡 Возможные причины:');
  console.error('   1. Неверный хост или порт');
  console.error('   2. MySQL не принимает внешние подключения (bind-address)');
  console.error('   3. Файрвол блокирует порт 3306');
  console.error('   4. Неверный логин/пароль');
  console.error('   5. Пользователь не имеет прав для подключения с этого IP');
}

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
  console.log(`[DB] saveUser: данные=`, {
    maxUserId,
    bitrixContactId,
    bitrixLeadId,
    phone,
  });

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

export default pool;