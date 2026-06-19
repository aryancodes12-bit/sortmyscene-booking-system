import { Link } from "react-router";



const formatDate = (dateTime) =>
    new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    })
        .format(new Date(dateTime))
        .toUpperCase();

const formatTime = (dateTime) =>
    new Intl.DateTimeFormat("en-IN", {
        hour: "numeric",
        minute: "2-digit",
    })
        .format(new Date(dateTime))
        .toUpperCase();

export default function EventCard({
    event,
}) {
    const presentation = {
        category:
            event.category || "NIGHTLIFE",

        tag:
            event.tag || "",

        price:
            Number(event.price) || 0,

        accent:
            event.accent || "#8B5CF6",

        theme:
            event.theme || "purple",
    };
    const soldOut =
        event.availableSeatCount === 0;

    return (
        <Link
            to={`/events/${event.id}`}
            className={`reference-event-card reference-event-card--${presentation.theme}`}
            style={{
                "--event-accent":
                    presentation.accent,
            }}
            aria-label={`View ${event.name}`}
        >
            <div className="reference-event-band">
                <span className="reference-event-category">
                    {presentation.category}
                </span>

                <span className="reference-event-tag">
                    {presentation.tag}
                </span>
            </div>

            <div className="reference-event-body">
                <h3>{event.name}</h3>

                <p className="reference-event-venue">
                    📍 {event.venue}
                </p>

                <div className="reference-event-meta">
                    <span>
                        🗓️ {formatDate(event.dateTime)}
                    </span>

                    <span>
                        🕙 {formatTime(event.dateTime)} ONWARDS
                    </span>
                </div>

                <div className="reference-event-footer">
                    <div>
                        <strong>
                            ₹
                            {presentation.price.toLocaleString(
                                "en-IN",
                            )}
                        </strong>

                        <small> / person</small>
                    </div>

                    <span
                        className={
                            soldOut
                                ? "reference-event-sold-out"
                                : ""
                        }
                    >
                        {soldOut
                            ? "SOLD OUT"
                            : `${event.availableSeatCount} seats`}
                    </span>
                </div>
            </div>
        </Link>
    );
}