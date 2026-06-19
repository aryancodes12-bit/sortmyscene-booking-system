import {
    ArrowLeft,
    CalendarDays,
    MapPin,
    Ticket,
} from "lucide-react";

import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    Link,
    useParams,
} from "react-router";

import {
    getApiErrorMessage,
    getEvent,
} from "../api";

import ErrorMessage from "../components/common/ErrorMessage";
import Loader from "../components/common/Loader";

export default function EventDetail() {
    const { eventId } = useParams();

    const [eventData, setEventData] =
        useState(null);
    const [loading, setLoading] =
        useState(true);
    const [error, setError] = useState("");

    const loadEvent = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await getEvent(eventId);
            setEventData(response.data.data);
        } catch (requestError) {
            setError(
                getApiErrorMessage(
                    requestError,
                    "Unable to load this event",
                ),
            );
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => {
        loadEvent();
    }, [loadEvent]);

    if (loading) {
        return (
            <main className="min-h-screen px-5 pb-20 pt-32">
                <Loader label="Loading event..." />
            </main>
        );
    }

    if (error) {
        return (
            <main className="mx-auto min-h-screen max-w-4xl px-5 pb-20 pt-32">
                <ErrorMessage
                    message={error}
                    onRetry={loadEvent}
                />
            </main>
        );
    }

    const { event, seats } = eventData;

    return (
        <main className="mx-auto min-h-screen max-w-7xl px-5 pb-20 pt-28 sm:px-8">
            <Link
                to="/#events"
                className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
            >
                <ArrowLeft size={17} />
                Back to events
            </Link>

            <section className="mt-8 rounded-3xl border border-white/[0.08] bg-[#090909] p-6 sm:p-9">
                <p className="text-xs font-bold uppercase tracking-[0.35em] text-violet-400">
                    Select your scene
                </p>

                <h1 className="display-font mt-3 text-5xl text-white sm:text-7xl">
                    {event.name}
                </h1>

                <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm text-zinc-400">
                    <span className="flex items-center gap-2">
                        <CalendarDays
                            size={17}
                            className="text-violet-400"
                        />
                        {new Intl.DateTimeFormat("en-IN", {
                            dateStyle: "full",
                            timeStyle: "short",
                        }).format(new Date(event.dateTime))}
                    </span>

                    <span className="flex items-center gap-2">
                        <MapPin
                            size={17}
                            className="text-violet-400"
                        />
                        {event.venue}
                    </span>

                    <span className="flex items-center gap-2">
                        <Ticket
                            size={17}
                            className="text-violet-400"
                        />
                        {event.availableSeatCount} seats available
                    </span>
                </div>

                <div className="mt-9 rounded-2xl border border-violet-500/20 bg-violet-500/[0.06] p-6">
                    <p className="text-sm leading-6 text-violet-200">
                        Event loaded successfully with{" "}
                        <strong>{seats.length}</strong> seats.
                        Interactive seat selection, reservation
                        countdown and booking confirmation are added
                        in the next checkpoint.
                    </p>
                </div>
            </section>
        </main>
    );
}