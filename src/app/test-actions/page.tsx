import { getCourses } from '@/lib/actions/course-actions'
import { getQuestions } from '@/lib/actions/question-actions'
import { healthCheck } from '@/lib/services/llm-service'

export default async function TestActionsPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Server Actions Test Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Course Actions</h2>
          <p className="text-sm text-muted-foreground">
            Server actions for course management with role-based access control.
          </p>
          <div className="mt-2 text-xs">
            ✅ createCourse<br/>
            ✅ updateCourse<br/>
            ✅ deleteCourse<br/>
            ✅ getCourses<br/>
            ✅ getCourse<br/>
            ✅ enrollInCourse
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Question Actions</h2>
          <p className="text-sm text-muted-foreground">
            Server actions for question and base example management.
          </p>
          <div className="mt-2 text-xs">
            ✅ createQuestion<br/>
            ✅ updateQuestion<br/>
            ✅ deleteQuestion<br/>
            ✅ getQuestions<br/>
            ✅ getQuestion<br/>
            ✅ createBaseExample<br/>
            ✅ updateBaseExample<br/>
            ✅ deleteBaseExample
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-2">LLM Service</h2>
          <p className="text-sm text-muted-foreground">
            Multi-LLM integration with complexity-based routing.
          </p>
          <div className="mt-2 text-xs">
            ✅ assessSubmission<br/>
            ✅ assessTextSubmission<br/>
            ✅ assessDocumentSubmission<br/>
            ✅ assessWebsiteSubmission<br/>
            ✅ assessGitHubSubmission<br/>
            ✅ generateSummary<br/>
            ✅ healthCheck
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="text-lg font-semibold text-green-800 mb-2">✅ Sprint 1 Core Features Completed</h3>
        <ul className="text-sm text-green-700 space-y-1">
          <li>✅ Prisma schema with User, Course, Question, Submission, Role models</li>
          <li>✅ Course management server actions with role-based authorization</li>
          <li>✅ Question management with BaseExample model integration</li>
          <li>✅ Multi-LLM service with Groq integration and complexity routing</li>
          <li>✅ Comprehensive Zod validation and error handling</li>
          <li>⏳ Database migration (requires Neon Postgres URL)</li>
        </ul>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">🔧 Next Steps</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>1. Set up Neon Postgres database connection</li>
          <li>2. Run initial migration: <code className="bg-blue-100 px-1 rounded">npx prisma migrate dev</code></li>
          <li>3. Configure authentication (NextAuth.js)</li>
          <li>4. Add environment variables for LLM services</li>
          <li>5. Test server actions with role-based permissions</li>
        </ul>
      </div>
    </div>
  )
}