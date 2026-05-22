import { useParams } from 'react-router-dom';
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout';
import { SnippetList } from '../components/snippets/SnippetList';

export function ProjectSnippetsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  return (
    <WorkspaceLayout>
      <SnippetList projectId={projectId!} />
    </WorkspaceLayout>
  );
}
