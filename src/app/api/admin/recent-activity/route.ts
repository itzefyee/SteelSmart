import { NextResponse } from 'next/server';
import { RecentActivityService } from '@/services/admin/audit/recent-activity.service';

export async function GET(): Promise<NextResponse> {
  try {
    const recentActivity = await RecentActivityService.getRecentActivity();
    
    return NextResponse.json({
      success: true,
      data: recentActivity
    });
  } catch (error) {
    console.error('Failed to fetch recent activity:', error);
    
    // Return empty array instead of error to prevent dashboard crashes
    return NextResponse.json({
      success: true,
      data: []
    });
  }
}