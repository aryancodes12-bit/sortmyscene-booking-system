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
            <section
                className="home-how-it-works"
                aria-labelledby="how-it-works-title"
            >
                <div className="home-section-heading">
                    <span>BOOKING MADE SIMPLE</span>

                    <h2 id="how-it-works-title">
                        HOW IT WORKS
                    </h2>

                    <p>
                        Discover events, reserve your preferred seats and
                        complete your booking before the reservation expires.
                    </p>
                </div>

                <div className="home-steps-grid">
                    <article className="home-step-card">
                        <span className="home-step-number">01</span>

                        <h3>CHOOSE AN EVENT</h3>

                        <p>
                            Explore curated nightlife events and view live seat
                            availability before making your selection.
                        </p>
                    </article>

                    <article className="home-step-card">
                        <span className="home-step-number">02</span>

                        <h3>RESERVE YOUR SEATS</h3>

                        <p>
                            Select multiple available seats and hold them securely
                            for ten minutes.
                        </p>
                    </article>

                    <article className="home-step-card">
                        <span className="home-step-number">03</span>

                        <h3>CONFIRM YOUR BOOKING</h3>

                        <p>
                            Confirm before the timer expires and receive your
                            booking reference instantly.
                        </p>
                    </article>
                </div>
            </section>

            <section className="home-trust-strip">
                <div className="home-trust-icon" aria-hidden="true">
                    ✓
                </div>

                <div>
                    <h2>
                        SECURE BOOKING. LIVE AVAILABILITY. NO DOUBLE BOOKINGS.
                    </h2>

                    <p>
                        Every reservation is processed transactionally, preventing
                        the same seat from being booked by multiple users.
                    </p>
                </div>
            </section>

            <footer className="home-footer">
                <div>
                    <strong>
                        SORT<span>MY</span>SCENE
                    </strong>

                    <p>
                        Secure, conflict-free event seat booking.
                    </p>
                </div>

                <div className="home-footer-links">
                    <a
                        href="https://github.com/aryancodes12-bit/sortmyscene-booking-system"
                        target="_blank"
                        rel="noreferrer"
                    >
                        GITHUB
                    </a>

                    <a
                        href="http://localhost:5000/api/events"
                        target="_blank"
                        rel="noreferrer"
                    >
                        API STATUS
                    </a>
                </div>
            </footer>
        </main>
    );
}