import { NextResponse } from 'next/server';
import { supabase } from '@/app/supabase';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Find magic link with user data
    const { data: magicLink, error: linkError } = await supabase
      .from('magic_links')
      .select(`
        id,
        user_id,
        expires_at,
        used_at,
        users!inner(id, email)
      `)
      .eq('token', token)
      .single();

    if (linkError || !magicLink) {
      return NextResponse.json(
        { error: 'Invalid or expired magic link' },
        { status: 401 }
      );
    }

    // Check if already used
    if (magicLink.used_at) {
      return NextResponse.json(
        { error: 'This magic link has already been used' },
        { status: 401 }
      );
    }

    // Check if expired
    if (new Date(magicLink.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This magic link has expired' },
        { status: 401 }
      );
    }

    // Mark as used
    await supabase
      .from('magic_links')
      .update({ used_at: new Date().toISOString() })
      .eq('id', magicLink.id);

    // Update last login
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', magicLink.user_id);

    // Return user data
    const user = (magicLink as any).users;

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      }
    });

  } catch (error: any) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
