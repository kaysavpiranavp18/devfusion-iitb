import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { AuthenticatedRequest } from '../types';

export async function signUp(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ success: false, error: 'Email, password, and name are required' });
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      return res.status(400).json({ success: false, error: authError?.message || 'Failed to sign up' });
    }

    // Insert user profile
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}&backgroundColor=b6e3f4`;
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        name,
        email,
        avatar: avatarUrl,
        skills: []
      })
      .select()
      .single();

    if (profileError) {
      // Cleanup auth user if profile insertion fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({ success: false, error: profileError.message || 'Failed to create user profile' });
    }

    return res.status(201).json({
      success: true,
      data: {
        user: profileData,
        session: authData.session
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !authData.user || !authData.session) {
      return res.status(400).json({ success: false, error: authError?.message || 'Invalid login credentials' });
    }

    // Fetch profile details
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      return res.status(500).json({ success: false, error: 'Failed to fetch user profile' });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: profileData,
        session: {
          access_token: authData.session.access_token,
          expires_at: authData.session.expires_at,
          refresh_token: authData.session.refresh_token,
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    // Auth token is client side state. We can call Supabase signOut, but we return success directly.
    await supabase.auth.signOut();
    return res.status(200).json({
      success: true,
      data: { message: 'Logged out successfully' }
    });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (profileError || !profileData) {
      return res.status(404).json({ success: false, error: 'Profile not found' });
    }

    return res.status(200).json({
      success: true,
      data: profileData
    });
  } catch (err) {
    next(err);
  }
}
