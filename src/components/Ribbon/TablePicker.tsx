import { useState, useCallback } from 'react'
import { useI18n } from '@/i18n'
import './TablePicker.css'

interface TablePickerProps {
    onSelect: (rows: number, cols: number) => void
    onClose: () => void
}

const MAX_ROWS = 8
const MAX_COLS = 8

export function TablePicker({ onSelect, onClose }: TablePickerProps) {
    const { t } = useI18n()
    const [hoverRow, setHoverRow] = useState(0)
    const [hoverCol, setHoverCol] = useState(0)

    const handleClick = useCallback(() => {
        if (hoverRow > 0 && hoverCol > 0) {
            onSelect(hoverRow, hoverCol)
            onClose()
        }
    }, [hoverRow, hoverCol, onSelect, onClose])

    return (
        <div className="table-picker" onMouseLeave={onClose}>
            <div className="table-picker__label">
                {hoverRow > 0 && hoverCol > 0
                    ? t('table.dimensions', { rows: hoverRow, cols: hoverCol })
                    : t('table.selectSize')}
            </div>
            <div className="table-picker__grid">
                {Array.from({ length: MAX_ROWS }, (_, rowIndex) => (
                    <div key={rowIndex} className="table-picker__row">
                        {Array.from({ length: MAX_COLS }, (_, colIndex) => (
                            <div
                                key={colIndex}
                                className={`table-picker__cell ${rowIndex < hoverRow && colIndex < hoverCol ? 'active' : ''}`}
                                onMouseEnter={() => {
                                    setHoverRow(rowIndex + 1)
                                    setHoverCol(colIndex + 1)
                                }}
                                onClick={handleClick}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}
