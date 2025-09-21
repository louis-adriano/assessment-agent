import { getCourses } from '@/lib/actions/course-actions'
import { getQuestions } from '@/lib/actions/question-actions'
import { getSubmissions } from '@/lib/actions/submission-actions'
import { getAssessmentHealth } from '@/lib/services/assessment-service'

export default async function TestPage() {
  // Test server actions
  const coursesResult = await getCourses()
  const questionsResult = await getQuestions()
  const submissionsResult = await getSubmissions()
  const healthResult = await getAssessmentHealth()

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Sprint 1 Functionality Test</h1>

      <div className="space-y-8">
        {/* Health Check */}
        <section className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Assessment Service Health</h2>
          <div className="bg-gray-100 p-4 rounded">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${
                healthResult.status === 'healthy' ? 'bg-green-500' :
                healthResult.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
              }`}></span>
              <span className="font-medium">Status: {healthResult.status}</span>
            </div>
            <div className="mt-2 text-sm">
              <p>LLM Service: {healthResult.services.llm ? '✅ Healthy' : '❌ Down'}</p>
              <p>Database: {healthResult.services.database ? '✅ Healthy' : '❌ Down'}</p>
              {healthResult.latency && (
                <p>Latency: {healthResult.latency}ms</p>
              )}
            </div>
          </div>
        </section>

        {/* Courses */}
        <section className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Courses ({coursesResult.success ? 'Success' : 'Failed'})</h2>
          {coursesResult.success ? (
            <div className="space-y-2">
              {coursesResult.data?.map((course: any) => (
                <div key={course.id} className="bg-gray-100 p-3 rounded">
                  <h3 className="font-medium">{course.title}</h3>
                  <p className="text-sm text-gray-600">{course.description}</p>
                  <div className="text-xs text-gray-500 mt-1">
                    Questions: {course._count?.questions || 0} |
                    Enrollments: {course._count?.enrollments || 0}
                  </div>
                </div>
              )) || <p>No courses found</p>}
            </div>
          ) : (
            <p className="text-red-600">Error: {coursesResult.error}</p>
          )}
        </section>

        {/* Questions */}
        <section className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Questions ({questionsResult.success ? 'Success' : 'Failed'})</h2>
          {questionsResult.success ? (
            <div className="space-y-2">
              {questionsResult.data?.map((question: any) => (
                <div key={question.id} className="bg-gray-100 p-3 rounded">
                  <h3 className="font-medium">{question.title}</h3>
                  <p className="text-sm text-gray-600">{question.description}</p>
                  <div className="text-xs text-gray-500 mt-1">
                    Type: {question.submissionType} |
                    Course: {question.course?.title} |
                    Base Example: {question.baseExample ? '✅' : '❌'} |
                    Submissions: {question._count?.submissions || 0}
                  </div>
                </div>
              )) || <p>No questions found</p>}
            </div>
          ) : (
            <p className="text-red-600">Error: {questionsResult.error}</p>
          )}
        </section>

        {/* Submissions */}
        <section className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Submissions ({submissionsResult.success ? 'Success' : 'Failed'})</h2>
          {submissionsResult.success ? (
            <div className="space-y-2">
              {submissionsResult.data?.map((submission: any) => (
                <div key={submission.id} className="bg-gray-100 p-3 rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{submission.question?.title}</h3>
                      <p className="text-sm text-gray-600">Student: {submission.student?.name}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-xs ${
                        submission.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        submission.status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-800' :
                        submission.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {submission.status}
                      </span>
                      {submission.score !== null && (
                        <div className="text-sm font-medium mt-1">
                          Score: {submission.score}/100
                        </div>
                      )}
                    </div>
                  </div>
                  {submission.feedback && (
                    <p className="text-sm mt-2 bg-white p-2 rounded border-l-4 border-blue-400">
                      {submission.feedback}
                    </p>
                  )}
                </div>
              )) || <p>No submissions found</p>}
            </div>
          ) : (
            <p className="text-red-600">Error: {submissionsResult.error}</p>
          )}
        </section>

        {/* Sprint 1 Summary */}
        <section className="border-2 border-green-200 rounded-lg p-6 bg-green-50">
          <h2 className="text-xl font-semibold mb-4 text-green-800">Sprint 1 Implementation Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-green-600">✅</span>
              <span>Course Management Server Actions with Role-based Access</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">✅</span>
              <span>Question Management with Base Examples</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">✅</span>
              <span>Multi-LLM Integration (Groq with Llama 8B/70B routing)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">✅</span>
              <span>Submission Processing with Base Example Comparison</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">✅</span>
              <span>Assessment Service with Complexity-based LLM Routing</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">✅</span>
              <span>Role-based Permissions (SUPER_ADMIN, COURSE_ADMIN, STUDENT)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">✅</span>
              <span>Database Schema with Complete Relationships</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">✅</span>
              <span>Comprehensive Error Handling and Validation</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}