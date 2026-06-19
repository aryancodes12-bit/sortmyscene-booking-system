export default function Loader({
    label = "Loading",
}) {
    return (
        <div className="flex min-h-52 flex-col items-center justify-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-violet-500" />

            <p className="text-sm text-zinc-500">
                {label}
            </p>
        </div>
    );
}