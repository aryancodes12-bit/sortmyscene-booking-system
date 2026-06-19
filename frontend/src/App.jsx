function App() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <section className="w-full max-w-2xl rounded-2xl border border-white/10 bg-zinc-950 p-10 text-center shadow-2xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.35em] text-violet-400">
          SortMyScene
        </p>

        <h1 className="text-4xl font-bold sm:text-5xl">
          Booking system initialized
        </h1>

        <p className="mt-4 text-zinc-400">
          React, Vite and Tailwind CSS are working correctly.
        </p>

        <div className="mx-auto mt-8 h-1 w-24 rounded-full bg-violet-500" />
      </section>
    </main>
  );
}

export default App;