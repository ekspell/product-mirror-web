import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { supabase } from '@/app/supabase';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json({
        success: false,
        error: 'Product ID is required'
      }, { status: 400 });
    }

    console.log(`Starting sweep for product: ${productId}`);

    let tasksOutput, crawlOutput, categorizeOutput, changesOutput, componentsOutput;

    // Step 1: Discover tasks (first sweep only)
    console.log('Step 1: Task discovery...');
    try {
      const { data: existingTasks } = await supabase
        .from('tasks')
        .select('id')
        .eq('product_id', productId)
        .limit(1);

      if (!existingTasks || existingTasks.length === 0) {
        console.log('  → Running task discovery (first sweep)');
        const result = await execAsync(
          `cd ~/Projects/product-mirror-crawler && node discover-tasks.js ${productId}`,
          { timeout: 120000 } // 2 minute timeout
        );
        tasksOutput = result.stdout;
        console.log('  ✓ Tasks discovered');
      } else {
        console.log('  → Skipping (tasks already exist)');
        tasksOutput = 'Skipped (tasks already exist)';
      }
    } catch (error: any) {
      console.log('  ⚠ Task discovery failed (non-critical):', error.message);
      tasksOutput = 'Failed (non-critical)';
    }

    // Step 2: Crawl screens
    console.log('Step 2: Crawling screens...');
    try {
      const result = await execAsync(
        `cd ~/Projects/product-mirror-crawler && node generic-crawl.js ${productId}`,
        { timeout: 300000 } // 5 minute timeout
      );
      crawlOutput = result.stdout;
      console.log('  ✓ Crawl completed');
    } catch (error: any) {
      console.error('Crawl error:', error);
      return NextResponse.json({
        success: false,
        error: `Crawl failed: ${error.message || 'The site may be too large or encountered an error'}`
      }, { status: 500 });
    }

    // Step 3: Categorize flows
    console.log('Step 3: Categorizing flows...');
    try {
      const result = await execAsync(
        `cd ~/Projects/product-mirror-crawler && node categorize-flows-generic.js ${productId}`,
        { timeout: 120000 } // 2 minute timeout
      );
      categorizeOutput = result.stdout;
      console.log('  ✓ Flows categorized');
    } catch (error: any) {
      console.error('Categorization error:', error);
      return NextResponse.json({
        success: false,
        error: `Flow categorization failed: ${error.message || 'AI categorization error'}`
      }, { status: 500 });
    }

    // Step 4: Detect changes
    console.log('Step 4: Detecting changes...');
    try {
      const result = await execAsync(
        `cd ~/Projects/product-mirror-crawler && node detect-changes.js ${productId}`,
        { timeout: 120000 } // 2 minute timeout
      );
      changesOutput = result.stdout;
      console.log('  ✓ Changes detected');
    } catch (error: any) {
      console.log('  ⚠ Change detection failed (non-critical)');
      changesOutput = 'Skipped (error)';
    }

    // Step 5: Extract components
    console.log('Step 5: Extracting components...');
    try {
      const result = await execAsync(
        `cd ~/Projects/product-mirror-crawler && node extract-components.js ${productId}`,
        { timeout: 180000 } // 3 minute timeout (AI calls can be slow)
      );
      componentsOutput = result.stdout;
      console.log('  ✓ Components extracted');
    } catch (error: any) {
      console.log('  ⚠ Component extraction failed (non-critical)');
      componentsOutput = 'Skipped (error)';
    }

    console.log('✓ Sweep completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Sweep complete: task discovery, crawl, categorization, change detection, and component extraction finished',
      tasksOutput,
      crawlOutput,
      categorizeOutput,
      changesOutput,
      componentsOutput
    });
  } catch (error: any) {
    console.error('Unexpected sweep error:', error);
    return NextResponse.json({
      success: false,
      error: `Unexpected error: ${error.message || 'Please try again or contact support'}`
    }, { status: 500 });
  }
}