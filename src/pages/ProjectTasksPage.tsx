import { useParams } from 'react-router-dom';
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout';
import { TaskListView } from '../components/tasks/TaskListView';

export function ProjectTasksPage() {
  const { projectId } = useParams<{ projectId: string }>();

  return (
    <WorkspaceLayout>
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-auto">
          <TaskListView projectId={projectId!} />
        </div>
      </div>
    </WorkspaceLayout>
  );
}
