import React from 'react';
import { getDealName } from '../utils/deals';

const BG = '#F2F3F5';
const CARD_BG = '#FFFFFF';
const BORDER = 'rgba(0,0,0,0.08)';

// ─── Типы документов внутри сделки ───────────────────────────────────────────
const DOC_TYPES = [
    { key: 'contract', name: 'Договор',            emoji: '📄' },
    { key: 'acts',     name: 'Акты',               emoji: '📋' },
    { key: 'court',    name: 'Судебные документы', emoji: '⚖️'  },
    { key: 'proxy',    name: 'Доверенности',       emoji: '📝' },
];

// ─── Одна строка документа ────────────────────────────────────────────────────
const DocRow = ({ emoji, name, onDownload, isLast }) => (
    <div>
        <div
            onClick={onDownload}
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 16px',
                cursor: 'pointer',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                transition: 'opacity 0.15s',
            }}
            onTouchStart={e => e.currentTarget.style.opacity = '0.6'}
            onTouchEnd={e => e.currentTarget.style.opacity = '1'}
            onMouseDown={e => e.currentTarget.style.opacity = '0.6'}
            onMouseUp={e => e.currentTarget.style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 20 }}>{emoji}</span>
                <span style={{ fontSize: 15, color: '#1a1a1a' }}>{name}</span>
            </div>
            <span style={{ fontSize: 13, color: '#42A5F5', fontWeight: 600 }}>
                Скачать ›
            </span>
        </div>

        {!isLast && (
            <div style={{ height: 1, backgroundColor: BORDER, margin: '0 16px' }} />
        )}
    </div>
);

// ─── Карточка одной сделки с документами ─────────────────────────────────────
const DealDocsCard = ({ deal }) => {
    const name = getDealName(deal);

    // Собираем только те документы, для которых реально есть файл
    const availableDocs = DOC_TYPES.filter(doc =>
        doc.key === 'contract' && deal.contractFile
        // сюда легко добавить другие типы когда появятся:
        // || doc.key === 'acts' && deal.actsFile
        // || doc.key === 'court' && deal.courtFile
        // || doc.key === 'proxy' && deal.proxyFile
    );

    // Если нет ни одного документа — не рендерим карточку вообще
    if (availableDocs.length === 0) return null;

    return (
        <div style={{ width: '100%', boxSizing: 'border-box' }}>

            {/* Заголовок сделки */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 8,
            }}>
                <span style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: '#1a1a1a',
                    flex: 1,
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}>
                    {name}
                </span>
                {deal.contractNumber && (
                    <span style={{
                        fontSize: 11,
                        color: '#888',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                    }}>
                        № {deal.contractNumber}
                    </span>
                )}
            </div>

            {/* Карточка с документами */}
            <div style={{
                borderRadius: 14,
                backgroundColor: CARD_BG,
                border: `1px solid ${BORDER}`,
                overflow: 'hidden',
            }}>
                {availableDocs.map((doc, i) => {
                    const handler = doc.key === 'contract'
                        ? () => window.open(deal.contractFile, '_blank')
                        : null;

                    return (
                        <DocRow
                            key={doc.key}
                            emoji={doc.emoji}
                            name={doc.name}
                            onDownload={handler}
                            isLast={i === availableDocs.length - 1}
                        />
                    );
                })}
            </div>
        </div>
    );
};

// ─── Экран документов ─────────────────────────────────────────────────────────
export const DocumentsScreen = ({ deals, onUploadDocument }) => {
    const mainDeals = deals.filter(
        d => parseInt(d.CATEGORY_ID) !== 16 && parseInt(d.CATEGORY_ID) !== 18
    );

    // Только сделки у которых есть хотя бы один документ
    const dealsWithDocs = mainDeals.filter(d => d.contractFile /* || d.actsFile || ... */);

    return (
        <div style={{
            minHeight: '100%',
            width: '100%',
            backgroundColor: BG,
            boxSizing: 'border-box',
        }}>

            {/* ── Шапка ───────────────────────────────────────────────────── */}
            <div style={{ padding: '24px 16px 16px' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>
                    Документы
                </div>
                <div style={{ fontSize: 13, color: '#888' }}>
                    Документы по вашим делам
                </div>
            </div>

            {/* ── Список сделок с документами ─────────────────────────────── */}
            <div style={{
                padding: '0 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
                width: '100%',
                boxSizing: 'border-box',
            }}>
                {dealsWithDocs.length === 0 ? (
                    <div style={{
                        borderRadius: 14,
                        padding: '24px 16px',
                        backgroundColor: CARD_BG,
                        border: `1px solid ${BORDER}`,
                        textAlign: 'center',
                        fontSize: 14,
                        color: '#888',
                    }}>
                        Документы пока не загружены
                    </div>
                ) : (
                    dealsWithDocs.map(deal => (
                        <DealDocsCard key={deal.ID} deal={deal} />
                    ))
                )}
            </div>

            {/* ── Кнопка "Загрузить документ" ─────────────────────────────── */}
            <div style={{
                padding: '24px 16px 32px',
                width: '100%',
                boxSizing: 'border-box',
            }}>
                <button
                    onClick={() => onUploadDocument?.()}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        width: '100%',
                        padding: '14px 16px',
                        borderRadius: 12,
                        border: 'none',
                        backgroundColor: '#42A5F5',
                        color: '#fff',
                        fontSize: 15,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent',
                        outline: 'none',
                        transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1E88E5'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#42A5F5'}
                    onTouchStart={e => e.currentTarget.style.backgroundColor = '#1E88E5'}
                    onTouchEnd={e => e.currentTarget.style.backgroundColor = '#42A5F5'}
                >
                    <span style={{ fontSize: 18 }}>📤</span>
                    <span>Загрузить документ</span>
                </button>
            </div>

        </div>
    );
};