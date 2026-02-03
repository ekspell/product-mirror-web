import { NextResponse } from 'next/server';
import { supabase } from '@/app/supabase';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: flowId } = await params;

    if (!flowId) {
      return NextResponse.json({ error: 'Flow ID is required' }, { status: 400 });
    }

    // Get all routes for this flow
    const { data: routes } = await supabase
      .from('routes')
      .select('id')
      .eq('flow_id', flowId);

    // Delete captures for all routes in this flow
    if (routes && routes.length > 0) {
      const routeIds = routes.map(r => r.id);

      const { error: capturesError } = await supabase
        .from('captures')
        .delete()
        .in('route_id', routeIds);

      if (capturesError) {
        console.error('Error deleting captures:', capturesError);
        return NextResponse.json({ error: 'Failed to delete captures' }, { status: 500 });
      }

      // Delete all routes in this flow
      const { error: routesError } = await supabase
        .from('routes')
        .delete()
        .eq('flow_id', flowId);

      if (routesError) {
        console.error('Error deleting routes:', routesError);
        return NextResponse.json({ error: 'Failed to delete routes' }, { status: 500 });
      }
    }

    // Delete the flow itself
    const { error: flowError } = await supabase
      .from('flows')
      .delete()
      .eq('id', flowId);

    if (flowError) {
      console.error('Error deleting flow:', flowError);
      return NextResponse.json({ error: 'Failed to delete flow' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in DELETE /api/flows/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
