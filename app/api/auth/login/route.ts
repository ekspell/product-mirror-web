import { NextResponse } from 'next/server';
import { supabase } from '@/app/supabase';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find or create user
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', normalizedEmail)
      .single();

    if (userError || !user) {
      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({ email: normalizedEmail })
        .select('id, email')
        .single();

      if (createError || !newUser) {
        console.error('User creation error:', createError);
        return NextResponse.json(
          { error: 'Failed to create user' },
          { status: 500 }
        );
      }

      user = newUser;

      // Create default team for new user
      const teamName = `${normalizedEmail.split('@')[0]}'s Team`;
      const { error: teamError } = await supabase
        .from('teams')
        .insert({
          name: teamName,
          user_id: user.id
        });

      if (teamError) {
        console.error('Failed to create default team:', teamError);
      }
    }

    // Generate magic link token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const { error: tokenError } = await supabase
      .from('magic_links')
      .insert({
        user_id: user.id,
        token,
        expires_at: expiresAt.toISOString()
      });

    if (tokenError) {
      console.error('Token creation error:', tokenError);
      return NextResponse.json(
        { error: 'Failed to generate magic link' },
        { status: 500 }
      );
    }

    // Generate magic link URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const magicLink = `${baseUrl}/verify-magic-link?token=${token}`;

    return NextResponse.json({
      success: true,
      magicLink
    });

  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
