import { NextResponse } from 'next/server';
import { supabase } from '@/app/supabase';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: routeId } = await params;

    if (!routeId) {
      return NextResponse.json({ error: 'Route ID is required' }, { status: 400 });
    }

    // Delete captures first (foreign key constraint)
    const { error: capturesError } = await supabase
      .from('captures')
      .delete()
      .eq('route_id', routeId);

    if (capturesError) {
      console.error('Error deleting captures:', capturesError);
      return NextResponse.json({ error: 'Failed to delete captures' }, { status: 500 });
    }

    // Delete the route
    const { error: routeError } = await supabase
      .from('routes')
      .delete()
      .eq('id', routeId);

    if (routeError) {
      console.error('Error deleting route:', routeError);
      return NextResponse.json({ error: 'Failed to delete route' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in DELETE /api/routes/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
