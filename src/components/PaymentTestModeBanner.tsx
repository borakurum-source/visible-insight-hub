import { getPaddleEnvironment } from "@/lib/paddle";

export function PaymentTestModeBanner() {
  if (getPaddleEnvironment() !== "sandbox") return null;
  return (
    <div className="w-full border-b border-amber-500/40 bg-amber-500/10 px-4 py-1.5 text-center text-xs text-amber-600 dark:text-amber-300">
      Onizlemedeki tum odemeler test modundadir.{" "}
      <a
        href="https://docs.lovable.dev/features/payments#test-and-live-environments"
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium underline"
      >
        Detay
      </a>
    </div>
  );
}
