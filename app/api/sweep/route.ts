import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

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

    // Run the generic crawler script with product ID
    console.log(`Starting crawl for product: ${productId}`);

    let crawlOutput, categorizeOutput, changesOutput, componentsOutput;

    try {
      const result = await execAsync(
        `cd ~/Projects/product-mirror-crawler && node generic-crawl.js ${productId}`,
        { timeout: 300000 } // 5 minute timeout
      );
      crawlOutput = result.stdout;
    } catch (error: any) {
      console.error('Crawl error:', error);
      return NextResponse.json({
        success: false,
        error: `Crawl failed: ${error.message || 'Unknown crawler error'}`
      }, { status: 500 });
    }

    console.log('Crawl completed, starting flow categorization...');

    try {
      const result = await execAsync(
        `cd ~/Projects/product-mirror-crawler && node categorize-flows-generic.js ${productId}`,
        { timeout: 120000 } // 2 minute timeout
      );
      categorizeOutput = result.stdout;
    } catch (error: any) {
      console.error('Categorization error:', error);
      return NextResponse.json({
        success: false,
        error: `Flow categorization failed: ${error.message || 'AI categorization error'}`
      }, { status: 500 });
    }

    console.log('Flow categorization completed, starting change detection...');

    try {
      const result = await execAsync(
        `cd ~/Projects/product-mirror-crawler && node detect-changes.js ${productId}`,
        { timeout: 120000 } // 2 minute timeout
      );
      changesOutput = result.stdout;
    } catch (error: any) {
      console.error('Change detection error:', error);
      // Don't fail the whole sweep if change detection fails
      console.log('Continuing without change detection...');
      changesOutput = 'Skipped (error)';
    }

    console.log('Change detection completed, extracting components...');

    try {
      const result = await execAsync(
        `cd ~/Projects/product-mirror-crawler && node extract-components.js ${productId}`,
        { timeout: 180000 } // 3 minute timeout (AI calls can be slow)
      );
      componentsOutput = result.stdout;
    } catch (error: any) {
      console.error('Component extraction error:', error);
      // Don't fail the whole sweep if component extraction fails
      console.log('Continuing without component extraction...');
      componentsOutput = 'Skipped (error)';
    }

    console.log('Sweep completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Sweep complete: crawl, categorization, change detection, and component extraction finished',
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