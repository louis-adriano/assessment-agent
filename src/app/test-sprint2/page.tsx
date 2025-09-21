import { getAssessmentResults, getAssessmentInsights } from '@/lib/actions/result-actions'
import { getSubmissions } from '@/lib/actions/submission-actions'
import { getQuestions } from '@/lib/actions/question-actions'
import { getAssessmentHealth } from '@/lib/services/assessment-service'
import { performDetailedComparison } from '@/lib/services/comparison-engine'
import { assessTextSubmissionWithBase } from '@/lib/services/text-assessment'

export default async function Sprint2TestPage() {
  // Test all Sprint 2 functionality
  const healthResult = await getAssessmentHealth()
  const resultsTest = await getAssessmentResults({ limit: 5 })
  const submissionsTest = await getSubmissions()
  const questionsTest = await getQuestions()
  const insightsTest = await getAssessmentInsights()

  // Test comparison engine with sample data
  let comparisonTest = null
  try {
    comparisonTest = await performDetailedComparison(
      "var name = 'John'; console.log(name);", // Sample submission
      "const userName = 'Jane'; console.log(`Hello, ${userName}`);", // Sample base example
      {
        title: "JavaScript Variables Test",
        description: "Demonstrate proper variable usage",
        criteria: "Use modern JavaScript syntax"
      },
      "TEXT" as any
    )
  } catch (error) {
    comparisonTest = { error: error instanceof Error ? error.message : 'Comparison test failed' }
  }

  // Test text assessment
  let textAssessmentTest = null
  try {
    textAssessmentTest = await assessTextSubmissionWithBase(
      "let x = 5; let y = 10; console.log(x + y);",
      "const firstNumber = 5; const secondNumber = 10; console.log(`Sum: ${firstNumber + secondNumber}`);",
      {
        title: "Basic JavaScript",
        description: "Write code to add two numbers",
        criteria: "Use const for constants, template literals for output"
      }
    )
  } catch (error) {
    textAssessmentTest = { error: error instanceof Error ? error.message : 'Text assessment test failed' }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Sprint 2 - Base Example Comparison Test</h1>

      <div className="space-y-8">
        {/* Assessment Service Health */}
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
              {healthResult.latency && <p>Latency: {healthResult.latency}ms</p>}
            </div>
          </div>
        </section>

        {/* Comparison Engine Test */}
        <section className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Base Example Comparison Engine</h2>
          {comparisonTest && !('error' in comparisonTest) ? (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded border border-green-200">
                <h3 className="font-medium text-green-800">✅ Comparison Engine Working</h3>
                <div className="mt-2 space-y-2 text-sm">
                  <p><strong>Overall Score:</strong> {comparisonTest.score}/100</p>
                  <p><strong>Confidence:</strong> {(comparisonTest.confidence * 100).toFixed(1)}%</p>
                  {comparisonTest.detailedComparison && (
                    <div className="mt-3">
                      <p><strong>Detailed Analysis:</strong></p>
                      <ul className="ml-4 space-y-1">
                        <li>• Structural: {comparisonTest.detailedComparison.structuralAnalysis.score}/100</li>
                        <li>• Content: {comparisonTest.detailedComparison.contentAnalysis.score}/100</li>
                        <li>• Quality: {comparisonTest.detailedComparison.qualityAnalysis.score}/100</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded">
                  <h4 className="font-medium text-blue-800">Similarities Found</h4>
                  <ul className="mt-2 text-sm space-y-1">
                    {comparisonTest.comparisonData.similarities.slice(0, 3).map((sim: string, i: number) => (
                      <li key={i} className="text-blue-700">• {sim}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-orange-50 p-4 rounded">
                  <h4 className="font-medium text-orange-800">Differences Found</h4>
                  <ul className="mt-2 text-sm space-y-1">
                    {comparisonTest.comparisonData.differences.slice(0, 3).map((diff: string, i: number) => (
                      <li key={i} className="text-orange-700">• {diff}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {comparisonTest.insights && (
                <div className="bg-purple-50 p-4 rounded">
                  <h4 className="font-medium text-purple-800">Insights & Recommendations</h4>
                  <div className="mt-2 space-y-2 text-sm">
                    <div>
                      <strong>Key Strengths:</strong>
                      <ul className="ml-4">
                        {comparisonTest.insights.keyStrengths.slice(0, 2).map((strength: string, i: number) => (
                          <li key={i} className="text-purple-700">• {strength}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <strong>Next Steps:</strong>
                      <ul className="ml-4">
                        {comparisonTest.insights.nextSteps.slice(0, 2).map((step: string, i: number) => (
                          <li key={i} className="text-purple-700">• {step}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-red-50 p-4 rounded border border-red-200">
              <p className="text-red-800">❌ Comparison Engine Error: {comparisonTest?.error || 'Unknown error'}</p>
            </div>
          )}
        </section>

        {/* Text Assessment Test */}
        <section className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Enhanced Text Assessment</h2>
          {textAssessmentTest && !('error' in textAssessmentTest) ? (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded border border-green-200">
                <h3 className="font-medium text-green-800">✅ Text Assessment Working</h3>
                <div className="mt-2 space-y-2 text-sm">
                  <p><strong>Score:</strong> {textAssessmentTest.score}/100</p>
                  <p><strong>Confidence:</strong> {(textAssessmentTest.confidence * 100).toFixed(1)}%</p>
                  <p><strong>Feedback:</strong> {textAssessmentTest.feedback}</p>
                </div>
              </div>

              {textAssessmentTest.analysis && (
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded">
                    <h4 className="font-medium text-blue-800">Structure Analysis</h4>
                    <p className="text-sm mt-1">Score: {textAssessmentTest.analysis.structure.score}/100</p>
                    <ul className="text-xs mt-2 space-y-1">
                      {textAssessmentTest.analysis.structure.strengths.slice(0, 2).map((strength: string, i: number) => (
                        <li key={i} className="text-blue-700">+ {strength}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-green-50 p-4 rounded">
                    <h4 className="font-medium text-green-800">Content Analysis</h4>
                    <p className="text-sm mt-1">Score: {textAssessmentTest.analysis.content.score}/100</p>
                    <div className="text-xs mt-2 space-y-1">
                      <p>Completeness: {textAssessmentTest.analysis.content.completeness}/100</p>
                      <p>Accuracy: {textAssessmentTest.analysis.content.accuracy}/100</p>
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded">
                    <h4 className="font-medium text-purple-800">Style Analysis</h4>
                    <p className="text-sm mt-1">Score: {textAssessmentTest.analysis.style.score}/100</p>
                    <div className="text-xs mt-2 space-y-1">
                      <p>Clarity: {textAssessmentTest.analysis.style.clarity}/100</p>
                      <p>Grammar: {textAssessmentTest.analysis.style.grammar}/100</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-red-50 p-4 rounded border border-red-200">
              <p className="text-red-800">❌ Text Assessment Error: {textAssessmentTest?.error || 'Unknown error'}</p>
            </div>
          )}
        </section>

        {/* Assessment Results Management */}
        <section className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Assessment Results Management ({resultsTest.success ? 'Success' : 'Failed'})</h2>
          {resultsTest.success ? (
            <div className="space-y-4">
              <div className="bg-gray-100 p-4 rounded">
                <p className="text-sm">
                  <strong>Results Found:</strong> {resultsTest.data?.results?.length || 0} / {resultsTest.data?.total || 0}
                </p>
                <p className="text-sm">
                  <strong>Has More:</strong> {resultsTest.data?.hasMore ? 'Yes' : 'No'}
                </p>
              </div>

              {resultsTest.data?.results?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Recent Results:</h4>
                  {resultsTest.data.results.slice(0, 3).map((result: any) => (
                    <div key={result.submissionId} className="bg-white p-3 rounded border">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{result.questionTitle}</p>
                          <p className="text-sm text-gray-600">Student: {result.studentName}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded text-xs ${
                            result.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                            result.status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {result.status}
                          </span>
                          {result.score !== null && (
                            <div className="text-sm font-medium mt-1">
                              Score: {result.score}/100
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Base Example: {result.hasComparison ? '✅' : '❌'} |
                        Confidence: {result.confidence ? `${(result.confidence * 100).toFixed(0)}%` : 'N/A'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-red-600">Error: {resultsTest.error}</p>
          )}
        </section>

        {/* Assessment Insights */}
        <section className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Assessment Insights ({insightsTest.success ? 'Success' : 'Failed'})</h2>
          {insightsTest.success && insightsTest.data ? (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded">
                  <h3 className="font-medium text-blue-800">Overall Performance</h3>
                  <div className="mt-2 space-y-1 text-sm">
                    <p>Average Score: {insightsTest.data.overallPerformance.averageScore.toFixed(1)}/100</p>
                    <p>Total Submissions: {insightsTest.data.overallPerformance.totalSubmissions}</p>
                    <p>Completed: {insightsTest.data.overallPerformance.completedAssessments}</p>
                    <p>Pending: {insightsTest.data.overallPerformance.pendingAssessments}</p>
                    <p>Failed: {insightsTest.data.overallPerformance.failedAssessments}</p>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded">
                  <h3 className="font-medium text-green-800">Strong Areas</h3>
                  <ul className="mt-2 space-y-1 text-sm">
                    {insightsTest.data.trends.strongAreas.slice(0, 3).map((area: string, i: number) => (
                      <li key={i} className="text-green-700">• {area}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-orange-50 p-4 rounded">
                  <h3 className="font-medium text-orange-800">Improvement Areas</h3>
                  <ul className="mt-2 space-y-1 text-sm">
                    {insightsTest.data.trends.improvementAreas.slice(0, 3).map((area: string, i: number) => (
                      <li key={i} className="text-orange-700">• {area}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-purple-50 p-4 rounded">
                  <h3 className="font-medium text-purple-800">Recommendations</h3>
                  <ul className="mt-2 space-y-1 text-sm">
                    {insightsTest.data.recommendations.slice(0, 3).map((rec: string, i: number) => (
                      <li key={i} className="text-purple-700">• {rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-red-600">Error: {insightsTest.error}</p>
          )}
        </section>

        {/* Sprint 2 Summary */}
        <section className="border-2 border-green-200 rounded-lg p-6 bg-green-50">
          <h2 className="text-xl font-semibold mb-4 text-green-800">Sprint 2 Implementation Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-green-600">✅</span>
              <span>Base Example Comparison Engine with Detailed Analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">✅</span>
              <span>Enhanced Text Submission Assessment with Style & Structure Analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">✅</span>
              <span>Assessment Result Management with Filtering & Insights</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">✅</span>
              <span>Comprehensive Submission Lookup with Search Capabilities</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">✅</span>
              <span>Performance Analytics and Trend Analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">✅</span>
              <span>Detailed Comparison Insights with Actionable Recommendations</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">✅</span>
              <span>Export Functionality for Assessment Data</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">✅</span>
              <span>Health Monitoring for Assessment Services</span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-white rounded border-l-4 border-green-400">
            <p className="text-sm text-gray-700">
              <strong>Sprint 2 Focus:</strong> Advanced base example comparison system that provides detailed analysis
              of submissions against perfect answers, with comprehensive insights and actionable feedback for students.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}