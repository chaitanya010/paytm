import { getReport, getReportMem } from '@/lib/cache'
import ReportView from './ReportView'

interface PageProps {
  params: { slug: string }
}

export default async function ReportPage({ params }: PageProps) {
  const { slug } = params

  let report = await getReport(slug)
  if (!report) report = getReportMem(slug)

  if (!report) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-5xl mb-4">📭</div>
          <h1 className="text-white font-bold text-2xl mb-2">Report not found</h1>
          <p className="text-gray-500 mb-6">
            This report has expired or doesn&apos;t exist. Reports are kept for 24 hours.
          </p>
          <div className="flex gap-3 justify-center">
            <a
              href="/"
              className="inline-block px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
            >
              Generate a new report
            </a>
            <a
              href="/history"
              className="inline-block px-6 py-2.5 rounded-lg border border-gray-700 hover:bg-gray-800 text-gray-300 font-medium transition-colors"
            >
              View history
            </a>
          </div>
        </div>
      </div>
    )
  }

  return <ReportView report={report} />
}
