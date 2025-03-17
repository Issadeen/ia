"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { collection, addDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Spinner } from "@/components/ui/spinner"
import { FileUp } from "lucide-react"
import { useStorageQuota } from '@/hooks/use-storage-quota'
import { auth } from "@/lib/firebase"
import { useImgBBUpload } from "@/hooks/use-imgbb-upload";

interface DocumentFormData {
  truckNumber: string
  loadedDate: string
  at20Depot: string
  product: string
  destination: string
}

interface DocumentFormProps {
  onSuccess: () => void
}

export default function DocumentForm({ onSuccess }: DocumentFormProps) {
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [gatePassFile, setGatePassFile] = useState<File | null>(null)
  const [tr812File, setTr812File] = useState<File | null>(null)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<DocumentFormData>()
  const { usedBytes, formattedUsage, isLoading: isLoadingQuota } = useStorageQuota()
  const { uploadFile, isUploading } = useImgBBUpload()
  const percentageUsed = Math.min(Math.round((usedBytes / (5 * 1024 * 1024)) * 100), 100)
  const isOverQuota = percentageUsed >= 100

  const handleGatePassChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setGatePassFile(e.target.files[0])
    }
  }

  const handleTR812Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setTr812File(e.target.files[0])
    }
  }

  const onSubmit = async (data: DocumentFormData) => {
    if (!user || !gatePassFile || !tr812File) {
      toast.error('Please select all required files');
      return;
    }
    
    // Check file size (ImgBB has a 32MB limit, but let's use 10MB to be safe)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (gatePassFile.size > MAX_SIZE || tr812File.size > MAX_SIZE) {
      toast.error('Files must be smaller than 10MB');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Try uploading one file at a time to better handle errors
      toast.info('Uploading gate pass...');
      const gatePassUrl = await uploadFile(gatePassFile);
      
      toast.info('Uploading TR812 form...');
      const tr812Url = await uploadFile(tr812File);
      
      toast.info('Saving document information...');
      
      // Save document metadata to Firestore
      await addDoc(collection(db, 'documents'), {
        userId: user.uid,
        userEmail: user.email,
        truckNumber: data.truckNumber,
        loadedDate: data.loadedDate,
        at20Depot: data.at20Depot,
        product: data.product,
        destination: data.destination,
        gatePassUrl,
        tr812Url,
        gatePassName: gatePassFile.name,
        tr812Name: tr812File.name,
        createdAt: new Date().toISOString()
      });
      
      toast.success('Document uploaded successfully');
      reset();
      setGatePassFile(null);
      setTr812File(null);
      onSuccess();
    } catch (error) {
      console.error('Error uploading documents:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Unknown error occurred';
      
      toast.error(`Upload failed: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="bg-muted/50">
        <CardTitle className="text-xl bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent flex items-center gap-2">
          <FileUp className="h-5 w-5" />
          New Document
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {!isLoadingQuota && (
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-1">
              <span>Storage Used:</span>
              <span>{formattedUsage}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full ${
                  percentageUsed < 70 ? 'bg-emerald-500' : 
                  percentageUsed < 90 ? 'bg-amber-500' : 
                  'bg-red-500'
                }`} 
                style={{ width: `${percentageUsed}%` }}
              ></div>
            </div>
            {isOverQuota && (
              <p className="text-sm text-destructive mt-2">
                You've exceeded your storage quota. Please delete some documents before uploading more.
              </p>
            )}
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="truckNumber">Truck Number</Label>
              <Input
                id="truckNumber"
                {...register('truckNumber', { required: true })}
                className={errors.truckNumber ? "border-destructive" : ""}
                placeholder="e.g. TRK-12345"
              />
              {errors.truckNumber && (
                <p className="text-sm text-destructive">Required</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="loadedDate">Loaded Date</Label>
              <Input
                id="loadedDate"
                type="date"
                {...register('loadedDate', { required: true })}
                className={errors.loadedDate ? "border-destructive" : ""}
              />
              {errors.loadedDate && (
                <p className="text-sm text-destructive">Required</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="at20Depot">AT20 Depot</Label>
              <Input
                id="at20Depot"
                {...register('at20Depot', { required: true })}
                className={errors.at20Depot ? "border-destructive" : ""}
                placeholder="e.g. Main Depot"
              />
              {errors.at20Depot && (
                <p className="text-sm text-destructive">Required</p>
              )} 
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="product">Product</Label>
              <Input
                id="product"
                {...register('product', { required: true })}
                className={errors.product ? "border-destructive" : ""}
                placeholder="e.g. Diesel"
              />
              {errors.product && (
                <p className="text-sm text-destructive">Required</p>
              )}
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="destination">Destination</Label>
              <Input
                id="destination"
                {...register('destination', { required: true })}
                className={errors.destination ? "border-destructive" : ""}
                placeholder="e.g. North Distribution Center"
              />
              {errors.destination && (
                <p className="text-sm text-destructive">Required</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gatePass">
                Gate Pass <span className="text-muted-foreground text-xs">(PDF, JPG, PNG)</span>
              </Label>
              <div className="border rounded-md overflow-hidden">
                <Input
                  id="gatePass"
                  type="file"
                  onChange={handleGatePassChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                  required
                  className="border-0"
                />
              </div>
              {gatePassFile && (
                <p className="text-xs text-muted-foreground">
                  Selected: {gatePassFile.name}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tr812">
                TR812 Form <span className="text-muted-foreground text-xs">(PDF, JPG, PNG)</span>
              </Label>
              <div className="border rounded-md overflow-hidden">
                <Input
                  id="tr812"
                  type="file"
                  onChange={handleTR812Change}
                  accept=".pdf,.jpg,.jpeg,.png"
                  required
                  className="border-0"
                />
              </div>
              {tr812File && (
                <p className="text-xs text-muted-foreground">
                  Selected: {tr812File.name}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button
              type="submit"
              className="w-full md:w-auto"
              disabled={isSubmitting || isUploading || !gatePassFile || !tr812File}
            >
              {isSubmitting || isUploading ? (
                <>
                  <Spinner className="mr-2" />
                  {isUploading ? 'Uploading Files...' : 'Saving...'}
                </>
              ) : (
                'Upload Document'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}