import { NextResponse } from 'next/server';
import { supabase } from '@/app/supabase';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const { name, stagingUrl } = await request.json();

    if (!name || !stagingUrl) {
      return NextResponse.json({
        success: false,
        error: 'Product name and URL are required'
      }, { status: 400 });
    }

    const { data: product, error } = await supabase
      .from('products')
      .update({ name, staging_url: stagingUrl })
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      console.error('Product update error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to update product'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      product
    });

  } catch (error: any) {
    console.error('Failed to update product:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to update product: ${error.message || 'Unknown error'}`
    }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Delete product (cascade will handle routes, captures, connections, components)
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      console.error('Delete product error:', error);
      return NextResponse.json(
        { error: 'Failed to delete product' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error: any) {
    console.error('Delete product error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
