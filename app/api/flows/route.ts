import { NextResponse } from 'next/server';
import { supabase } from '@/app/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({
        error: 'Product ID is required'
      }, { status: 400 });
    }

    // Fetch flows for this product that have screens (step_count > 0)
    const { data: flows, error } = await supabase
      .from('flows')
      .select('id, name, parent_flow_id, level, order_index, step_count')
      .eq('product_id', productId)
      .gt('step_count', 0)
      .order('level', { ascending: true })
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching flows:', error);
      return NextResponse.json({
        error: 'Failed to fetch flows'
      }, { status: 500 });
    }

    // Build tree structure
    const flowMap = new Map();
    const rootFlows = [];

    // First pass: create map of all flows
    for (const flow of flows || []) {
      flowMap.set(flow.id, { ...flow, children: [], screenCount: 0 });
    }

    // Second pass: build tree
    for (const flow of flows || []) {
      const flowNode = flowMap.get(flow.id);
      if (flow.parent_flow_id) {
        const parent = flowMap.get(flow.parent_flow_id);
        if (parent) {
          parent.children.push(flowNode);
        }
      } else {
        rootFlows.push(flowNode);
      }
    }

    // Fetch screen counts for each flow
    const { data: routes } = await supabase
      .from('routes')
      .select('id, flow_id')
      .eq('product_id', productId)
      .not('flow_id', 'is', null);

    // Count screens per flow
    const screenCounts = new Map();
    for (const route of routes || []) {
      if (route.flow_id) {
        screenCounts.set(route.flow_id, (screenCounts.get(route.flow_id) || 0) + 1);
      }
    }

    // Add screen counts to tree
    function addScreenCounts(flowNode: any): number {
      let count = screenCounts.get(flowNode.id) || 0;

      if (flowNode.children) {
        for (const child of flowNode.children) {
          count += addScreenCounts(child);
        }
      }

      flowNode.screenCount = count;
      return count;
    }

    for (const root of rootFlows) {
      addScreenCounts(root);
    }

    return NextResponse.json({
      success: true,
      flows: rootFlows
    });

  } catch (error: any) {
    console.error('Error in flows API:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
