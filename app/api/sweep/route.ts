import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST() {
  try {
    // Run the crawler script
    const { stdout, stderr } = await execAsync(
      'cd ~/Projects/product-mirror-crawler && node publix-test.js',
      { timeout: 120000 } // 2 minute timeout
    );
    
    return NextResponse.json({ 
      success: true, 
      message: 'Sweep completed',
      output: stdout 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}