import { createFileRoute } from "@tanstack/react-router";
import { KanbanPipelineBoard } from "@/components/kanban-pipeline-board";

export const Route = createFileRoute("/pipeline")({
  head: () => ({
    meta: [
      { title: "Candidate Pipeline — TalntFlow AI" },
      {
        name: "description",
        content:
          "Kanban pipeline board for visualizing candidate stages across Applied, Interviewing, Offer, and Hired.",
      },
      { property: "og:title", content: "Candidate Pipeline — TalntFlow AI" },
      {
        property: "og:description",
        content: "AI-powered ATS & job board candidate pipeline with drag-and-drop workflow.",
      },
    ],
  }),
  component: PipelinePage,
});

function PipelinePage() {
  return <KanbanPipelineBoard />;
}
