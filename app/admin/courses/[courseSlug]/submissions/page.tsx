import { createServerSupabase } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { SubmissionsReview } from './SubmissionsReview'

export default async function SubmissionsPage({
  params,
}: {
  params: Promise<{ courseSlug: string }>
}) {
  const { courseSlug } = await params
  const supabase = await createServerSupabase()

  const { data: course } = await supabase
    .from('courses')
    .select('id, title')
    .eq('slug', courseSlug)
    .single()

  if (!course) notFound()

  const { data: submissions } = await supabase
    .from('submissions')
    .select(
      `
      id, content, status, mentor_feedback, submitted_at,
      user_id,
      profiles ( full_name, github_username ),
      assignment_id,
      assignments ( id, title, course_id )
    `
    )
    .order('submitted_at', { ascending: false })

  // filter client-side to just this course's assignments
  // (Supabase doesn't support filtering on a nested join column directly)
  const filtered = (submissions || []).filter((s) => {
    const a = Array.isArray(s.assignments) ? s.assignments[0] : s.assignments
    return a?.course_id === course.id
  })

  const cleaned = filtered.map((s) => {
    const profile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles
    const assignment = Array.isArray(s.assignments)
      ? s.assignments[0]
      : s.assignments
    return {
      id: s.id,
      content: s.content,
      status: s.status,
      mentor_feedback: s.mentor_feedback,
      submitted_at: s.submitted_at,
      studentName: profile?.full_name || 'Unknown',
      githubUsername: profile?.github_username || null,
      assignmentTitle: assignment?.title || 'Untitled',
    }
  })

  return <SubmissionsReview courseTitle={course.title} submissions={cleaned} />
}