import { isOpen } from "@/lib/business-hours";

export const dynamic = "force-dynamic";

export default async function Home() {
  const open = await isOpen();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white font-sans">
      <div
        className={`rounded-3xl px-16 py-12 text-center shadow-lg ${
          open ? "bg-green-100 border-2 border-green-400" : "bg-red-100 border-2 border-red-400"
        }`}
      >
        <div
          className={`text-7xl font-black tracking-tight ${
            open ? "text-green-700" : "text-red-700"
          }`}
        >
          {open ? "OPEN" : "CLOSED"}
        </div>
        <p className="mt-4 text-gray-500 text-sm">
          Business hours: Mon–Fri 08:00–16:00 (Copenhagen)
        </p>
      </div>
      <p className="mt-8 text-xs text-gray-400">
        <a href="/api/open" className="underline">
          GET /api/open
        </a>{" "}
        returns <code>true</code> or <code>false</code>
      </p>
    </main>
  );
}
