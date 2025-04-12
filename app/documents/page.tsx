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
import { FileUp, Plus, FileText, ChevronRight, Download, Search, ArrowUp, ArrowDown, ArrowUpDown, FileOutput, AlertCircle, ChevronLeft } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import DocumentForm from "@/components/document-form"
import { exportToCSV } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"

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
  ePermitUrl?: string;
  ePermitName?: string;
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
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [selectedDocs, setSelectedDocs] = useState<string[]>([])

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

  const filteredDocuments = documents.filter(doc => {
    const docDate = doc.loadedDate.substring(0, 7) // Get YYYY-MM from date
    return docDate === currentMonth
  })

  const stats = {
    total: filteredDocuments.length,
    withEPermit: filteredDocuments.filter(d => d.ePermitUrl).length,
    ssdDestination: filteredDocuments.filter(d => d.destination.toLowerCase().includes('ssd')).length
  }

  const handlePreviousMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number)
    const date = new Date(year, month - 2) // month is 0-based
    setCurrentMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`)
  }

  const handleNextMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number)
    const date = new Date(year, month) // month is 0-based
    setCurrentMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`)
  }

  const sortedAndFilteredDocuments = filteredDocuments
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
      
      if (sortColumn === "loadedDate" || sortColumn === "createdAt") {
        aValue = new Date(aValue as string).getTime().toString();
        bValue = new Date(bValue as string).getTime().toString();
      }
      
      if (sortDirection === "asc") {
        return aValue && bValue ? (aValue > bValue ? 1 : -1) : 0;
      } else {
        return aValue && bValue ? (aValue < bValue ? 1 : -1) : 0;
      }
    });

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    }
    return sortDirection === "asc" 
      ? <ArrowUp className="h-3 w-3 ml-1" />
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

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

  const handleBatchExport = () => {
    const docsToExport = sortedAndFilteredDocuments.filter(d => 
      selectedDocs.includes(d.id)
    )
    if (docsToExport.length > 0) {
      const filename = `truck-documents-batch-${new Date().toISOString().split('T')[0]}.csv`
      exportToCSV(docsToExport, filename)
      toast.success(`Exported ${docsToExport.length} documents`)
      setSelectedDocs([])
    }
  }

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

  if (!user) {
    return null;
  }

  const monthDisplay = new Date(currentMonth).toLocaleDateString(undefined, { 
    year: 'numeric', 
    month: 'long' 
  })

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
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">
                  Document Records
                </h1>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePreviousMonth}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="font-medium">{monthDisplay}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNextMonth}
                    disabled={currentMonth === new Date().toISOString().substring(0, 7)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="p-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">Total Documents</p>
                  <span className="text-2xl font-bold text-emerald-500">{stats.total}</span>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">With ePermit</p>
                  <span className="text-2xl font-bold text-blue-500">{stats.withEPermit}</span>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">SSD Deliveries</p>
                  <span className="text-2xl font-bold text-amber-500">{stats.ssdDestination}</span>
                </div>
              </Card>
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
                        <TableHead className="w-12">
                          <Checkbox 
                            checked={selectedDocs.length === sortedAndFilteredDocuments.length}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedDocs(sortedAndFilteredDocuments.map(d => d.id))
                              } else {
                                setSelectedDocs([])
                              }
                            }}
                          />
                        </TableHead>
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
                          className="cursor-pointer hover:bg-muted/70 transition-colors hidden lg:table-cell"
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
                        <TableHead className="min-w-[160px]">Documents</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedAndFilteredDocuments.map((doc) => (
                        <TableRow key={doc.id} className="group">
                          <TableCell>
                            <Checkbox 
                              checked={selectedDocs.includes(doc.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedDocs([...selectedDocs, doc.id])
                                } else {
                                  setSelectedDocs(selectedDocs.filter(id => id !== doc.id))
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {formatDate(doc.loadedDate)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {doc.truckNumber}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {doc.product}
                          </TableCell>
                          <TableCell>
                            {doc.at20Depot}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex items-center gap-2">
                              {doc.destination}
                              {doc.destination.toLowerCase().includes('ssd') && !doc.ePermitUrl && (
                                <span title="ePermit recommended for SSD destination">
                                  <AlertCircle 
                                    className="h-4 w-4 text-amber-500" 
                                  />
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 px-2 opacity-80 group-hover:opacity-100 hover:bg-emerald-500/10 transition-all"
                                asChild
                              >
                                <a
                                  href={doc.gatePassUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={doc.gatePassName}
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  Gate Pass
                                </a>
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 px-2 opacity-80 group-hover:opacity-100 hover:bg-blue-500/10 transition-all"
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
                              {doc.ePermitUrl && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 px-2 opacity-80 group-hover:opacity-100 hover:bg-amber-500/10 transition-all"
                                  asChild
                                >
                                  <a
                                    href={doc.ePermitUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title={doc.ePermitName}
                                  >
                                    <Download className="h-3 w-3 mr-1" />
                                    ePermit
                                  </a>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {selectedDocs.length > 0 && (
              <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-background/95 p-2 rounded-lg shadow-lg border">
                <span className="text-sm text-muted-foreground">
                  {selectedDocs.length} selected
                </span>
                <Button size="sm" onClick={handleBatchExport}>
                  Export Selected
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
