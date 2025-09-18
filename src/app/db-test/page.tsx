import { prisma } from '@/lib/db'

export default async function DatabaseTestPage() {
  try {
    // Test basic connection
    const userCount = await prisma.user.count()
    const courseCount = await prisma.course.count()
    const questionCount = await prisma.question.count()
    const baseExampleCount = await prisma.baseExample.count()
    
    // Get sample data
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      }
    })
    
    const courses = await prisma.course.findMany({
      select: {
        id: true,
        title: true,
        admin: {
          select: { name: true, email: true }
        },
        _count: {
          select: { questions: true, enrollments: true }
        }
      }
    })

    return (
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8 text-green-600">✅ Database Connection Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800">Users</h3>
            <p className="text-2xl font-bold text-blue-600">{userCount}</p>
          </div>
          
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800">Courses</h3>
            <p className="text-2xl font-bold text-green-600">{courseCount}</p>
          </div>
          
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h3 className="text-lg font-semibold text-purple-800">Questions</h3>
            <p className="text-2xl font-bold text-purple-600">{questionCount}</p>
          </div>
          
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <h3 className="text-lg font-semibold text-orange-800">Base Examples</h3>
            <p className="text-2xl font-bold text-orange-600">{baseExampleCount}</p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Users</h2>
          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t">
                    <td className="px-4 py-2">{user.email}</td>
                    <td className="px-4 py-2">{user.name}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.role === 'SUPER_ADMIN' ? 'bg-red-100 text-red-800' :
                        user.role === 'COURSE_ADMIN' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Courses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((course) => (
              <div key={course.id} className="p-4 border rounded-lg">
                <h3 className="text-lg font-semibold mb-2">{course.title}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Admin: {course.admin.name} ({course.admin.email})
                </p>
                <div className="flex gap-4 text-sm">
                  <span className="text-blue-600">
                    {course._count.questions} Questions
                  </span>
                  <span className="text-green-600">
                    {course._count.enrollments} Students
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-xl font-semibold text-green-800 mb-2">🎉 Database Setup Complete!</h3>
          <ul className="text-green-700 space-y-1">
            <li>✅ Neon Postgres connection established</li>
            <li>✅ All tables created via Prisma migration</li>
            <li>✅ Sample data seeded successfully</li>
            <li>✅ Role-based user system operational</li>
            <li>✅ Course and question structure ready</li>
            <li>✅ Base examples for assessment comparisons loaded</li>
          </ul>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">🚀 Ready for Sprint 2</h3>
          <p className="text-blue-700">
            Database is fully configured and ready for the Assessment Engine implementation.
            All server actions can now connect to the database and perform operations.
          </p>
        </div>
      </div>
    )
  } catch (error) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8 text-red-600">❌ Database Connection Failed</h1>
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Details:</h3>
          <pre className="text-red-700 text-sm overflow-auto">
            {error instanceof Error ? error.message : 'Unknown error'}
          </pre>
        </div>
      </div>
    )
  }
}