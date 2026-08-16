import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/free-ai-readiness-report")({
  beforeLoad: () => {
    throw redirect({ to: "/ucretsiz-yapay-zeka-gorunurluk-raporu", statusCode: 301 });
  },
  component: () => null,
});
