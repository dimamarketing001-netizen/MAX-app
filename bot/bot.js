import { Bot, Keyboard } from '@maxhub/max-bot-api';
import dotenv from 'dotenv';
import { findUserByMaxId, saveUser } from './db.js';
import { findByPhone } from './bitrix.js';

dotenv.config();

console.log('[BOT] Инициализация...');
console.log('[BOT] BOT_TOKEN:', process.env.BOT_TOKEN ? '***установлен***' : '❌ НЕ ЗАДАН');
console.log('[BOT] BITRIX_WEBHOOK:', process.env.BITRIX_WEBHOOK || '❌ НЕ ЗАДАН');

const bot = new Bot(process.env.BOT_TOKEN);

const userStates = new Map();

const STATE = {
  IDLE: 'idle',
  WAITING_PHONE: 'waiting_phone',
  REGISTERED: 'registered',
};

function getContactKeyboard() {
  return Keyboard.inlineKeyboard([
    [Keyboard.button.requestContact('📱 Поделиться номером телефона')],
  ]);
}

async function askForPhone(ctx) {
  const userId = getUserId(ctx);
  console.log(`\n[BOT] askForPhone: запрос телефона у userId=${userId}`);
  userStates.set(userId, STATE.WAITING_PHONE);

  await ctx.reply(
    '👋 Добро пожаловать!\n\n' +
    'Для начала работы мне нужен ваш номер телефона.\n\n' +
    'Нажмите кнопку ниже, чтобы поделиться номером, ' +
    'или введите его вручную в формате **+79991234567**',
    {
      format: 'markdown',
      attachments: [getContactKeyboard()],
    }
  );
}

async function handlePhone(ctx, phone, userId) {
  console.log(`\n[BOT] handlePhone: userId=${userId}, phone="${phone}"`);
  phone = phone.trim();

  const phoneRegex = /^[\+\d][\d\s\-\(\)]{6,20}$/;
  const isValid = phoneRegex.test(phone);
  console.log(`[BOT] handlePhone: валидация номера="${phone}" → ${isValid ? '✅ ОК' : '❌ Неверный формат'}`);

  if (!isValid) {
    await ctx.reply(
      '❌ Некорректный формат номера телефона.\n\n' +
      'Я не смог найти ваш номер телефона в базе, пожалуйста проверьте телефон ' +
      'и укажите его вручную в формате **+79999999999**',
      {
        format: 'markdown',
        attachments: [getContactKeyboard()],
      }
    );
    userStates.set(userId, STATE.WAITING_PHONE);
    return;
  }

  await ctx.reply('🔍 Ищу вас в базе данных...');

  try {
    console.log(`[BOT] handlePhone: вызов findByPhone("${phone}")`);
    const bitrixData = await findByPhone(phone);
    console.log(`[BOT] handlePhone: результат findByPhone=`, JSON.stringify(bitrixData, null, 2));

    if (!bitrixData) {
      console.log(`[BOT] handlePhone: данные не найдены в Битрикс24, ждём новый номер`);
      await ctx.reply(
        'Я не смог найти ваш номер телефона в базе, пожалуйста проверьте телефон ' +
        'и укажите его вручную в формате **+79999999999**',
        {
          format: 'markdown',
          attachments: [getContactKeyboard()],
        }
      );
      userStates.set(userId, STATE.WAITING_PHONE);
      return;
    }

    console.log(`[BOT] handlePhone: сохраняем в БД...`);
    await saveUser({
      maxUserId: userId,
      bitrixContactId: bitrixData.contactId,
      bitrixLeadId: bitrixData.leadId,
      phone: phone,
    });

    userStates.set(userId, STATE.REGISTERED);

    const nameText = bitrixData.name ? `, **${bitrixData.name}**` : '';
    let successMsg =
      `✅ Отлично${nameText}! Вы успешно авторизованы.\n\n` +
      `📞 Телефон: ${phone}\n`;

    if (bitrixData.leadId && bitrixData.contactId) {
      successMsg += `📋 Лид: #${bitrixData.leadId}\n`;
      successMsg += `👤 Контакт: #${bitrixData.contactId}\n`;
    } else if (bitrixData.leadId && !bitrixData.contactId) {
      successMsg += `📋 Лид: #${bitrixData.leadId}\n`;
      successMsg += `ℹ️ Контакт не привязан\n`;
    } else if (!bitrixData.leadId && bitrixData.contactId) {
      successMsg += `👤 Контакт: #${bitrixData.contactId}\n`;
    }

    successMsg += '\nТеперь вы можете пользоваться всеми функциями бота!';

    await ctx.reply(successMsg, { format: 'markdown' });

    console.log(`✅ [BOT] Пользователь успешно зарегистрирован: MAX ID=${userId}`);

  } catch (error) {
    console.error('[BOT] ❌ Ошибка в handlePhone:');
    console.error('   message:', error.message);
    console.error('   stack:', error.stack);
    await ctx.reply(
      '⚠️ Произошла техническая ошибка. Попробуйте позже или введите номер ещё раз.',
      { attachments: [getContactKeyboard()] }
    );
    userStates.set(userId, STATE.WAITING_PHONE);
  }
}

function getUserId(ctx) {
  const id =
    ctx.update?.user?.user_id ||
    ctx.user?.user_id ||
    null;
  return id;
}

// ─── bot_started ──────────────────────────────────────────────────────────────
bot.on('bot_started', async (ctx) => {
  const userId = getUserId(ctx);
  console.log(`\n[BOT] ▶️  bot_started: userId=${userId}`);
  console.log(`[BOT] bot_started update:`, JSON.stringify(ctx.update, null, 2));

  if (!userId) {
    console.log('[BOT] bot_started: userId не определён, выходим');
    return;
  }

  const existingUser = await findUserByMaxId(userId);

  if (existingUser) {
    console.log(`[BOT] bot_started: пользователь уже есть в БД`);
    userStates.set(userId, STATE.REGISTERED);
    await ctx.reply(
      `👋 С возвращением! Вы уже авторизованы.\n📞 Телефон: ${existingUser.phone}`
    );
    return;
  }

  console.log(`[BOT] bot_started: новый пользователь, запрашиваем телефон`);
  await askForPhone(ctx);
});

// ─── /start ───────────────────────────────────────────────────────────────────
bot.command('start', async (ctx) => {
  const userId = getUserId(ctx);
  console.log(`\n[BOT] /start: userId=${userId}`);

  if (!userId) return;

  const existingUser = await findUserByMaxId(userId);

  if (existingUser) {
    console.log(`[BOT] /start: пользователь уже есть в БД`);
    userStates.set(userId, STATE.REGISTERED);
    await ctx.reply(
      `👋 С возвращением! Вы уже авторизованы.\n📞 Телефон: ${existingUser.phone}`
    );
    return;
  }

  await askForPhone(ctx);
});

// ─── Входящие сообщения ───────────────────────────────────────────────────────
bot.on('message_created', async (ctx) => {
  const userId = getUserId(ctx);

  console.log(`\n[BOT] 📨 message_created: userId=${userId}`);
  console.log(`[BOT] message_created полное сообщение:`, JSON.stringify(ctx.message, null, 2));

  if (!userId) {
    console.log('[BOT] message_created: userId не определён, выходим');
    return;
  }

  const message = ctx.message;

  // Проверяем контакт через кнопку
  const attachments = message?.body?.attachments;
  console.log(`[BOT] message_created: attachments=`, JSON.stringify(attachments, null, 2));

  const contactAttachment = attachments?.find((a) => a.type === 'contact');
  console.log(`[BOT] message_created: contactAttachment=`, JSON.stringify(contactAttachment, null, 2));

  if (contactAttachment) {
    const phone =
      contactAttachment.payload?.phone ||
      contactAttachment.phone ||
      null;

    console.log(`[BOT] message_created: телефон из контакта="${phone}"`);

    if (phone) {
      await handlePhone(ctx, phone, userId);
      return;
    }
  }

  const text = message?.body?.text?.trim();
  console.log(`[BOT] message_created: text="${text}"`);

  if (!text) {
    console.log('[BOT] message_created: текст пустой, выходим');
    return;
  }

  if (text.startsWith('/')) {
    console.log('[BOT] message_created: это команда, пропускаем');
    return;
  }

  const state = userStates.get(userId) || STATE.IDLE;
  console.log(`[BOT] message_created: состояние пользователя="${state}"`);

  if (state === STATE.WAITING_PHONE) {
    console.log(`[BOT] message_created: ожидаем телефон, обрабатываем...`);
    await handlePhone(ctx, text, userId);
    return;
  }

  if (state === STATE.REGISTERED) {
    console.log(`[BOT] message_created: пользователь зарегистрирован`);
    await ctx.reply(`Чем могу помочь?`);
    return;
  }

  console.log(`[BOT] message_created: неизвестное состояние, проверяем БД`);
  const existingUser = await findUserByMaxId(userId);

  if (existingUser) {
    console.log(`[BOT] message_created: пользователь найден в БД`);
    userStates.set(userId, STATE.REGISTERED);
    await ctx.reply('Чем могу помочь?');
  } else {
    console.log(`[BOT] message_created: пользователь не найден в БД, запрашиваем телефон`);
    await askForPhone(ctx);
  }
});

// ─── Callback ─────────────────────────────────────────────────────────────────
bot.on('message_callback', async (ctx) => {
  const userId = getUserId(ctx);
  console.log(`\n[BOT] 🔘 message_callback: userId=${userId}`);
  console.log(`[BOT] message_callback update:`, JSON.stringify(ctx.update, null, 2));
});

// ─── Запуск ───────────────────────────────────────────────────────────────────
console.log('\n🤖 [BOT] Запуск бота...');
bot.start();
console.log('✅ [BOT] Бот запущен и ожидает сообщений\n');