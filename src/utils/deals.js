export const DEAL_TYPE_MAP = {
    'SALE':      { name: 'Банкротство физических лиц',     categoryId: 2  },
    'COMPLEX':   { name: 'Юридическая услуга',              categoryId: 4  },
    'GOODS':     { name: 'Расторжение кредитного договора', categoryId: 8  },
    'SERVICES':  { name: 'Сбор документов',                 categoryId: 6  },
    'SERVICE':   { name: 'Кредитный брокер',                categoryId: 10 },
    '1':         { name: 'Исправление кредитной истории',   categoryId: 12 },
    'UC_YHXSUE': { name: 'Внесудебное банкротство',         categoryId: 2  },
    'UC_UABTV4': { name: 'Реструктуризация долга',          categoryId: 2  },
};

export const CATEGORY_NAMES = {
    6:  'Сбор документов',
    16: 'Публикация',
    18: 'Депозит',
};

export const DEAL_SHORT_NAMES = {
    'Банкротство физических лиц':      'БФЛ',
    'Юридическая услуга':              'Юр.услуга',
    'Расторжение кредитного договора': 'РКД',
    'Сбор документов':                 'Сб.докум.',
    'Кредитный брокер':                'КБ',
    'Исправление кредитной истории':   'ИКИ',
    'Внесудебное банкротство':         'ВБ',
    'Реструктуризация долга':          'РД',
    'Публикация':                      'Публ.',
    'Депозит':                         'Деп.',
};

export function getShortName(fullName) {
    return DEAL_SHORT_NAMES[fullName] || fullName;
}

export function getDealName(deal) {
    const catId = parseInt(deal.CATEGORY_ID);
    if (catId === 6)  return 'Сбор документов';
    if (catId === 16) return 'Публикация';
    if (catId === 18) return 'Депозит';
    return DEAL_TYPE_MAP[deal.TYPE_ID]?.name || 'Сделка';
}

export function isDealWon(stageId) {
    return stageId?.endsWith(':WON') || false;
}

// Цвет из поля COLOR Б24 (hex без #) или по типу стадии
export function getStageDisplay(deal) {
    const displayStage = deal.displayStage;
    const stageId = deal.STAGE_ID;
    const catId = parseInt(deal.CATEGORY_ID);

    // ── Цвета для категорий 16 и 18 (Публикация / Депозит) ──
    if (catId === 16 || catId === 18) {
        if (stageId?.endsWith(':WON')) {
            return { label: 'Завершено',    bg: '#7BD50025', text: '#7BD500' };
        }
        if (stageId?.endsWith(':FINAL_INVOICE')) {
            return { label: 'Финальный счёт', bg: '#FAAA0825', text: '#FAAA08' };
        }
        // Любой другой статус
        const hex = '#FAAA08';
        return {
            label: displayStage?.NAME || stageId || 'В работе',
            bg: hex + '25',
            text: hex,
        };
    }

    // ── Цвета для категории 6 (Сбор документов) ──
    if (catId === 6) {
        const C6_COLORS = {
            'NEW':                { label: 'Новая',            color: '#39A8EF' },
            'PREPARATION':        { label: 'Подготовка',       color: '#2fc6f6' },
            'PREPAYMENT_INVOICE': { label: 'Счёт на оплату',   color: '#55d0e0' },
            'WON':                { label: 'Завершено',         color: '#7BD500' },
        };

        // stageId для cat6 выглядит как "C6:NEW" или просто "NEW"
        const key = stageId?.includes(':') ? stageId.split(':').pop() : stageId;
        const found = C6_COLORS[key];

        if (found) {
            return {
                label: found.label,
                bg: found.color + '25',
                text: found.color,
            };
        }

        return {
            label: displayStage?.NAME || stageId || 'В работе',
            bg: '#39A8EF25',
            text: '#39A8EF',
        };
    }

    // ── Стандартная логика для остальных категорий ──
    let label = 'Ожидание первого платежа';
    let colorHex = 'F5A623';

    if (displayStage) {
        label    = displayStage.NAME  || label;
        colorHex = displayStage.COLOR || colorHex;
    } else if (stageId?.endsWith(':WON')) {
        label    = 'Завершено';
        colorHex = '4CAF50';
    } else if (stageId?.endsWith(':LOSE')) {
        label    = 'Закрыто';
        colorHex = 'E53935';
    }

    const hex = colorHex.startsWith('#') ? colorHex : `#${colorHex}`;
    return {
        label,
        bg:   hex + '25',
        text: hex,
    };
}

export function formatMoney(amount) {
    if (!amount && amount !== 0) return '—';
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        maximumFractionDigits: 0,
    }).format(parseFloat(amount));
}

export function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
        return new Date(dateStr).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    } catch {
        return dateStr;
    }
}

export function getPaymentStatus(product, paidAmount, productIndex, products) {
    const cumulativeSum = products
        .slice(0, productIndex + 1)
        .reduce((sum, p) => sum + parseFloat(p.PRICE || 0) * parseFloat(p.QUANTITY || 1), 0);

    if (paidAmount >= cumulativeSum) return 'paid';

    const name = product.PRODUCT_NAME || product.productName || '';
    const dateMatch = name.match(/(\d{2})[.\-/](\d{2})[.\-/](\d{4})/);
    if (dateMatch) {
        const date = new Date(`${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`);
        if (date < new Date()) return 'overdue';
    }

    return 'pending';
}

export function extractDateFromProduct(product) {
    const name = product.PRODUCT_NAME || product.productName || '';
    const dateMatch = name.match(/(\d{2})[.\-/](\d{2})[.\-/](\d{4})/);
    if (dateMatch) return `${dateMatch[1]}.${dateMatch[2]}.${dateMatch[3]}`;
    return name || '—';
}

export function getProductAmount(product) {
    const price = parseFloat(product.PRICE || product.price || 0);
    const qty = parseFloat(product.QUANTITY || product.quantity || 1);
    return price * qty;
}

export function getProductDate(product) {
    const name = product.PRODUCT_NAME || product.productName || '';
    const dateMatch = name.match(/(\d{2})[.\-/](\d{2})[.\-/](\d{4})/);
    if (dateMatch) return new Date(`${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`);
    return new Date(9999, 0);
}