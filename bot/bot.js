import { Bot, Keyboard } from '@maxhub/max-bot-api';
import dotenv from 'dotenv';
import { findUserByMaxId, saveUser } from './db.js';
import { startWorker } from './worker.js';
import { getUserState, setUserState, clearUserState } from './db.js';
import { findByPhone, sendToBitrixOpenLine } from './bitrix.js';

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

bot.action('cancel', async (ctx) => {
  const userId = getUserId(ctx);

  console.log('[BOT] Cancel pressed by user:', userId);

  await clearUserState(userId);

  await ctx.reply('✅ Действие отменено.');
});

// ─── Входящие сообщения ───────────────────────────────────────────────────────
bot.on('message_created', async (ctx) => {
  const userId = getUserId(ctx);

  console.log(`\n[BOT] 📨 message_created: userId=${userId}`);
  console.log(`[BOT] FULL update:`, JSON.stringify(ctx.update, null, 2));

  if (!userId) {
    console.log('[BOT] userId не определён, выходим');
    return;
  }

  const message = ctx.message;

  const text = message?.body?.text?.trim() || '';

  const attachments =
    message?.body?.attachments ||
    ctx.update?.message?.body?.attachments ||
    [];

  console.log('[BOT] attachments:', JSON.stringify(attachments, null, 2));

  // ───────────────────────────────────────────────
  // Проверка контакта (кнопка "поделиться номером")
  // ───────────────────────────────────────────────

  const contactAttachment = attachments.find(a => a.type === 'contact');

  if (contactAttachment) {
    const phone = extractPhoneFromContact(contactAttachment);

    console.log(`[BOT] Телефон из контакта: "${phone}"`);

    if (phone) {
      await handlePhone(ctx, phone, userId);
      return;
    }
  }

  // ───────────────────────────────────────────────
  // Получаем state
  // ───────────────────────────────────────────────

  const dbState = await getUserState(userId);
  const memState = userStates.get(userId);
  const state = dbState || memState || STATE.IDLE;

  console.log(`[BOT] userId=${userId}, state=${state}`);

  // Получаем пользователя из БД
  const existingUser = await findUserByMaxId(userId);

  if (!existingUser) {
    console.log('[BOT] Пользователь не найден в БД');
  }

  // ───────────────────────────────────────────────
  // WAITING_DOCUMENT
  // ───────────────────────────────────────────────

  if (state === STATE.WAITING_DOCUMENT) {

    const hasFile = attachments.some(a =>
      ['file', 'image', 'video', 'audio', 'document'].includes(a.type)
    );

    console.log('[BOT] WAITING_DOCUMENT hasFile=', hasFile);

    if (hasFile) {
      const fileUrl = attachments[0]?.payload?.url;

      await sendToBitrixOpenLine({
        contactId: existingUser.bitrix_contact_id,
        text: `📎 Клиент отправил документ`
      });


      await clearUserState(userId);
      userStates.set(userId, STATE.REGISTERED);

      await ctx.reply(
        '✅ Документ получен!\n\nМенеджер рассмотрит его и свяжется с вами.'
      );

      console.log(`[BOT] Документ получен от userId=${userId}`);
      return;
    }

    if (text) {
      await clearUserState(userId);
      userStates.set(userId, STATE.REGISTERED);

      await ctx.reply(
        '✅ Сообщение получено!\n\nМенеджер рассмотрит его и свяжется с вами.'
      );

      console.log(`[BOT] Текст вместо файла от userId=${userId}`);
      return;
    }

    await ctx.reply('📎 Пожалуйста, отправьте файл.');
    return;
  }

  // ───────────────────────────────────────────────
  // WAITING_LAWYER_REQUEST
  // ───────────────────────────────────────────────

  if (state === STATE.WAITING_LAWYER_REQUEST) {

    console.log('[BOT] WAITING_LAWYER_REQUEST text:', text);

    if (text) {
      await sendToBitrixOpenLine({
        contactId: existingUser.bitrix_contact_id,
        text: `👨‍⚖️ Вопрос юристу:\n\n${text}`
      });

      await clearUserState(userId);
      userStates.set(userId, STATE.REGISTERED);

      await ctx.reply(
        '✅ Ваш запрос принят!\n\n' +
        'Юрист свяжется с вами в рабочее время (пн–пт, 9:00–18:00).'
      );

      console.log(`[BOT] Запрос юристу от userId=${userId}: "${text}"`);
      return;
    }

    await ctx.reply('✏️ Напишите ваш вопрос текстом.');
    return;
  }

  // ───────────────────────────────────────────────
  // WAITING_PHONE
  // ───────────────────────────────────────────────

  if (state === STATE.WAITING_PHONE) {
    if (text) {
      console.log('[BOT] Ожидаем телефон — обрабатываем текст');
      await handlePhone(ctx, text, userId);
    } else {
      await ctx.reply(
        'Пожалуйста, отправьте номер телефона текстом в формате +79991234567'
      );
    }

    return;
  }

  // ───────────────────────────────────────────────
  // REGISTERED
  // ───────────────────────────────────────────────

  if (state === STATE.REGISTERED) {
    if (!text) {
      console.log('[BOT] REGISTERED: сообщение без текста — ничего не делаем');
      return;
    }

    if (text.startsWith('/')) {
      console.log('[BOT] REGISTERED: команда — пропускаем');
      return;
    }

    await sendToBitrixOpenLine({
      contactId: existingUser.bitrix_contact_id,
      text
    });

    await ctx.reply('Чем могу помочь?');
    return;
  }

  // ───────────────────────────────────────────────
  // IDLE или неизвестное состояние
  // ───────────────────────────────────────────────

  console.log('[BOT] Состояние неизвестно или idle — проверяем БД');

  if (existingUser) {
    userStates.set(userId, STATE.REGISTERED);
    await ctx.reply('Чем могу помочь?');
  } else {
    await askForPhone(ctx);
  }
});

console.log('\n🤖 [BOT] Запуск бота...');
startWorker();
bot.start();
console.log('✅ [BOT] Бот запущен и ожидает сообщений\n');