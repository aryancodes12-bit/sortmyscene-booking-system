import {
    useCallback,
    useState,
} from "react";

import {
    confirmBooking,
    getApiErrorMessage,
    reserveSeats,
} from "../api";

export function useReservation() {
    const [reservation, setReservation] =
        useState(null);

    const [booking, setBooking] =
        useState(null);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const reserve = useCallback(
        async (eventId, seatNumbers) => {
            setLoading(true);
            setError("");

            try {
                const response = await reserveSeats({
                    eventId,
                    seatNumbers,
                });

                const nextReservation =
                    response.data.data.reservation;

                setReservation(nextReservation);

                return nextReservation;
            } catch (requestError) {
                setError(
                    getApiErrorMessage(
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

    const confirm = useCallback(async () => {
        if (!reservation?.id) {
            throw new Error(
                "No active reservation exists",
            );
        }

        setLoading(true);
        setError("");

        try {
            const response = await confirmBooking({
                reservationId: reservation.id,
            });

            const confirmedBooking =
                response.data.data.booking;

            setBooking(confirmedBooking);

            return confirmedBooking;
        } catch (requestError) {
            setError(
                getApiErrorMessage(
                    requestError,
                    "Unable to confirm booking",
                ),
            );

            throw requestError;
        } finally {
            setLoading(false);
        }
    }, [reservation]);

    const clear = useCallback(() => {
        setReservation(null);
        setBooking(null);
        setError("");
    }, []);

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