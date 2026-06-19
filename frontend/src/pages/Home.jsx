import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    getApiErrorMessage,
    getEvents,
} from "../api";

import EventCard from "../components/events/EventCard";

export default function Home() {
    const [events, setEvents] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const loadEvents =
        useCallback(async () => {
            setLoading(true);
            setError("");

            try {
                const response =
                    await getEvents();

                setEvents(
                    response.data.data.events,
                );
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
        <main className="reference-home">
            <section className="reference-hero">
                <div className="hero-orb hero-orb--purple" />
                <div className="hero-orb hero-orb--pink" />

                <div className="reference-hero-content">
                    <p className="reference-hero-kicker">
                        INDIA&apos;S NIGHTLIFE PLATFORM
                    </p>

                    <h1>
                        <span>DISCOVER</span>

                        <span className="reference-hero-accent">
                            NIGHTLIFE
                        </span>

                        <span>AROUND YOU</span>
                    </h1>

                    <p className="reference-hero-copy">
                        Mumbai&apos;s one-stop-shop for
                        clubs, rooftops, live music &amp;
                        more.
                    </p>

                    <a
                        href="#events"
                        className="reference-hero-cta"
                    >
                        EXPLORE EVENTS →
                    </a>
                </div>
            </section>

            <section
                id="events"
                className="reference-events-section"
            >
                <p className="reference-section-kicker">
                    FEATURED THIS WEEKEND
                </p>

                <h2>UPCOMING EVENTS</h2>

                {loading ? (
                    <div className="reference-state-card">
                        LOADING EVENTS...
                    </div>
                ) : error ? (
                    <div className="reference-state-card reference-state-card--error">
                        <p>{error}</p>

                        <button
                            type="button"
                            onClick={loadEvents}
                        >
                            TRY AGAIN
                        </button>
                    </div>
                ) : events.length === 0 ? (
                    <div className="reference-state-card">
                        NO EVENTS AVAILABLE
                    </div>
                ) : (
                    <div className="reference-events-grid">
                        {events.map((event) => (
                            <EventCard
                                key={event.id}
                                event={event}
                            />
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}