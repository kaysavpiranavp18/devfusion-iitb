import { useParams } from 'react-router-dom';
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout';
import { ActivityFeed } from '../components/activity/ActivityFeed';

export function ProjectActivityPage() {
  const { workspaceId, projectId } = useParams<{ workspaceId: string; projectId: string }>();

  return (
    <WorkspaceLayout>
      <div className="h-full flex flex-col">
        {/* Content */}
        <div className="flex-1 overflow-auto">
          <ActivityFeed workspaceId={workspaceId!} projectId={projectId} />
        </div>
      </div>
    </WorkspaceLayout>
  );
}
