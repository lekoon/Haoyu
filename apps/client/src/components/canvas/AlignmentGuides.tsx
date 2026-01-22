/**
 * Alignment Guides Component
 * Shows smart guides when dragging elements
 */

import React, { memo } from 'react';

interface AlignmentGuidesProps {
    guides: {
        vertical: number[];
        horizontal: number[];
    };
    offset: { x: number; y: number };
    scale: number;
    canvasSize: { width: number; height: number };
}

const AlignmentGuides: React.FC<AlignmentGuidesProps> = memo(({
    guides,
    offset,
    scale,
    canvasSize,
}) => {
    return (
        <div className="absolute inset-0 pointer-events-none z-30">
            {/* Vertical guides */}
            {guides.vertical.map((x, index) => (
                <div
                    key={`v-${index}`}
                    className="absolute top-0 bottom-0 w-px bg-pink-500"
                    style={{
                        left: x * scale + offset.x,
                        height: canvasSize.height,
                    }}
                >
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 bg-pink-500 text-white text-xs px-1 rounded">
                        {Math.round(x)}
                    </div>
                </div>
            ))}

            {/* Horizontal guides */}
            {guides.horizontal.map((y, index) => (
                <div
                    key={`h-${index}`}
                    className="absolute left-0 right-0 h-px bg-pink-500"
                    style={{
                        top: y * scale + offset.y,
                        width: canvasSize.width,
                    }}
                >
                    <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-pink-500 text-white text-xs px-1 rounded">
                        {Math.round(y)}
                    </div>
                </div>
            ))}
        </div>
    );
});

AlignmentGuides.displayName = 'AlignmentGuides';

export default AlignmentGuides;
