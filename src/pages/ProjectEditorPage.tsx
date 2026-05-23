import { WorkspaceLayout } from '../components/layout/WorkspaceLayout';
import { CodeEditor } from '../components/editor/CodeEditor';

export function ProjectEditorPage() {
  return (
    <WorkspaceLayout>
      <CodeEditor />
    </WorkspaceLayout>
  );
}
