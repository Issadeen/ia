import { Spinner } from "@/components/ui/spinner"

export function LoadingDocuments() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Spinner className="h-10 w-10 text-primary" />
        <p className="text-muted-foreground animate-pulse">Loading documents...</p>
      </div>
    </div>
  )
}

export function DocumentTableSkeleton() {
  return (
    <div className="rounded-md border overflow-hidden bg-card animate-pulse">
      <div className="h-10 bg-muted/50 w-full" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-14 border-t flex items-center px-4 space-x-2">
          <div className="h-4 w-20 bg-muted rounded" />
          <div className="h-4 w-16 bg-muted rounded" />
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-4 w-24 bg-muted rounded" />
        </div>
      ))}
    </div>
  )
}
