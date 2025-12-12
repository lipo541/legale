import { notFound } from 'next/navigation'

// This catch-all route handles any unmatched paths under [locale]
// It MUST call notFound() to return proper 404 status code
export default function CatchAllNotFound() {
  // Call notFound() to trigger the 404 response with proper HTTP status
  notFound()
}
