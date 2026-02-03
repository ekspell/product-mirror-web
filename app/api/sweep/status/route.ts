import { NextResponse } from 'next/server';
import { supabase } from '@/app/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sweepId = searchParams.get('sweepId');
    const productId = searchParams.get('productId');

    if (!sweepId && !productId) {
      return NextResponse.json({
        error: 'Either sweepId or productId is required'
      }, { status: 400 });
    }

    let query = supabase.from('sweeps').select('*');

    if (sweepId) {
      query = query.eq('id', sweepId);
    } else {
      query = query.eq('product_id', productId).order('started_at', { ascending: false }).limit(1);
    }

    const { data: sweep, error } = await query.single();

    if (error || !sweep) {
      return NextResponse.json({
        error: 'Sweep not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      sweep
    });

  } catch (error: any) {
    console.error('Error fetching sweep status:', error);
    return NextResponse.json({
      error: 'Failed to fetch sweep status'
    }, { status: 500 });
  }
}
