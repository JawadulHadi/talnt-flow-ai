import { createFileRoute } from "@tanstack/react-router";
import { KanbanPipelineBoard } from "@/components/kanban-pipeline-board";

export const Route = createFileRoute("/pipeline")({
  validateSearch: (search: Record<string, unknown>): { job?: string } =>
    typeof search["job"] === "string" && search["job"] ? { job: search["job"] } : {},
  head: () => ({
    meta: [
      { title: "Candidate Pipeline — TalntFlow AI" },
      {
        name: "description",
        content:
          "Kanban pipeline board for moving candidates through Sourced, Screened, Interviewing, Offer and Hired.",
      },
      { property: "og:title", content: "Candidate Pipeline — TalntFlow AI" },
      {
        property: "og:description",
        content: "Per-job candidate pipeline with drag-and-drop stages.",
      },
    ],
  }),
  component: PipelinePage,
});

function PipelinePage() {
  const { job } = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <KanbanPipelineBoard
      jobId={job}
      onJobChange={(next) => void navigate({ search: next ? { job: next } : {} })}
    />
  );
}
