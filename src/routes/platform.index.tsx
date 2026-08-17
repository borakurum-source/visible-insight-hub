import { createFileRoute, redirect } from "@tanstack/react-router";

// "/platform" ve "/ozellikler" ayni icerigi anlatiyordu.
// Tek urun sayfasi /ozellikler oldu; bu rota kalici olarak oraya yonlendirir.
export const Route = createFileRoute("/platform/")({
  beforeLoad: () => {
    throw redirect({ to: "/ozellikler", statusCode: 301 });
  },
});
