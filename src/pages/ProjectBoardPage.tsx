import { useParams } from 'react-router-dom';
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout';
import { KanbanBoard } from '../components/kanban/KanbanBoard';

export function ProjectBoardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  return (
    <WorkspaceLayout>
      <KanbanBoard projectId={projectId!} />
    </WorkspaceLayout>
  );
}
