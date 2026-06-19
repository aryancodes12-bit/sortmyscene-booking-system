import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Link,
    useNavigate,
    useParams,
} from "react-router";

import {
    getApiErrorMessage,
    getEvent,
} from "../api";

import CountdownTimer from "../components/booking/CountdownTimer";
import SeatGrid from "../components/booking/SeatGrid";

import { useAuth } from "../context/AuthContext";
import { getEventPresentation } from "../data/eventPresentation";
import { useReservation } from "../hooks/useReservation";

const formatDateTime = (
    dateTime,
) =>
    new Intl.DateTimeFormat(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
        },
    )
        .format(new Date(dateTime))
        .toUpperCase();

export default function EventDetail() {
    const { eventId } =
        useParams();

    const navigate =
        useNavigate();

    const {
        isAuthenticated,
    } = useAuth();

    const [
        eventData,
        setEventData,
    ] = useState(null);

    const [
        selectedSeats,
        setSelectedSeats,
    ] = useState([]);

    const [
        pageLoading,
        setPageLoading,
    ] = useState(true);

    const [
        pageError,
        setPageError,
    ] = useState("");

    const {
        reservation,
        booking,
        loading,
        error,
        setError,
        reserve,
        confirm,
        clear,
    } = useReservation(eventId);

    const loadEvent =
        useCallback(
            async ({
                silent = false,
            } = {}) => {
                if (!silent) {
                    setPageLoading(true);
                }

                setPageError("");

                try {
                    const response =
                        await getEvent(eventId);

                    setEventData(
                        response.data.data,
                    );
                } catch (
                requestError
                ) {
                    setPageError(
                        getApiErrorMessage(
                            requestError,
                            "Unable to load event",
                        ),
                    );
                } finally {
                    if (!silent) {
                        setPageLoading(false);
                    }
                }
            },
            [eventId],
        );

    useEffect(() => {
        setSelectedSeats([]);
        loadEvent();
    }, [
        eventId,
        loadEvent,
    ]);

    const event =
        eventData?.event;

    const seats =
        eventData?.seats || [];

    const presentation =
        useMemo(
            () =>
                event
                    ? getEventPresentation(
                        event,
                    )
                    : null,
            [event],
        );

    const toggleSeat = (
        seatNumber,
    ) => {
        setError("");

        setSelectedSeats(
            (current) => {
                if (
                    current.includes(
                        seatNumber,
                    )
                ) {
                    return current.filter(
                        (seat) =>
                            seat !==
                            seatNumber,
                    );
                }

                if (
                    current.length >= 6
                ) {
                    setError(
                        "A maximum of 6 seats can be reserved at once.",
                    );

                    return current;
                }

                return [
                    ...current,
                    seatNumber,
                ];
            },
        );
    };

    const handleReserve =
        async () => {
            if (
                selectedSeats.length ===
                0
            ) {
                setError(
                    "Please select at least one seat.",
                );

                return;
            }

            if (!isAuthenticated) {
                navigate(
                    `/auth?redirect=${encodeURIComponent(
                        `/events/${eventId}`,
                    )}`,
                );

                return;
            }

            try {
                await reserve(
                    eventId,
                    selectedSeats,
                );

                await loadEvent({
                    silent: true,
                });
            } catch (
            requestError
            ) {
                if (
                    requestError
                        .response
                        ?.status === 409
                ) {
                    setSelectedSeats(
                        [],
                    );

                    await loadEvent({
                        silent: true,
                    });
                }
            }
        };

    const handleExpire =
        useCallback(
            async () => {
                clear();
                setSelectedSeats([]);

                setError(
                    "Your reservation expired. Please select seats again.",
                );

                await loadEvent({
                    silent: true,
                });
            },
            [
                clear,
                loadEvent,
                setError,
            ],
        );

    const handleConfirm =
        async () => {
            try {
                await confirm();

                await loadEvent({
                    silent: true,
                });
            } catch (
            requestError
            ) {
                if (
                    requestError
                        .response
                        ?.status === 410
                ) {
                    await handleExpire();
                }
            }
        };

    if (pageLoading) {
        return (
            <main className="booking-page booking-page-state">
                LOADING EVENT...
            </main>
        );
    }

    if (
        pageError ||
        !event ||
        !presentation
    ) {
        return (
            <main className="booking-page booking-page-state">
                <p>
                    {pageError ||
                        "Event not found"}
                </p>

                <button
                    type="button"
                    onClick={() =>
                        loadEvent()
                    }
                >
                    TRY AGAIN
                </button>
            </main>
        );
    }

    if (booking) {
        return (
            <main className="booking-page">
                <section className="booking-success">
                    <div className="booking-success-icon">
                        🎉
                    </div>

                    <h1>
                        BOOKING CONFIRMED!
                    </h1>

                    <p>
                        Booking reference:
                        {" "}
                        <strong>
                            {booking.reference}
                        </strong>
                    </p>

                    <p>
                        Seats:
                        {" "}
                        {booking.seatNumbers.join(
                            ", ",
                        )}
                    </p>

                    <p>
                        {event.name}
                        {" · "}
                        {event.venue}
                    </p>

                    <Link
                        to="/"
                        className="booking-primary-button"
                    >
                        BROWSE MORE EVENTS
                    </Link>
                </section>
            </main>
        );
    }

    return (
        <main className="booking-page">
            <Link
                to="/#events"
                className="booking-back-link"
            >
                ← Back to events
            </Link>

            <section
                className={`booking-event-header booking-event-header--${presentation.theme}`}
                style={{
                    "--event-accent":
                        presentation.accent,
                }}
            >
                <span className="reference-event-category">
                    {presentation.category}
                </span>

                <h1>
                    {event.name}
                </h1>

                <div className="booking-event-meta">
                    <span>
                        📍 {event.venue}
                    </span>

                    <span>
                        🗓️
                        {" "}
                        {formatDateTime(
                            event.dateTime,
                        )}
                    </span>

                    <strong>
                        ₹
                        {presentation.price.toLocaleString(
                            "en-IN",
                        )}
                        {" "}
                        / person
                    </strong>
                </div>
            </section>

            {reservation && (
                <CountdownTimer
                    expiresAt={
                        reservation.expiresAt
                    }
                    onExpire={
                        handleExpire
                    }
                />
            )}

            {!reservation && (
                <section className="booking-seat-panel">
                    <h2>
                        SELECT YOUR SEATS
                    </h2>

                    <SeatGrid
                        seats={seats}
                        selectedSeats={
                            selectedSeats
                        }
                        onToggle={
                            toggleSeat
                        }
                    />
                </section>
            )}

            <section className="booking-action-panel">
                {!reservation &&
                    selectedSeats.length >
                    0 && (
                        <div className="booking-summary">
                            <span>
                                SELECTED:
                                {" "}
                                <strong>
                                    {selectedSeats.join(
                                        ", ",
                                    )}
                                </strong>
                            </span>

                            <b>
                                ₹
                                {(
                                    selectedSeats.length *
                                    presentation.price
                                ).toLocaleString(
                                    "en-IN",
                                )}
                            </b>
                        </div>
                    )}

                {reservation && (
                    <div className="booking-summary">
                        <span>
                            RESERVED:
                            {" "}
                            <strong>
                                {reservation.seatNumbers.join(
                                    ", ",
                                )}
                            </strong>
                        </span>

                        <b>
                            ₹
                            {(
                                reservation
                                    .seatNumbers
                                    .length *
                                presentation.price
                            ).toLocaleString(
                                "en-IN",
                            )}
                        </b>
                    </div>
                )}

                {error && (
                    <p className="booking-error">
                        {error}
                    </p>
                )}

                {!reservation ? (
                    <button
                        type="button"
                        className="booking-primary-button"
                        disabled={loading}
                        onClick={
                            handleReserve
                        }
                    >
                        {loading
                            ? "RESERVING..."
                            : `RESERVE ${selectedSeats.length ||
                            ""
                            } SEAT(S) →`}
                    </button>
                ) : (
                    <button
                        type="button"
                        className="booking-primary-button"
                        disabled={loading}
                        onClick={
                            handleConfirm
                        }
                    >
                        {loading
                            ? "CONFIRMING..."
                            : "CONFIRM BOOKING →"}
                    </button>
                )}
            </section>
        </main>
    );
}