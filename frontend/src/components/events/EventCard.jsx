import {
    ArrowUpRight,
    CalendarDays,
    MapPin,
    Ticket,
} from "lucide-react";

import { Link } from "react-router";

import heroImage from "../../assets/hero.png";

const formatDate = (dateTime) =>
    new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(dateTime));

export default function EventCard({ event }) {
    const soldOut =
        event.availableSeatCount === 0;

    return (
        <article className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-[#090909] transition duration-300 hover:-translate-y-1 hover:border-violet-500/40">
            <div className="relative h-56 overflow-hidden">
                <img
                    src={event.imageUrl || heroImage}
                    alt=""
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#090909] via-black/20 to-transparent" />

                <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/65 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
                    {event.availableSeatCount} seats left
                </div>
            </div>

            <div className="p-5">
                <h3 className="display-font text-3xl text-white">
                    {event.name}
                </h3>

                <div className="mt-4 space-y-2.5 text-sm text-zinc-400">
                    <div className="flex items-start gap-3">
                        <CalendarDays
                            size={16}
                            className="mt-0.5 shrink-0 text-violet-400"
                        />
                        {formatDate(event.dateTime)}
                    </div>

                    <div className="flex items-start gap-3">
                        <MapPin
                            size={16}
                            className="mt-0.5 shrink-0 text-violet-400"
                        />
                        {event.venue}
                    </div>

                    <div className="flex items-start gap-3">
                        <Ticket
                            size={16}
                            className="mt-0.5 shrink-0 text-violet-400"
                        />
                        {event.bookedSeatCount} already booked
                    </div>
                </div>

                <Link
                    to={`/events/${event.id}`}
                    aria-disabled={soldOut}
                    className={`mt-6 flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-wider transition ${soldOut
                            ? "pointer-events-none bg-zinc-800 text-zinc-500"
                            : "bg-white text-black hover:bg-[#8B5CF6] hover:text-white"
                        }`}
                >
                    {soldOut
                        ? "Sold Out"
                        : "View Seats"}

                    {!soldOut && (
                        <ArrowUpRight size={18} />
                    )}
                </Link>
            </div>
        </article>
    );
}