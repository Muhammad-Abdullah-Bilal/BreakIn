import { getDatabase } from '@/lib/mongodb'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jobId, developer } = body

    if (!jobId || !developer) {
      return NextResponse.json({ error: 'Missing jobId or developer profile' }, { status: 400 })
    }

    const db = await getDatabase()

    const { ObjectId } = require('mongodb')
    let job = await db.collection('jobs').findOne({ id: jobId })

    if (!job) {
      try {
        job = await db.collection('jobs').findOne({ _id: new ObjectId(jobId) })
      } catch (err) {
        // Not a valid ObjectId
      }
    }

    if (!job) {
      return NextResponse.json({ error: 'Job role not found' }, { status: 404 })
    }

    // Check if developer already applied
    const applicantsList = job.applicantsList || []
    const alreadyApplied = applicantsList.some((app: any) => app.id === developer.id)

    if (alreadyApplied) {
      return NextResponse.json({ message: 'Already applied' }, { status: 200 })
    }

    // Add to applicants list and increment counter
    await db.collection('jobs').updateOne(
      { _id: job._id },
      {
        $push: { applicantsList: developer },
        $inc: { applicants: 1 }
      }
    )

    // Also optionally insert into general candidate pipeline
    const pipelineCandidate = {
      id: 'cand_' + Date.now(),
      name: developer.name,
      codename: developer.codename,
      role: job.title,
      jobId: jobId,
      score: developer.score,
      sprintsCompleted: developer.sprintsCompleted,
      skills: developer.skills,
      avatarUrl: developer.avatarUrl,
      current_stage: 'applied',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    await db.collection('pipeline').insertOne(pipelineCandidate)

    return NextResponse.json({ message: 'Application submitted successfully', candidate: pipelineCandidate })
  } catch (error) {
    console.error('Error applying to job:', error)
    return NextResponse.json({ error: 'Failed to process job application' }, { status: 500 })
  }
}
