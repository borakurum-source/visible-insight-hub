import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/makaleler")({
  component: MakalelerLayout,
});

function MakalelerLayout() {
  return <Outlet />;
}
