import {
    ArrowDown,
    MapPin,
    Sparkles,
} from "lucide-react";

import {
    useCallback,
    useEffect,
    useState,
} from "react";

import heroImage from "../assets/hero.png";
import {
    getApiErrorMessage,
    getEvents,
} from "../api";

import ErrorMessage from "../components/common/ErrorMessage";
import Loader from "../components/common/Loader";
import EventCard from "../components/events/EventCard";

export default function Home() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] =
        useState(true);
    const [error, setError] = useState("");

    const loadEvents = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await getEvents();
            setEvents(response.data.data.events);
        } catch (requestError) {
            setError(
                getApiErrorMessage(
                    requestError,
                    "Unable to load events",
                ),
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadEvents();
    }, [loadEvents]);

    return (
        <>
            <section className="relative flex min-h-screen items-end overflow-hidden pb-20 pt-32">
                <img
                    src={heroImage}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover opacity-65"
                />

                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/20" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/35" />

                <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8">
                    <div className="max-w-4xl">
                        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-violet-300 backdrop-blur-md">
                            <Sparkles size={15} />
                            Mumbai after dark
                        </div>

                        <h1 className="display-font text-gradient text-[4.5rem] leading-[0.84] sm:text-[7rem] lg:text-[9rem]">
                            DISCOVER
                            <br />
                            NIGHTLIFE
                            <br />
                            AROUND YOU
                        </h1>

                        <p className="mt-7 max-w-xl text-base leading-7 text-zinc-300 sm:text-lg">
                            Find Mumbai&apos;s most electric events,
                            choose your seats and lock in your night
                            before someone else does.
                        </p>

                        <div className="mt-9 flex flex-wrap items-center gap-4">
                            <a
                                href="#events"
                                className="inline-flex items-center gap-3 rounded-full bg-[#8B5CF6] px-7 py-3.5 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-violet-500"
                            >
                                Explore Events
                                <ArrowDown size={18} />
                            </a>

                            <div className="flex items-center gap-2 text-sm text-zinc-400">
                                <MapPin
                                    size={17}
                                    className="text-violet-400"
                                />
                                Curated in Mumbai
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section
                id="events"
                className="mx-auto max-w-7xl scroll-mt-24 px-5 py-24 sm:px-8"
            >
                <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.35em] text-violet-400">
                            Happening next
                        </p>

                        <h2 className="display-font mt-3 text-5xl text-white sm:text-6xl">
                            FEATURED EVENTS
                        </h2>
                    </div>

                    <p className="max-w-md text-sm leading-6 text-zinc-500">
                        Live seat availability is loaded directly
                        from the booking API.
                    </p>
                </div>

                {loading ? (
                    <Loader label="Loading Mumbai events..." />
                ) : error ? (
                    <ErrorMessage
                        message={error}
                        onRetry={loadEvents}
                    />
                ) : events.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-zinc-500">
                        No events are currently available.
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {events.map((event) => (
                            <EventCard
                                key={event.id}
                                event={event}
                            />
                        ))}
                    </div>
                )}
            </section>
        </>
    );
}