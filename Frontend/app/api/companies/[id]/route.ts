// app/api/companies/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDatabase } from '@/lib/mongodb'
import { Company } from '@/lib/models/types'
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = await getDatabase()
    
    const company = await db.collection<Company>('companies').findOne({ 
      _id: new ObjectId(id) 
    })
    
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }
    
    return NextResponse.json(company)
  } catch (error) {
    console.error('Error fetching company:', error)
    return NextResponse.json({ error: 'Failed to fetch company' }, { status: 500 })
  }
}