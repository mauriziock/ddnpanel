'use client';

import {
    motion,
    MotionValue,
    useMotionValue,
    useSpring,
    useTransform,
    type SpringOptions,
    AnimatePresence
} from 'motion/react';
import React, { Children, cloneElement, useEffect, useMemo, useRef, useState } from 'react';

export type DockItemData = {
    icon: React.ReactNode;
    label: React.ReactNode;
    onClick: () => void;
    className?: string;
};

export type DockProps = {
    items: DockItemData[];
    className?: string;
    distance?: number;
    panelHeight?: number;
    baseItemSize?: number;
    dockHeight?: number;
    magnification?: number;
    spring?: SpringOptions;
};

type DockItemProps = {
    className?: string;
    children: React.ReactNode;
    onClick?: () => void;
    mouseX: MotionValue<number>;
    spring: SpringOptions;
    distance: number;
    baseItemSize: number;
    magnification: number;
};

function DockItem({
    children,
    className = '',
    onClick,
    mouseX,
    spring,
    distance,
    magnification,
    baseItemSize
}: DockItemProps) {
    const ref = useRef<HTMLDivElement>(null);
    const isHovered = useMotionValue(0);

    const mouseDistance = useTransform(mouseX, val => {
        const rect = ref.current?.getBoundingClientRect() ?? {
            x: 0,
            width: baseItemSize
        };
        return val - rect.x - baseItemSize / 2;
    });

    const targetSize = useTransform(mouseDistance, [-distance, 0, distance], [baseItemSize, magnification, baseItemSize]);
    const size = useSpring(targetSize, spring);

    return (
        <motion.div
            ref={ref}
            style={{
                width: size,
                height: size
            }}
            onHoverStart={() => isHovered.set(1)}
            onHoverEnd={() => isHovered.set(0)}
            onFocus={() => isHovered.set(1)}
            onBlur={() => isHovered.set(0)}
            onClick={onClick}
            className={`relative inline-flex items-center justify-center rounded-2xl bg-black/15 border border-white/10 ring-1 ring-black/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),inset_0_-1px_1px_rgba(0,0,0,0.2),0_4px_6px_-1px_rgba(0,0,0,0.2),0_2px_4px_-1px_rgba(0,0,0,0.1)] hover:bg-white/10 transition-colors ${className}`}
            tabIndex={0}
            role="button"
            aria-haspopup="true"
        >
            {Children.map(children, child =>
                React.isValidElement(child)
                    ? cloneElement(child as React.ReactElement<{ isHovered?: MotionValue<number> }>, { isHovered })
                    : child
            )}
        </motion.div>
    );
}

type DockLabelProps = {
    className?: string;
    children: React.ReactNode;
    isHovered?: MotionValue<number>;
};

function DockLabel({ children, className = '', isHovered }: DockLabelProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (!isHovered) return;
        const unsubscribe = isHovered.on('change', latest => {
            setIsVisible(latest === 1);
        });
        return () => unsubscribe();
    }, [isHovered]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 0 }}
                    animate={{ opacity: 1, y: -10 }}
                    exit={{ opacity: 0, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`${className} absolute -top-8 left-1/2 w-fit whitespace-pre rounded-lg border border-white/20 bg-black/80 backdrop-blur-md px-3 py-1 text-xs text-white shadow-xl`}
                    role="tooltip"
                    style={{ x: '-50%' }}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

type DockIconProps = {
    className?: string;
    children: React.ReactNode;
    isHovered?: MotionValue<number>;
};

function DockIcon({ children, className = '' }: DockIconProps) {
    return <div className={`flex items-center justify-center text-white ${className}`}>{children}</div>;
}

export default function Dock({
    items,
    className = '',
    spring = { mass: 0.1, stiffness: 150, damping: 12 },
    magnification = 70,
    distance = 140,
    panelHeight = 64,
    dockHeight = 200,
    baseItemSize = 52
}: DockProps) {
    const mouseX = useMotionValue(Infinity);
    const isHovered = useMotionValue(0);

    // Reduced maxHeight to prevent excessive elevation
    const maxHeight = useMemo(() => panelHeight + 20, [panelHeight]);
    const heightRow = useTransform(isHovered, [0, 1], [panelHeight, maxHeight]);
    const height = useSpring(heightRow, spring);

    return (
        <motion.div style={{ height, scrollbarWidth: 'none' }} className="mx-2 flex max-w-full items-center justify-center">
            <motion.div
                onMouseMove={({ pageX }) => {
                    isHovered.set(1);
                    mouseX.set(pageX);
                }}
                onMouseLeave={() => {
                    isHovered.set(0);
                    mouseX.set(Infinity);
                }}
                className={`${className} relative flex items-end w-fit gap-2 px-3 pb-2`}
                style={{ height: panelHeight }}
                role="toolbar"
                aria-label="Application dock"
            >
                {/* Background Glass Layer */}
                <div
                    className="absolute inset-x-0 bottom-0 rounded-[24px] border border-white/40 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_1px_rgba(255,255,255,0.4)] overflow-hidden -z-10"
                    style={{
                        height: '100%',
                        background: 'var(--wallpaper-url)',
                        backgroundAttachment: 'fixed',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    {/* Dark Tint & High Blur */}
                    <div className="absolute inset-0 bg-black/25 backdrop-blur-3xl" />
                    <div className="absolute inset-0 bg-white/5" />
                </div>

                {items.map((item, index) => (
                    <DockItem
                        key={index}
                        onClick={item.onClick}
                        className={item.className}
                        mouseX={mouseX}
                        spring={spring}
                        distance={distance}
                        magnification={magnification}
                        baseItemSize={baseItemSize}
                    >
                        <DockIcon>{item.icon}</DockIcon>
                        <DockLabel>{item.label}</DockLabel>
                    </DockItem>
                ))}
            </motion.div>
        </motion.div >
    );
}
