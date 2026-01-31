import { NextResponse } from 'next/server';
import { supabase } from '@/app/supabase';

export async function POST(request: Request) {
  try {
    const { name, stagingUrl, loginEmail, loginPassword, authState, userId } = await request.json();

    // Validation
    if (!name || !stagingUrl || !authState || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (authState === 'authenticated' && (!loginEmail || !loginPassword)) {
      return NextResponse.json(
        { error: 'Login credentials required for authenticated products' },
        { status: 400 }
      );
    }

    // Get user's teams
    const { data: teams, error: teamError } = await supabase
      .from('teams')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    let teamId: string;

    if (teamError || !teams || teams.length === 0) {
      // No team found - create a default team for this user
      const { data: newTeam, error: createTeamError } = await supabase
        .from('teams')
        .insert({
          user_id: userId,
          name: 'My Team'
        })
        .select('id')
        .single();

      if (createTeamError || !newTeam) {
        console.error('Team creation error:', createTeamError);
        return NextResponse.json(
          { error: 'Failed to create team for user' },
          { status: 500 }
        );
      }

      teamId = newTeam.id;
    } else {
      // Use the most recent team
      teamId = teams[0].id;
    }

    // Create product
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        team_id: teamId,
        name,
        staging_url: stagingUrl,
        auth_state: authState,
        login_email: authState === 'authenticated' ? loginEmail : null,
        login_password: authState === 'authenticated' ? loginPassword : null
      })
      .select()
      .single();

    if (productError || !product) {
      console.error('Product creation error:', productError);
      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      product
    });

  } catch (error: any) {
    console.error('Create product error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
