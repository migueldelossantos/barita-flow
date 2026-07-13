import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-3xl font-bold text-gray-900">BaristaFlow</h1>
      <p className="max-w-md text-gray-600">
        Sistema de pedidos multi-negocio. Accede al menú de un negocio con su
        enlace único.
      </p>
      <Link
        href="/menu/af605a6c-60dd-486b-8a61-a168533cd726"
        className="rounded-lg bg-brand-green px-6 py-3 font-medium text-white hover:bg-brand-green-dark"
      >
        Ver menú demo
      </Link>
      <div className="flex gap-4 text-sm">
        <Link href="/admin" className="text-brand-blue underline">
          Panel del negocio
        </Link>
        <Link href="/super-admin" className="text-gray-500 underline">
          Super Admin
        </Link>
      </div>
    </main>
  );
}
