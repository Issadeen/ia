"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Spinner } from "@/components/ui/spinner"
import { FileUp, Plus, FileText, ChevronRight, Download, Search, ArrowUp, ArrowDown, ArrowUpDown, FileOutput } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import DocumentForm from "@/components/document-form"
import { exportToCSV } from "@/lib/utils"

interface Document {
  id: string;
  truckNumber: string;
  loadedDate: string;
  at20Depot: string;
  product: string;
  destination: string;
  gatePassUrl: string;
  tr812Url: string;
  gatePassName: string;
  tr812Name: string;
  createdAt: string;
}

export default function DocumentsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [documents, setDocuments] = useState<Document[]>([])
  const [showForm, setShowForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [sortColumn, setSortColumn] = useState<string>("loadedDate")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  
  // Use an effect for redirection instead of doing it in the component body
  useEffect(() => {
    if (typeof window !== "undefined" && !user && !isLoading) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!user) return
      
      setIsLoading(true)
      try {
        // This query filters documents by userId, so each user only sees their own documents
        const q = query(
          collection(db, "documents"), 
          where("userId", "==", user.uid)
        )
        
        const querySnapshot = await getDocs(q)
        const docs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Document[]
        
        setDocuments(docs)
        setError(null)
      } catch (error) {
        console.error("Error fetching documents:", error)
        setError("Failed to load documents. Please check your connection and try again.")
        toast.error("Failed to load documents")
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchDocuments()
    } else {
      setIsLoading(false)
    }
  }, [user, showForm])

  // Sort and filter documents
  const sortedAndFilteredDocuments = documents
    .filter(doc => {
      if (!searchQuery) return true;
      
      const searchLower = searchQuery.toLowerCase();
      return (
        doc.truckNumber.toLowerCase().includes(searchLower) ||
        doc.product.toLowerCase().includes(searchLower) ||
        doc.at20Depot.toLowerCase().includes(searchLower) ||
        doc.destination.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      let aValue = a[sortColumn as keyof Document];
      let bValue = b[sortColumn as keyof Document];
      
      // Handle date fields
      if (sortColumn === "loadedDate" || sortColumn === "createdAt") {
        aValue = new Date(aValue as string).getTime().toString();
        bValue = new Date(bValue as string).getTime().toString();
      }
      
      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? -1 : 1;
      }
    });

  // Handle column sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new column and default to descending
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  // Get sort icon
  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    }
    return sortDirection === "asc" 
      ? <ArrowUp className="h-3 w-3 ml-1" />
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  const handleExport = () => {
    if (sortedAndFilteredDocuments.length > 0) {
      const filename = `truck-documents-${new Date().toISOString().split('T')[0]}.csv`;
      exportToCSV(sortedAndFilteredDocuments, filename);
      toast.success('Export successful');
    } else {
      toast.error('No documents to export');
    }
  };

  // If loading, show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="h-10 w-10 text-primary" />
          <p className="text-muted-foreground animate-pulse">Loading documents...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render anything - the effect will handle redirection
  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <header className="fixed top-0 left-0 right-0 flex w-full items-center justify-between border-b bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="flex items-center gap-2">
          <FileUp className="h-5 w-5 md:h-6 md:w-6 text-emerald-500" />
          <span className="bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-xl md:text-2xl font-bold text-transparent hidden sm:block">
            Truck Documents
          </span>
          <span className="bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-xl font-bold text-transparent sm:hidden">
            Documents
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => router.push('/dashboard')} 
            variant="ghost" 
            size="sm" 
            className="hidden md:flex"
          >
            Back to Dashboard
          </Button>
          <Button 
            onClick={() => router.push('/dashboard')} 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
          >
            <ChevronRight />
          </Button>
        </div>
      </header>

      <main className="flex flex-col w-full max-w-7xl mx-auto mt-20 p-4">
        {showForm ? (
          <div className="w-full animate-in fade-in slide-in-from-top-4 duration-300">
            <Button 
              variant="outline" 
              onClick={() => setShowForm(false)} 
              className="mb-4"
              size="sm"
            >
              &larr; Back to Documents
            </Button>
            <DocumentForm onSuccess={() => setShowForm(false)} />
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">
                Document Records
              </h1>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search documents..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
                
                <div className="flex gap-2">
                  {sortedAndFilteredDocuments.length > 0 && (
                    <Button 
                      variant="outline" 
                      onClick={handleExport} 
                      title="Export to CSV"
                    >
                      <FileOutput className="h-4 w-4 mr-2" /> Export
                    </Button>
                  )}
                  
                  <Button 
                    onClick={() => setShowForm(true)} 
                    className="w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" /> New Document
                  </Button>
                </div>
              </div>
            </div>
            
            {error ? (
              <Card className="p-6 text-center">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground/40 mb-4" />
                <h3 className="text-xl font-medium mb-2 text-destructive">Error Loading Documents</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={() => window.location.reload()}>Try Again</Button>
              </Card>
            ) : sortedAndFilteredDocuments.length === 0 ? (
              <Card className="p-6 text-center">
                {searchQuery ? (
                  <>
                    <Search className="h-16 w-16 mx-auto text-muted-foreground/40 mb-4" />
                    <h3 className="text-xl font-medium mb-2">No matching documents</h3>
                    <p className="text-muted-foreground mb-6">
                      Try adjusting your search query
                    </p>
                    <Button variant="outline" onClick={() => setSearchQuery("")}>
                      Clear Search
                    </Button>
                  </>
                ) : (
                  <>
                    <FileText className="h-16 w-16 mx-auto text-muted-foreground/40 mb-4" />
                    <h3 className="text-xl font-medium mb-2">No documents yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Upload your first truck document to get started
                    </p>
                    <Button onClick={() => setShowForm(true)}>
                      <Plus className="h-4 w-4 mr-2" /> Upload Document
                    </Button>
                  </>
                )}
              </Card>
            ) : (
              <div className="rounded-md border overflow-hidden bg-card">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/70 transition-colors"
                          onClick={() => handleSort("loadedDate")}
                        >
                          <div className="flex items-center">
                            Date
                            {getSortIcon("loadedDate")}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/70 transition-colors"
                          onClick={() => handleSort("truckNumber")}
                        >
                          <div className="flex items-center">
                            Truck No.
                            {getSortIcon("truckNumber")}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/70 transition-colors hidden md:table-cell"
                          onClick={() => handleSort("product")}
                        >
                          <div className="flex items-center">
                            Product
                            {getSortIcon("product")}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/70 transition-colors"
                          onClick={() => handleSort("at20Depot")}
                        >
                          <div className="flex items-center">
                            AT20
                            {getSortIcon("at20Depot")}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/70 transition-colors hidden md:table-cell"
                          onClick={() => handleSort("destination")}
                        >
                          <div className="flex items-center">
                            Destination
                            {getSortIcon("destination")}
                          </div>
                        </TableHead>
                        <TableHead>Documents</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedAndFilteredDocuments.map((doc) => (
                        <TableRow key={doc.id} className="group">
                          <TableCell className="font-mono text-xs">
                            {formatDate(doc.loadedDate)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {doc.truckNumber}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {doc.product}
                          </TableCell>
                          <TableCell>
                            {doc.at20Depot}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {doc.destination}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 px-2 opacity-80 group-hover:opacity-100 group-hover:bg-primary/10 transition-all"
                                asChild
                              >
                                <a
                                  href={doc.gatePassUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={doc.gatePassName}
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  GP
                                </a>
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 px-2 opacity-80 group-hover:opacity-100 group-hover:bg-primary/10 transition-all"
                                asChild
                              >
                                <a
                                  href={doc.tr812Url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={doc.tr812Name}
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  TR812
                                </a>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
