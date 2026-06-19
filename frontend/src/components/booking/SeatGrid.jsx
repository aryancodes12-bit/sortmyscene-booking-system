const LEGEND_ITEMS = [
    ["available", "Available"],
    ["selected", "Selected"],
    ["reserved", "Reserved"],
    ["booked", "Booked"],
];

export default function SeatGrid({
    seats,
    selectedSeats,
    onToggle,
}) {
    return (
        <div>
            <div className="seat-legend">
                {LEGEND_ITEMS.map(
                    ([status, label]) => (
                        <div
                            key={status}
                            className="seat-legend-item"
                        >
                            <span
                                className={`seat-swatch seat-swatch--${status}`}
                            />

                            <span>{label}</span>
                        </div>
                    ),
                )}
            </div>

            <div className="booking-stage">
                STAGE
            </div>

            <div className="seat-grid-wrap">
                <div className="seat-grid">
                    {seats.map((seat) => {
                        const isSelected =
                            selectedSeats.includes(
                                seat.seatNumber,
                            );

                        const visualStatus =
                            isSelected
                                ? "selected"
                                : seat.status;

                        const isDisabled =
                            seat.status !== "available";

                        return (
                            <button
                                key={seat.seatNumber}
                                type="button"
                                disabled={isDisabled}
                                onClick={() =>
                                    onToggle(seat.seatNumber)
                                }
                                className={`seat seat--${visualStatus}`}
                                title={`${seat.seatNumber} — ${visualStatus}`}
                                aria-label={`Seat ${seat.seatNumber}, ${visualStatus}`}
                            >
                                {seat.seatNumber}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}