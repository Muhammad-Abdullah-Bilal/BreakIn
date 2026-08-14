import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

function getMockFallback(pathStr: string) {
  console.log(`Serving dynamic mock fallback for path: ${pathStr}`);
  
  if (pathStr.includes('insights/comprehensive') || pathStr.includes('comprehensive')) {
    return NextResponse.json({
      job_trends: {
        trending_skills: ['React', 'TypeScript', 'FastAPI', 'AWS', 'Docker'],
        salary_trends: { 'React Developer': 115000, 'DevOps Engineer': 130000, 'Backend Engineer': 120000 },
        location_demand: { 'Remote': 68, 'San Francisco': 14, 'New York': 10 },
        company_hiring_activity: [
          { company: 'TechCorp', jobs_posted: 5, trend: 'up' },
          { company: 'StartupXYZ', jobs_posted: 3, trend: 'stable' },
          { company: 'ScaleInc', jobs_posted: 8, trend: 'up' }
        ]
      },
      matching_performance: {
        average_match_score: 88,
        successful_placements: 14,
        top_performing_skills: ['TypeScript', 'FastAPI', 'Next.js'],
        conversion_rates: { 'Sourcing': 0.85, 'Interview': 0.42, 'Offer': 0.18 }
      },
      outreach_analytics: {
        response_rates: { 'Template A': 0.42, 'Template B': 0.28 },
        best_performing_templates: ['Personalized Pitch', 'Quick Sync'],
        optimal_send_times: ['Tuesday 10 AM', 'Thursday 2 PM'],
        company_engagement_scores: { 'TechCorp': 92, 'StartupXYZ': 76 }
      }
    });
  }

  if (pathStr.includes('job-radar/execute') || pathStr.includes('job-radar')) {
    return NextResponse.json([
      {
        id: 'radar_1',
        company_name: 'Stripe',
        job_title: 'Senior Solutions Engineer',
        job_url: 'https://stripe.com/jobs',
        location: 'Remote (US)',
        salary_range: '$140k - $170k',
        requirements: ['React', 'Node.js', 'FinTech APIs'],
        posted_date: 'Just now',
        match_score: 94,
        potential_candidates: 3,
        source: 'Stripe Careers'
      },
      {
        id: 'radar_2',
        company_name: 'Vercel',
        job_title: 'Frontend Performance Specialist',
        job_url: 'https://vercel.com/jobs',
        location: 'Remote (Global)',
        salary_range: '$130k - $160k',
        requirements: ['Next.js', 'TypeScript', 'TailwindCSS'],
        posted_date: '2 hours ago',
        match_score: 92,
        potential_candidates: 5,
        source: 'LinkedIn Jobs'
      }
    ]);
  }

  if (pathStr.includes('talent-matching/execute') || pathStr.includes('talent-matching')) {
    return NextResponse.json([
      {
        candidate_id: 'dev_1',
        candidate_name: 'John Engineer',
        codename: 'CyberFalcon_92',
        match_score: 96,
        skill_matches: ['React', 'TypeScript', 'FastAPI'],
        experience_match: 94,
        location_match: true,
        availability_match: true,
        cultural_fit_score: 90,
        strengths: ['Algorithmic complexity optimization', 'Clean error boundaries'],
        potential_concerns: []
      },
      {
        candidate_id: 'dev_2',
        candidate_name: 'john',
        codename: 'QuantumNode_11',
        match_score: 91,
        skill_matches: ['Python', 'Docker', 'PostgreSQL'],
        experience_match: 88,
        location_match: true,
        availability_match: true,
        cultural_fit_score: 85,
        strengths: ['Great test coverage', 'Idempotency design patterns'],
        potential_concerns: []
      }
    ]);
  }

  if (pathStr.includes('outreach/execute') || pathStr.includes('campaign')) {
    return NextResponse.json({
      id: 'camp_' + Date.now(),
      name: 'Outreach Campaign',
      target_companies: ['Stripe', 'Vercel'],
      message_template: 'Hi {{company_name}}, check out candidate matches.',
      status: 'active',
      sent_count: 12,
      response_count: 5,
      success_rate: 42
    });
  }

  if (pathStr.includes('workflows')) {
    return NextResponse.json({
      id: 'wf_' + Date.now(),
      workflow_type: 'Autonomous Talent Sourcing',
      status: 'completed',
      progress: 100,
      created_at: new Date().toISOString()
    });
  }

  // General default fallback
  return NextResponse.json({ success: true, message: 'Default api fallback success' });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  try {
    const pathStr = path.join('/');
    const { searchParams } = new URL(request.url);
    const query = searchParams.toString();
    
    const targetUrl = `${BACKEND_URL}/api/v1/${pathStr}${query ? `?${query}` : ''}`;

    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!res.ok) {
      throw new Error(`Status: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return getMockFallback(path.join('/'));
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  try {
    const pathStr = path.join('/');
    const body = await request.json().catch(() => ({}));
    
    const targetUrl = `${BACKEND_URL}/api/v1/${pathStr}`;

    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      throw new Error(`Status: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return getMockFallback(path.join('/'));
  }
}
