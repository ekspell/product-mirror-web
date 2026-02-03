import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { supabase } from '@/app/supabase';

export async function POST(request: Request) {
  try {
    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json({
        success: false,
        error: 'Product ID is required'
      }, { status: 400 });
    }

    // Create sweep record
    const { data: sweep, error: sweepError } = await supabase
      .from('sweeps')
      .insert({
        product_id: productId,
        status: 'running',
        current_step: 'Starting',
        progress_message: 'Initializing sweep...'
      })
      .select()
      .single();

    if (sweepError || !sweep) {
      console.error('Failed to create sweep record:', sweepError);
      return NextResponse.json({
        success: false,
        error: 'Failed to start sweep'
      }, { status: 500 });
    }

    console.log(`Starting background sweep ${sweep.id} for product ${productId}`);

    // Start background sweep process
    const sweepProcess = spawn('node', [
      'run-sweep.js',
      sweep.id,
      productId
    ], {
      cwd: '/Users/erinspellman/Projects/product-mirror-crawler',
      detached: true,
      stdio: 'ignore',
      env: process.env
    });

    sweepProcess.unref(); // Allow parent to exit independently

    console.log(`Sweep ${sweep.id} started in background`);

    // Return immediately with sweep ID
    return NextResponse.json({
      success: true,
      sweepId: sweep.id,
      message: 'Sweep started in background. Use the sweep ID to check status.'
    });

  } catch (error: any) {
    console.error('Failed to start sweep:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to start sweep: ${error.message || 'Unknown error'}`
    }, { status: 500 });
  }
}