// Маппинг type_id → название и category_id для стадий
export const DEAL_TYPE_MAP = {
    'SALE':       { name: 'Банкротство физических лиц',      categoryId: 2  },
    'COMPLEX':    { name: 'Юридическая услуга',               categoryId: 4  },
    'GOODS':      { name: 'Расторжение кредитного договора',  categoryId: 8  },
    'SERVICES':   { name: 'Сбор документов',                  categoryId: 6  },
    'SERVICE':    { name: 'Кредитный брокер',                 categoryId: 10 },
    '1':          { name: 'Исправление кредитной истории',    categoryId: 12 },
    'UC_YHXSUE':  { name: 'Внесудебное банкротство',          categoryId: 2  },
    'UC_UABTV4':  { name: 'Реструктуризация долга',           categoryId: 2  },
};

export const CATEGORY_NAMES = {
    16: 'Публикация',
    18: 'Депозит',
};

// Получить название сделки по type_id
export function getDealName(typeId) {
    return DEAL_TYPE_MAP[typeId]?.name || 'Сделка';
}

// Является ли сделка успешной (WON)
export function isDealWon(stageId) {
    return stageId?.endsWith(':WON') || false;
}

// Форматирование суммы
export function formatMoney(amount) {
    if (!amount && amount !== 0) return '—';
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        maximumFractionDigits: 0,
    }).format(parseFloat(amount));
}

// Форматирование даты
export function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
        return new Date(dateStr).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch {
        return dateStr;
    }
}

// Статус платежа из графика
// products = товары сделки, paidAmount = оплачено по счетам
export function getPaymentStatus(product, paidAmount, productIndex, products) {
    // Сумма по товарам до текущего включительно
    const cumulativeSum = products
        .slice(0, productIndex + 1)
        .reduce((sum, p) => sum + parseFloat(p.PRICE || 0) * parseFloat(p.QUANTITY || 1), 0);

    const prevSum = products
        .slice(0, productIndex)
        .reduce((sum, p) => sum + parseFloat(p.PRICE || 0) * parseFloat(p.QUANTITY || 1), 0);

    const productAmount = parseFloat(product.PRICE || 0) * parseFloat(product.QUANTITY || 1);

    if (paidAmount >= cumulativeSum) return 'paid';

    // Парсим дату из названия товара (формат: "01.03.2026" или содержит дату)
    const dateMatch = product.PRODUCT_NAME?.match(/(\d{2}[.\-/]\d{2}[.\-/]\d{4})/);
    if (dateMatch) {
        const parts = dateMatch[1].split(/[.\-/]/);
        const date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        if (date < new Date() && paidAmount < cumulativeSum) return 'overdue';
    }

    return 'pending';
}

// Цвет и текст статуса сделки
export function getStageDisplay(stageId) {
    if (!stageId) return { label: 'Неизвестно', color: '#999' };

    if (stageId.endsWith(':WON')) return { label: 'Завершено', color: '#2e7d32' };
    if (stageId.endsWith(':LOSE')) return { label: 'Закрыто', color: '#c62828' };

    const stageNames = {
        'C2:NEW':           'Ожидание первого платежа',
        'C2:PREPARATION':   'В работе',
        'C2:EXECUTING':     'Исполнение',
        'C2:FINAL_INVOICE': 'Финальный этап',
        'C4:NEW':           'Новая',
        'C4:PREPARATION':   'Подготовка',
        'C6:NEW':           'Сбор документов',
        'C8:NEW':           'Новая',
        'C10:NEW':          'Брокер',
        'C12:NEW':          'Исправление КИ',
    };

    return {
        label: stageNames[stageId] || stageId,
        color: '#e65100',
    };
}