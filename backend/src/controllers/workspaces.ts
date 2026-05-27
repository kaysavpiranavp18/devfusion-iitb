import { Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { AuthenticatedRequest } from '../types';
import { signToken, verifyToken } from '../lib/tokens';
import { sendInvitationEmail } from '../lib/email';


// Helper to check user access to a workspace
async function checkWorkspaceAccess(userId: string, workspaceId: string) {
  const { data: membership, error } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !membership) return null;
  return membership.role;
}

export async function getWorkspaces(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    // Fetch workspaces the user is a member of
    const { data: memberships, error: memError } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', req.user.id);

    if (memError || !memberships) {
      return res.status(200).json({ success: true, data: [] });
    }

    const wsIds = memberships.map(m => m.workspace_id);
    if (wsIds.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const { data: workspaces, error: wsError } = await supabase
      .from('workspaces')
      .select('*, members:workspace_members(*, user:profiles(*)), projects(id)')
      .in('id', wsIds);

    if (wsError || !workspaces) {
      return res.status(400).json({ success: false, error: wsError?.message || 'Failed to fetch workspaces' });
    }

    // Format response to match frontend shapes
    const mapped = workspaces.map(ws => ({
      id: ws.id,
      name: ws.name,
      description: ws.description,
      logo: ws.logo,
      ownerId: ws.owner_id,
      plan: ws.plan,
      createdAt: ws.created_at,
      members: (ws.members || []).map((m: any) => ({
        user: {
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
          avatar: m.user.avatar,
          bio: m.user.bio,
          skills: m.user.skills,
          github: m.user.github,
          createdAt: m.user.created_at
        },
        role: m.role,
        joinedAt: m.joined_at
      })),
      projects: (ws.projects || []).map((p: any) => p.id)
    }));

    return res.status(200).json({ success: true, data: mapped });
  } catch (err) {
    next(err);
  }
}

export async function createWorkspace(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const { name, description, logo, plan } = req.body;

    if (!name || !description) {
      return res.status(400).json({ success: false, error: 'Name and description are required' });
    }

    // Insert workspace
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .insert({
        name,
        description,
        logo,
        owner_id: req.user.id,
        plan: plan || 'free'
      })
      .select()
      .single();

    if (wsError || !workspace) {
      return res.status(400).json({ success: false, error: wsError?.message || 'Failed to create workspace' });
    }

    // Insert owner workspace membership
    const { error: memError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspace.id,
        user_id: req.user.id,
        role: 'owner'
      });

    if (memError) {
      return res.status(500).json({ success: false, error: memError.message || 'Failed to create workspace membership' });
    }

    // Fetch user details for formatting
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    const formattedWorkspace = {
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      logo: workspace.logo,
      ownerId: workspace.owner_id,
      plan: workspace.plan,
      createdAt: workspace.created_at,
      members: [{
        user: userProfile,
        role: 'owner',
        joinedAt: workspace.created_at
      }],
      projects: []
    };

    return res.status(201).json({ success: true, data: formattedWorkspace });
  } catch (err) {
    next(err);
  }
}

export async function getWorkspaceById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const { id } = req.params;

    // Verify access
    const role = await checkWorkspaceAccess(req.user.id, id);
    if (!role) {
      return res.status(403).json({ success: false, error: 'Forbidden: You do not have access to this workspace' });
    }

    const { data: workspace, error } = await supabase
      .from('workspaces')
      .select('*, members:workspace_members(*, user:profiles(*)), projects(id)')
      .eq('id', id)
      .single();

    if (error || !workspace) {
      return res.status(404).json({ success: false, error: 'Workspace not found' });
    }

    const formatted = {
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      logo: workspace.logo,
      ownerId: workspace.owner_id,
      plan: workspace.plan,
      createdAt: workspace.created_at,
      members: (workspace.members || []).map((m: any) => ({
        user: {
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
          avatar: m.user.avatar,
          bio: m.user.bio,
          skills: m.user.skills,
          github: m.user.github,
          createdAt: m.user.created_at
        },
        role: m.role,
        joinedAt: m.joined_at
      })),
      projects: (workspace.projects || []).map((p: any) => p.id)
    };

    return res.status(200).json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
}

export async function updateWorkspace(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const { id } = req.params;
    const { name, description, logo } = req.body;

    const role = await checkWorkspaceAccess(req.user.id, id);
    if (role !== 'owner' && role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden: Admin access required' });
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (logo !== undefined) updates.logo = logo;
    updates.updated_at = new Date().toISOString();

    const { data: workspace, error } = await supabase
      .from('workspaces')
      .update(updates)
      .eq('id', id)
      .select('*, members:workspace_members(*, user:profiles(*)), projects(id)')
      .single();

    if (error || !workspace) {
      return res.status(400).json({ success: false, error: error?.message || 'Workspace not found' });
    }

    const formatted = {
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      logo: workspace.logo,
      ownerId: workspace.owner_id,
      plan: workspace.plan,
      createdAt: workspace.created_at,
      members: (workspace.members || []).map((m: any) => ({
        user: m.user,
        role: m.role,
        joinedAt: m.joined_at
      })),
      projects: (workspace.projects || []).map((p: any) => p.id)
    };

    return res.status(200).json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
}

export async function deleteWorkspace(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const { id } = req.params;

    const role = await checkWorkspaceAccess(req.user.id, id);
    if (role !== 'owner') {
      return res.status(403).json({ success: false, error: 'Forbidden: Only workspace owner can delete workspace' });
    }

    const { error } = await supabase
      .from('workspaces')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.status(200).json({ success: true, data: { message: 'Workspace deleted successfully' } });
  } catch (err) {
    next(err);
  }
}

export async function inviteWorkspaceMember(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const { id } = req.params;
    const { email, role } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const requesterRole = await checkWorkspaceAccess(req.user.id, id);
    if (requesterRole !== 'owner' && requesterRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden: Admin access required to invite members' });
    }

    // Get requester profile details
    const { data: requesterProfile } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('id', req.user.id)
      .single();
    const senderName = requesterProfile?.name || req.user.email || 'A team member';

    // Get workspace details
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('name')
      .eq('id', id)
      .single();
    if (wsError || !workspace) {
      return res.status(404).json({ success: false, error: 'Workspace not found' });
    }

    // Find profile of invited user
    const { data: invitedProfile, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email.trim())
      .maybeSingle();

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const inviteBaseUrl = process.env.INVITE_BASE_URL || clientUrl;

    if (profileErr || !invitedProfile) {
      // User does not exist, send signed token invite
      const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!secret) {
        return res.status(500).json({ success: false, error: 'Server configuration error' });
      }

      const token = signToken({
        email: email.trim(),
        workspaceId: id,
        workspaceName: workspace.name,
        role: role || 'member',
        invitedBy: req.user.id,
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days expiration
      }, secret);

      const acceptLink = `${inviteBaseUrl}/invite/accept?token=${token}`;

      await sendInvitationEmail({
        to: email.trim(),
        workspaceName: workspace.name,
        senderName,
        acceptLink,
        isRegistered: false
      });

      return res.status(200).json({
        success: true,
        message: 'Invitation email sent successfully to unregistered user',
        data: {
          email: email.trim(),
          role: role || 'member',
          pending: true
        }
      });
    }

    // Check if already a member
    const existingRole = await checkWorkspaceAccess(invitedProfile.id, id);
    if (existingRole) {
      return res.status(400).json({ success: false, error: 'User is already a member of this workspace' });
    }

    // Insert workspace member
    const { data: membership, error: memError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: id,
        user_id: invitedProfile.id,
        role: role || 'member'
      })
      .select()
      .single();

    if (memError || !membership) {
      return res.status(400).json({ success: false, error: memError?.message || 'Failed to add member' });
    }

    // Insert into activity logs!
    await supabase
      .from('activity_logs')
      .insert({
        workspace_id: id,
        type: 'member_joined',
        message: `${invitedProfile.name} joined the workspace`,
        user_id: invitedProfile.id
      });

    // Send notification email to registered user
    const acceptLink = `${clientUrl}/workspace/${id}/overview`;
    await sendInvitationEmail({
      to: email.trim(),
      workspaceName: workspace.name,
      senderName,
      acceptLink,
      isRegistered: true
    });

    return res.status(200).json({
      success: true,
      message: 'User added and notification email sent successfully',
      data: {
        user: invitedProfile,
        role: membership.role,
        joinedAt: membership.joined_at,
        pending: false
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function acceptWorkspaceInvite(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, error: 'Token is required' });
    }

    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!secret) {
      return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    const payload = verifyToken(token, secret);
    if (!payload) {
      return res.status(400).json({ success: false, error: 'Invalid or expired invitation token' });
    }

    // Fetch accepting user's profile
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (profileErr || !profile) {
      return res.status(404).json({ success: false, error: 'Profile not found' });
    }

    // Email match check
    if (profile.email.toLowerCase() !== payload.email.toLowerCase()) {
      return res.status(400).json({
        success: false,
        error: `This invitation was sent to ${payload.email}, but you are logged in as ${profile.email}.`
      });
    }

    // Check if already a member
    const existingRole = await checkWorkspaceAccess(profile.id, payload.workspaceId);
    if (existingRole) {
      return res.status(200).json({
        success: true,
        data: {
          workspaceId: payload.workspaceId,
          message: 'You are already a member of this workspace'
        }
      });
    }

    // Insert workspace member
    const { error: memError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: payload.workspaceId,
        user_id: profile.id,
        role: payload.role || 'member'
      });

    if (memError) {
      return res.status(400).json({ success: false, error: memError.message || 'Failed to add workspace member' });
    }

    // Insert into activity logs!
    await supabase
      .from('activity_logs')
      .insert({
        workspace_id: payload.workspaceId,
        type: 'member_joined',
        message: `${profile.name || profile.email} joined the workspace`,
        user_id: profile.id
      });

    return res.status(200).json({
      success: true,
      data: {
        workspaceId: payload.workspaceId,
        message: 'Successfully joined workspace'
      }
    });
  } catch (err) {
    next(err);
  }
}


export async function updateWorkspaceMemberRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const { id, userId } = req.params;
    const { role } = req.body;

    const requesterRole = await checkWorkspaceAccess(req.user.id, id);
    if (requesterRole !== 'owner' && requesterRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden: Admin access required to manage members' });
    }

    const memberRole = await checkWorkspaceAccess(userId, id);
    if (!memberRole) {
      return res.status(404).json({ success: false, error: 'Member not found in workspace' });
    }

    if (memberRole === 'owner') {
      return res.status(400).json({ success: false, error: 'Cannot update the owner role' });
    }

    const { data: updatedMembership, error } = await supabase
      .from('workspace_members')
      .update({ role })
      .eq('workspace_id', id)
      .eq('user_id', userId)
      .select('*, user:profiles(*)')
      .single();

    if (error || !updatedMembership) {
      return res.status(400).json({ success: false, error: error?.message || 'Failed to update role' });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: updatedMembership.user,
        role: updatedMembership.role,
        joinedAt: updatedMembership.joined_at
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function removeWorkspaceMember(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const { id, userId } = req.params;

    const requesterRole = await checkWorkspaceAccess(req.user.id, id);
    
    // User can remove themselves, or admins/owners can remove members
    if (req.user.id !== userId && requesterRole !== 'owner' && requesterRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden: Unauthorized to remove member' });
    }

    const memberRole = await checkWorkspaceAccess(userId, id);
    if (!memberRole) {
      return res.status(404).json({ success: false, error: 'Member not found in workspace' });
    }

    if (memberRole === 'owner') {
      return res.status(400).json({ success: false, error: 'Cannot remove the workspace owner' });
    }

    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('workspace_id', id)
      .eq('user_id', userId);

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.status(200).json({ success: true, data: { message: 'Member removed successfully' } });
  } catch (err) {
    next(err);
  }
}
