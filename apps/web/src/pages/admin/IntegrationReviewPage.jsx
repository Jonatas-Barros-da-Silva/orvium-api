
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { toast } from 'sonner';
import { Loader } from '@/components/ui/Loader.jsx';
import { SubmissionCard } from '@/components/admin/SubmissionCard.jsx';
import { SubmissionReviewPanel } from '@/components/admin/SubmissionReviewPanel.jsx';
import { ShieldCheck, Inbox } from 'lucide-react';
import apiServerClient from '@/lib/apiServerClient';

export default function IntegrationReviewPage() {
  const [submissions, setSubmissions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [fullSubmission, setFullSubmission] = useState(null);
  
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchPendingSubmissions = async () => {
    try {
      const res = await apiServerClient.fetch('/reviews/pending');
      if (!res.ok) throw new Error('Failed to fetch pending reviews');
      const data = await res.json();
      setSubmissions(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchPendingSubmissions();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setFullSubmission(null);
      return;
    }

    const fetchDetails = async () => {
      setLoadingDetails(true);
      try {
        const res = await apiServerClient.fetch(`/reviews/${selectedId}`);
        if (!res.ok) throw new Error('Failed to fetch submission details');
        const data = await res.json();
        setFullSubmission(data);
      } catch (error) {
        toast.error(error.message);
        setSelectedId(null);
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchDetails();
  }, [selectedId]);

  const handleApprove = async (id) => {
    setIsProcessing(true);
    try {
      const res = await apiServerClient.fetch(`/reviews/${id}/approve`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to approve submission');
      
      toast.success('Integration approved successfully');
      setSelectedId(null);
      fetchPendingSubmissions();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (id, notes) => {
    setIsProcessing(true);
    try {
      const res = await apiServerClient.fetch(`/reviews/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      });
      if (!res.ok) throw new Error('Failed to reject submission');
      
      toast.success('Integration rejected');
      setSelectedId(null);
      fetchPendingSubmissions();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <Helmet>
        <title>Integration Reviews | Admin</title>
      </Helmet>

      <div className="bg-card border-b border-border/50 px-6 py-5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Integration Reviews</h1>
            <p className="text-sm text-muted-foreground">Review and approve third-party integrations for the marketplace.</p>
          </div>
        </div>
      </div>

      <div className="flex-grow flex flex-col md:flex-row overflow-hidden h-[calc(100dvh-89px)]">
        {/* Left Sidebar - List */}
        <div className="w-full md:w-80 lg:w-96 border-r border-border/50 bg-muted/10 flex flex-col shrink-0 h-full overflow-y-auto">
          <div className="p-4 border-b border-border/50 bg-card sticky top-0 z-10">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Inbox className="w-4 h-4 text-muted-foreground" />
              Pending Queue ({submissions.length})
            </h2>
          </div>
          
          <div className="p-4 space-y-3">
            {loadingList ? (
              <div className="py-12 flex justify-center">
                <Loader size={24} />
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No pending submissions.</p>
                <p className="text-sm mt-1">You're all caught up!</p>
              </div>
            ) : (
              submissions.map(sub => (
                <SubmissionCard 
                  key={sub.id} 
                  submission={sub} 
                  isSelected={selectedId === sub.id}
                  onClick={() => setSelectedId(sub.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Right Main Area - Details */}
        <div className="flex-grow p-4 md:p-6 lg:p-8 bg-background h-full overflow-hidden">
          {loadingDetails ? (
            <div className="h-full flex items-center justify-center">
              <Loader text="Loading submission details..." size={32} />
            </div>
          ) : (
            <SubmissionReviewPanel 
              submission={fullSubmission} 
              onApprove={handleApprove}
              onReject={handleReject}
              isProcessing={isProcessing}
            />
          )}
        </div>
      </div>
    </div>
  );
}
