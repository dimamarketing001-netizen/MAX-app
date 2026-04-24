import { Bot, Keyboard } from '@maxhub/max-bot-api';
import dotenv from 'dotenv';
import { findUserByMaxId, saveUser } from './db.js';
import { findByPhone } from './bitrix.js';
import { startWorker } from './worker.js';

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
  WAITING_LAWYER_REQUEST: 'waiting_lawyer_request',
  WAITING_DOCUMENT: 'waiting_document',
};

// Кнопка отмены:
function getCancelKeyboard() {
  return Keyboard.inlineKeyboard([
    [Keyboard.button.callback('❌ Отмена', 'cancel')],
  ]);
}

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

  // ← ВОТ ЭТОТ ЛОГ ДОБАВИТЬ:
  console.log('[BOT] bot_started ПОЛНЫЙ update:', JSON.stringify(ctx.update, null, 2));

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

// ─── Извлечение телефона из контакта ─────────────────────────────────────────
function extractPhoneFromContact(contactAttachment) {
  console.log('[BOT] extractPhoneFromContact: начало извлечения телефона');

  // Вариант 1: прямое поле phone
  if (contactAttachment.payload?.phone) {
    console.log('[BOT] extractPhoneFromContact: найден payload.phone =', contactAttachment.payload.phone);
    return contactAttachment.payload.phone;
  }

  if (contactAttachment.phone) {
    console.log('[BOT] extractPhoneFromContact: найден phone =', contactAttachment.phone);
    return contactAttachment.phone;
  }

  // Вариант 2: парсим vCard
  const vcfInfo = contactAttachment.payload?.vcf_info;
  if (vcfInfo) {
    console.log('[BOT] extractPhoneFromContact: парсим vCard...');
    console.log('[BOT] vCard содержимое:\n', vcfInfo);

    // Ищем строки с TEL в vCard
    // Форматы: TEL:79991234567 или TEL;TYPE=cell:79991234567
    const lines = vcfInfo.split(/\r?\n/);
    for (const line of lines) {
      if (line.startsWith('TEL')) {
        // Берём всё после последнего ':'
        const parts = line.split(':');
        const phone = parts[parts.length - 1].trim();
        if (phone) {
          console.log('[BOT] extractPhoneFromContact: телефон из vCard =', phone);
          return '+' + phone.replace(/\D/g, '');
        }
      }
    }
    console.log('[BOT] extractPhoneFromContact: TEL не найден в vCard');
  }

  console.log('[BOT] extractPhoneFromContact: телефон не найден');
  return null;
}

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
    // Извлекаем телефон из vCard строки
    const phone = extractPhoneFromContact(contactAttachment);

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

  // ─── Служебные команды от мини-приложения ────────────────────────────────
  if (text === '__lawyer_request__') {
    const existingUser = await findUserByMaxId(userId);
    if (!existingUser) {
      await askForPhone(ctx);
      return;
    }
    userStates.set(userId, STATE.WAITING_LAWYER_REQUEST);
    await ctx.reply(
      '👨‍⚖️ *Связь с юристом*\n\n' +
      'Напишите ваш вопрос — юрист свяжется с вами в рабочее время (пн–пт, 9:00–18:00).',
      {
        format: 'markdown',
        attachments: [getCancelKeyboard()],
      }
    );
    return;
  }

  if (text === '__upload_document__') {
    const existingUser = await findUserByMaxId(userId);
    if (!existingUser) {
      await askForPhone(ctx);
      return;
    }
    userStates.set(userId, STATE.WAITING_DOCUMENT);
    await ctx.reply(
      '📎 *Загрузка документа*\n\n' +
      'Отправьте файл — менеджер рассмотрит его и свяжется с вами.',
      {
        format: 'markdown',
        attachments: [getCancelKeyboard()],
      }
    );
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

  if (state === STATE.WAITING_LAWYER_REQUEST) {
    if (text && !text.startsWith('/')) {
      userStates.set(userId, STATE.REGISTERED);
      await ctx.reply(
        '✅ Ваш запрос принят!\n\n' +
        'Юрист свяжется с вами в рабочее время (пн–пт, 9:00–18:00).'
      );
      console.log(`[BOT] Запрос юристу от userId=${userId}: "${text}"`);
    } else {
      await ctx.reply(
        '✏️ Напишите ваш вопрос текстом.',
        { attachments: [getCancelKeyboard()] }
      );
    }
    return;
  }

  if (state === STATE.WAITING_DOCUMENT) {
    const attachments = message?.body?.attachments;
    const hasFile = attachments?.some(a =>
      ['file', 'image', 'video', 'audio'].includes(a.type)
    );

    if (hasFile) {
      userStates.set(userId, STATE.REGISTERED);
      await ctx.reply(
        '✅ Документ получен!\n\n' +
        'Менеджер рассмотрит его и свяжется с вами.'
      );
      console.log(`[BOT] Документ от userId=${userId}`);
    } else if (text && !text.startsWith('/')) {
      userStates.set(userId, STATE.REGISTERED);
      await ctx.reply(
        '✅ Сообщение получено!\n\n' +
        'Менеджер рассмотрит его и свяжется с вами.'
      );
    } else {
      await ctx.reply(
        '📎 Пожалуйста, отправьте файл.',
        { attachments: [getCancelKeyboard()] }
      );
    }
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
  console.log(`\n[BOT] message_callback: userId=${userId}`);
  console.log(`[BOT] callback update:`, JSON.stringify(ctx.update, null, 2));

  // Пробуем разные поля где может быть payload
  const payload =
    ctx.update?.callback?.payload ||
    ctx.update?.payload ||
    ctx.update?.data ||
    null;

  console.log(`[BOT] callback payload: "${payload}"`);

  if (payload === 'cancel') {
    const state = userStates.get(userId);
    if (
      state === STATE.WAITING_LAWYER_REQUEST ||
      state === STATE.WAITING_DOCUMENT
    ) {
      userStates.set(userId, STATE.REGISTERED);
      await ctx.reply('✅ Действие отменено.');
    }
  }
});

console.log('\n🤖 [BOT] Запуск бота...');
startWorker(); // ← ЗАПУСКАЕМ ВОРКЕР
bot.start();
console.log('✅ [BOT] Бот запущен и ожидает сообщений\n');