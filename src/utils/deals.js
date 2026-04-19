// Маппинг type_id → название и category_id для стадий
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
    16: 'Публикация',
    18: 'Депозит',
};

// Получить название сделки
export function getDealName(deal) {
    const catId = parseInt(deal.CATEGORY_ID);
    if (catId === 16) return 'Публикация';
    if (catId === 18) return 'Депозит';
    return DEAL_TYPE_MAP[deal.TYPE_ID]?.name || 'Сделка';
}

// Является ли сделка успешной
export function isDealWon(stageId) {
    return stageId?.endsWith(':WON') || false;
}

// Цвет стадии — берём из COLOR поля Б24 или дефолт
export function getStageColor(stageId, currentStage) {
    if (!stageId) return { bg: '#9e9e9e22', text: '#9e9e9e' };

    // Если есть данные стадии из Б24
    if (currentStage?.COLOR) {
        const hex = currentStage.COLOR.startsWith('#')
            ? currentStage.COLOR
            : '#' + currentStage.COLOR;
        return { bg: hex + '33', text: hex };
    }

    // Дефолтные цвета по типу стадии
    if (stageId.endsWith(':WON'))  return { bg: '#2e7d3222', text: '#2e7d32' };
    if (stageId.endsWith(':LOSE')) return { bg: '#c6282822', text: '#c62828' };
    return { bg: '#e6510022', text: '#e65100' };
}

// Получить отображение стадии
export function getStageDisplay(deal) {
    const stageId = deal.STAGE_ID;
    const currentStage = deal.currentStage;
    const isWon = deal.isWon;

    let label = '';

    if (currentStage?.NAME) {
        label = currentStage.NAME;
    } else if (isWon) {
        label = 'Завершено';
    } else if (stageId?.endsWith(':LOSE')) {
        label = 'Закрыто';
    } else {
        // Дефолт для category_id=0
        label = 'Ожидание первого платежа';
    }

    const colors = getStageColor(stageId, currentStage);
    return { label, ...colors };
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
            year: 'numeric',
        });
    } catch {
        return dateStr;
    }
}

// Статус платежа из графика
export function getPaymentStatus(product, paidAmount, productIndex, products) {
    const cumulativeSum = products
        .slice(0, productIndex + 1)
        .reduce((sum, p) => sum + parseFloat(p.PRICE || 0) * parseFloat(p.QUANTITY || 1), 0);

    if (paidAmount >= cumulativeSum) return 'paid';

    // Парсим дату из названия товара
    const name = product.PRODUCT_NAME || product.productName || '';
    const dateMatch = name.match(/(\d{2})[.\-/](\d{2})[.\-/](\d{4})/);
    if (dateMatch) {
        const date = new Date(`${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`);
        if (date < new Date()) return 'overdue';
    }

    return 'pending';
}

// Извлечь дату из названия товара
export function extractDateFromProduct(product) {
    const name = product.PRODUCT_NAME || product.productName || '';
    const dateMatch = name.match(/(\d{2})[.\-/](\d{2})[.\-/](\d{4})/);
    if (dateMatch) return `${dateMatch[1]}.${dateMatch[2]}.${dateMatch[3]}`;
    return name || '—';
}

// Сумма товара
export function getProductAmount(product) {
    const price = parseFloat(product.PRICE || product.price || 0);
    const qty = parseFloat(product.QUANTITY || product.quantity || 1);
    return price * qty;
}

// Для сортировки платежей по дате
export function getProductDate(product) {
    const name = product.PRODUCT_NAME || product.productName || '';
    const dateMatch = name.match(/(\d{2})[.\-/](\d{2})[.\-/](\d{4})/);
    if (dateMatch) return new Date(`${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`);
    return new Date(9999, 0); // неизвестные даты — в конец
}