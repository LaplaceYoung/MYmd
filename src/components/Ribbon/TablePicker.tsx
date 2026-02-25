import { useState, useCallback } from 'react'
import './TablePicker.css'

interface TablePickerProps {
    onSelect: (rows: number, cols: number) => void
    onClose: () => void
}

const MAX_ROWS = 8
const MAX_COLS = 8

/** 表格维度选择网格（类似 Word） */
export function TablePicker({ onSelect, onClose }: TablePickerProps) {
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
                    ? `${hoverRow} × ${hoverCol} 表格`
                    : '选择表格大小'
                }
            </div>
            <div className="table-picker__grid">
                {Array.from({ length: MAX_ROWS }, (_, r) => (
                    <div key={r} className="table-picker__row">
                        {Array.from({ length: MAX_COLS }, (_, c) => (
                            <div
                                key={c}
                                className={`table-picker__cell ${r < hoverRow && c < hoverCol ? 'active' : ''
                                    }`}
                                onMouseEnter={() => {
                                    setHoverRow(r + 1)
                                    setHoverCol(c + 1)
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
