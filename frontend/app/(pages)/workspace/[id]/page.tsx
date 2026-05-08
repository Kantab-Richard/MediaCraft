import { ProjectDetail } from "@/components/pages/workspace/project-detail";

export default async function WorkspaceProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ProjectDetail projectId={id} />;
}
