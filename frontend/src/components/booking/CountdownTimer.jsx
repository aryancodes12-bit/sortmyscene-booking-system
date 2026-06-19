import {
    useEffect,
    useRef,
    useState,
} from "react";

const getRemainingSeconds = (
    expiresAt,
) =>
    Math.max(
        0,
        Math.ceil(
            (
                new Date(expiresAt).getTime() -
                Date.now()
            ) / 1000,
        ),
    );

export default function CountdownTimer({
    expiresAt,
    onExpire,
}) {
    const [seconds, setSeconds] =
        useState(() =>
            getRemainingSeconds(expiresAt),
        );

    const expiryHandled =
        useRef(false);

    useEffect(() => {
        expiryHandled.current = false;

        const updateTimer = () => {
            const remaining =
                getRemainingSeconds(expiresAt);

            setSeconds(remaining);

            if (
                remaining === 0 &&
                !expiryHandled.current
            ) {
                expiryHandled.current = true;
                onExpire();
            }
        };

        updateTimer();

        const interval =
            window.setInterval(
                updateTimer,
                1000,
            );

        return () => {
            window.clearInterval(interval);
        };
    }, [expiresAt, onExpire]);

    const minutes =
        Math.floor(seconds / 60);

    const remainingSeconds =
        seconds % 60;

    const urgent =
        seconds <= 60;

    return (
        <section
            className={
                urgent
                    ? "booking-countdown booking-countdown--urgent"
                    : "booking-countdown"
            }
        >
            <p>RESERVATION EXPIRES IN</p>

            <strong>
                {String(minutes).padStart(
                    2,
                    "0",
                )}
                :
                {String(
                    remainingSeconds,
                ).padStart(2, "0")}
            </strong>
        </section>
    );
}