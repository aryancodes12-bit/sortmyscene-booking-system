import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    confirmBooking,
    getApiErrorMessage,
    reserveSeats,
} from "../api";

const STORAGE_PREFIX =
    "sortmyscene-active-reservation";

const getStorageKey = (eventId) =>
    `${STORAGE_PREFIX}:${eventId}`;

const removeStoredReservation = (eventId) => {
    if (!eventId) {
        return;
    }

    sessionStorage.removeItem(
        getStorageKey(eventId),
    );
};

const readStoredReservation = (eventId) => {
    if (!eventId) {
        return null;
    }

    try {
        const value = sessionStorage.getItem(
            getStorageKey(eventId),
        );

        if (!value) {
            return null;
        }

        const reservation = JSON.parse(value);

        if (
            !reservation?.expiresAt ||
            new Date(reservation.expiresAt).getTime() <=
            Date.now()
        ) {
            removeStoredReservation(eventId);
            return null;
        }

        return reservation;
    } catch {
        removeStoredReservation(eventId);
        return null;
    }
};

const storeReservation = (
    eventId,
    reservation,
) => {
    sessionStorage.setItem(
        getStorageKey(eventId),
        JSON.stringify(reservation),
    );
};

const getPayload = (response) =>
    response?.data?.data ??
    response?.data ??
    {};

const normalizeReservation = (
    response,
    fallbackEventId,
) => {
    const payload = getPayload(response);

    const rawReservation =
        payload?.reservation ??
        payload;

    const id =
        rawReservation?.id ??
        rawReservation?._id ??
        rawReservation?.reservationId;

    const expiresAt =
        rawReservation?.expiresAt;

    if (!id || !expiresAt) {
        throw new Error(
            "Reservation API returned an unexpected response shape",
        );
    }

    return {
        ...rawReservation,

        id,

        eventId:
            rawReservation?.eventId?.id ??
            rawReservation?.eventId?._id ??
            rawReservation?.eventId ??
            fallbackEventId,

        seatNumbers:
            rawReservation?.seatNumbers ??
            rawReservation?.seats ??
            [],
    };
};

const normalizeBooking = (
    response,
    reservation,
) => {
    const payload = getPayload(response);

    const rawBooking =
        payload?.booking ??
        payload;

    const id =
        rawBooking?.id ??
        rawBooking?._id ??
        rawBooking?.bookingId ??
        reservation.id;

    return {
        ...rawBooking,

        id,

        reference:
            rawBooking?.reference ??
            rawBooking?.bookingReference ??
            id,

        seatNumbers:
            rawBooking?.seatNumbers ??
            rawBooking?.seats ??
            reservation.seatNumbers,
    };
};

const getRequestErrorMessage = (
    error,
    fallback,
) => {
    if (!error?.response && error?.message) {
        return error.message;
    }

    return getApiErrorMessage(
        error,
        fallback,
    );
};

export function useReservation(eventId) {
    const [
        reservation,
        setReservation,
    ] = useState(null);

    const [booking, setBooking] =
        useState(null);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    useEffect(() => {
        setReservation(
            readStoredReservation(eventId),
        );

        setBooking(null);
        setError("");
    }, [eventId]);

    const reserve = useCallback(
        async (
            requestedEventId,
            seatNumbers,
        ) => {
            setLoading(true);
            setError("");

            try {
                const response =
                    await reserveSeats({
                        eventId:
                            requestedEventId,
                        seatNumbers,
                    });

                const nextReservation =
                    normalizeReservation(
                        response,
                        requestedEventId,
                    );

                setReservation(
                    nextReservation,
                );

                storeReservation(
                    requestedEventId,
                    nextReservation,
                );

                return nextReservation;
            } catch (requestError) {
                setError(
                    getRequestErrorMessage(
                        requestError,
                        "Unable to reserve selected seats",
                    ),
                );

                throw requestError;
            } finally {
                setLoading(false);
            }
        },
        [],
    );

    const confirm =
        useCallback(async () => {
            if (!reservation?.id) {
                throw new Error(
                    "No active reservation exists",
                );
            }

            setLoading(true);
            setError("");

            try {
                const response =
                    await confirmBooking({
                        reservationId:
                            reservation.id,
                    });

                const confirmedBooking =
                    normalizeBooking(
                        response,
                        reservation,
                    );

                setBooking(
                    confirmedBooking,
                );

                removeStoredReservation(
                    eventId,
                );

                setReservation(null);

                return confirmedBooking;
            } catch (requestError) {
                setError(
                    getRequestErrorMessage(
                        requestError,
                        "Unable to confirm booking",
                    ),
                );

                throw requestError;
            } finally {
                setLoading(false);
            }
        }, [eventId, reservation]);

    const clear = useCallback(() => {
        removeStoredReservation(eventId);

        setReservation(null);
        setBooking(null);
        setError("");
    }, [eventId]);

    return {
        reservation,
        booking,
        loading,
        error,
        setError,
        reserve,
        confirm,
        clear,
    };
}