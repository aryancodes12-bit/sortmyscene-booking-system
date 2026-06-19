import { Link } from "react-router";

export default function NotFound() {
    return (
        <main className="flex min-h-screen items-center justify-center px-5 text-center">
            <div>
                <p className="display-font text-8xl text-violet-500">
                    404
                </p>

                <h1 className="display-font mt-3 text-4xl text-white">
                    SCENE NOT FOUND
                </h1>

                <Link
                    to="/"
                    className="mt-7 inline-block rounded-full bg-white px-6 py-3 text-sm font-bold uppercase tracking-wider text-black"
                >
                    Return home
                </Link>
            </div>
        </main>
    );
}