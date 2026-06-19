import {
    AlertTriangle,
    RefreshCw,
} from "lucide-react";

export default function ErrorMessage({
    message,
    onRetry,
}) {
    return (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.07] p-6 text-center">
            <AlertTriangle
                size={28}
                className="mx-auto text-red-400"
            />

            <p className="mt-3 text-sm text-red-200">
                {message}
            </p>

            {onRetry && (
                <button
                    type="button"
                    onClick={onRetry}
                    className="mx-auto mt-5 flex items-center gap-2 rounded-full border border-red-400/25 px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-300 transition hover:bg-red-500/10"
                >
                    <RefreshCw size={14} />
                    Try again
                </button>
            )}
        </div>
    );
}