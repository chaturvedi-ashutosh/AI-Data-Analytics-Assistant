import { ArrowLeft, SearchX } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageFrame from '../components/layout/PageFrame.jsx'
import { Card, EmptyState } from '../components/ui/index.js'

export default function NotFoundPage() {
  return (
    <PageFrame eyebrow="404" title="This page isn’t here" description="The address may be incorrect, or the page may have moved.">
      <Card className="grid min-h-64 place-items-center p-8"><EmptyState icon={SearchX} title="The page could not be found" description="Return to your workspace to continue exploring your data." action={<Link className="button button-primary" to="/"><ArrowLeft size={15} aria-hidden="true" /> Back to workspace</Link>} /></Card>
    </PageFrame>
  )
}
