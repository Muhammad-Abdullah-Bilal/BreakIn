import { getDatabase } from '@/lib/mongodb'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase()
    const { searchParams } = new URL(request.url)
    const skill = searchParams.get('skill')
    const query: any = {}

    if (skill) {
      query.skills = { $regex: new RegExp(skill, 'i') }
    }

    const jobs = await db.collection('jobs')
      .find(query)
      .sort({ created_at: -1 })
      .toArray()

    return NextResponse.json(jobs)
  } catch (error) {
    console.error('Error fetching jobs from MongoDB:', error)
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, department, skills, description } = body
    const db = await getDatabase()

    const newJob = {
      id: `job_${Date.now()}`,
      title: title || 'New Position',
      department: department || 'Engineering',
      applicants: 0,
      applicantsList: [],
      verifiedMatches: 0,
      status: 'Active',
      skills: skills || ['JavaScript', 'TypeScript', 'React'],
      description: description || '',
      created_at: new Date()
    }

    await db.collection('jobs').insertOne(newJob)
    return NextResponse.json(newJob, { status: 201 })
  } catch (error) {
    console.error('Error creating job:', error)
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 })
  }
}
