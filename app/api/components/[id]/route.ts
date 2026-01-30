import { NextResponse } from 'next/server';
import { supabase } from '../../../supabase';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // First, delete all component instances (due to foreign key constraints)
    const { error: instancesError } = await supabase
      .from('component_instances')
      .delete()
      .eq('component_id', id);

    if (instancesError) {
      console.error('Error deleting component instances:', instancesError);
      return NextResponse.json(
        { error: 'Failed to delete component instances' },
        { status: 500 }
      );
    }

    // Then delete the component itself
    const { error: componentError } = await supabase
      .from('components')
      .delete()
      .eq('id', id);

    if (componentError) {
      console.error('Error deleting component:', componentError);
      return NextResponse.json(
        { error: 'Failed to delete component' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in DELETE /api/components/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
