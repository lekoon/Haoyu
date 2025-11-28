/**
 * Selection Box Component
 * Displays selection rectangle and handles multi-select
 */

import React, { memo } from 'react';

interface SelectionBoxProps {
    start: { x: number; y: number } | null;
    end: { x: number; y: number } | null;
    offset: { x: number; y: number };
    scale: number;
}

const SelectionBox: React.FC<SelectionBoxProps> = memo(({ start, end, offset, scale }) => {
    if (!start || !end) return null;

    const left = Math.min(start.x, end.x);
    const top = Math.min(start.y, end.y);
    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.y - start.y);

    return (
        <div
            className="absolute pointer-events-none border-2 border-blue-500 bg-blue-100 bg-opacity-20 rounded"
            style={{
                left: left * scale + offset.x,
                top: top * scale + offset.y,
                width: width * scale,
                height: height * scale,
            }}
        />
    );
});

SelectionBox.displayName = 'SelectionBox';

export default SelectionBox;
