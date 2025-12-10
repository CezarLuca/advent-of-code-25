"use client";

interface ControlBarProps {
    currentRowIndex: number;
    totalRows: number;
    autoPlay: boolean;
    isPlaying: boolean;
    isPaused: boolean;
    onResetState: () => void;
    onResetAll: () => void;
    onAutoPlayChange: (value: boolean) => void;
    onClose: () => void;
    variant: "desktop" | "mobile";
}

export default function ControlBar({
    currentRowIndex,
    totalRows,
    autoPlay,
    isPlaying,
    isPaused,
    onResetState,
    onResetAll,
    onAutoPlayChange,
    onClose,
    variant,
}: ControlBarProps) {
    const isMobile = variant === "mobile";
    const isDisabled = isPlaying && !isPaused;

    if (isMobile) {
        return (
            <div className="flex justify-between items-center px-2 py-1 shrink-0">
                <div className="flex gap-1">
                    <button
                        onClick={onResetState}
                        disabled={isDisabled}
                        className="px-2 py-1 bg-gray-700 text-gray-300 rounded font-mono text-[10px] hover:bg-gray-600 disabled:opacity-50"
                    >
                        ↺
                    </button>
                    <button
                        onClick={onResetAll}
                        disabled={isDisabled}
                        className="px-2 py-1 bg-red-900 text-red-300 rounded font-mono text-[10px] hover:bg-red-800 disabled:opacity-50"
                    >
                        ⟲
                    </button>
                </div>

                <div className="font-mono text-yellow-400 text-xs">
                    {currentRowIndex + 1}/{totalRows}
                </div>

                <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 text-gray-400 text-[10px] font-mono">
                        <input
                            type="checkbox"
                            checked={autoPlay}
                            onChange={(e) => onAutoPlayChange(e.target.checked)}
                            className="w-3 h-3"
                            disabled={isDisabled}
                        />
                        AUTO
                    </label>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white text-sm px-1"
                    >
                        ✕
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-between items-center mb-2 px-2">
            <div className="flex gap-2">
                <button
                    onClick={onResetState}
                    disabled={isDisabled}
                    className="px-3 py-1.5 bg-gray-700 text-gray-300 rounded font-mono text-xs hover:bg-gray-600 disabled:opacity-50 transition-colors"
                >
                    ↺ RESET
                </button>
                <button
                    onClick={onResetAll}
                    disabled={isDisabled}
                    className="px-3 py-1.5 bg-red-900 text-red-300 rounded font-mono text-xs hover:bg-red-800 disabled:opacity-50 transition-colors"
                >
                    ⟲ RESET ALL
                </button>
            </div>

            <div className="font-mono text-yellow-400 text-sm">
                ROW {currentRowIndex + 1} / {totalRows}
            </div>

            <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-gray-400 text-xs font-mono cursor-pointer">
                    <input
                        type="checkbox"
                        checked={autoPlay}
                        onChange={(e) => onAutoPlayChange(e.target.checked)}
                        className="rounded w-3 h-3"
                        disabled={isDisabled}
                    />
                    AUTO
                </label>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white text-lg px-2 py-1 rounded hover:bg-gray-700 transition-colors"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}
