"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { SearchInput } from "../search-input";
import { CandidateForm } from "./candidate-form";
import { CandidatesTable } from "./candidates-table";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon, Loader2 } from "lucide-react";
import { useOptimizedFetch, useDebounce } from "@/app/hooks/use-debounce";

interface CandidatesTabProps {
  electionId: number;
}

export function CandidatesTab({ electionId }: CandidatesTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const [forceRefresh, setForceRefresh] = useState(0);
  const [isHardReloading, setIsHardReloading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Use optimized fetch hooks with caching
  const { data: positions } = useOptimizedFetch<any[]>(
    `/api/elections/${electionId}/positions`,
    undefined,
    [electionId]
  );

  const { data: partylists } = useOptimizedFetch<any[]>(
    `/api/elections/${electionId}/partylists`,
    undefined,
    [electionId]
  );

  // Build query parameters for candidates with force refresh parameter
  const candidatesUrl = useMemo(() => {
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: "8",
    });

    if (debouncedSearchTerm.trim()) {
      params.append("search", debouncedSearchTerm.trim());
    }

    // Add timestamp to force cache bypass when needed
    if (forceRefresh > 0) {
      params.append("_t", Date.now().toString());
    }

    return `/api/elections/${electionId}/candidates?${params.toString()}`;
  }, [electionId, currentPage, debouncedSearchTerm, forceRefresh]);

  const {
    data: candidatesData,
    loading: hookLoading,
    refetch: refetchCandidates,
    forceRefetch: forceRefetchCandidates,
  } = useOptimizedFetch<any>(candidatesUrl, undefined, [candidatesUrl]);

  // Update isLoading based on hook loading state and track initialization
  React.useEffect(() => {
    if (!initialized && candidatesData !== undefined) {
      setInitialized(true);
    }
    setIsLoading(hookLoading);
  }, [hookLoading, candidatesData, initialized]);

  // Memoize candidates and pagination data
  const { candidates, pagination } = useMemo(() => {
    if (!candidatesData) return { candidates: [], pagination: null };

    return {
      candidates: candidatesData.candidates || candidatesData,
      pagination: candidatesData.pagination || {
        currentPage: 1,
        totalPages: 1,
        total: 0,
      },
    };
  }, [candidatesData]);

  // Reset to page 1 when search changes
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm]);

  // Hard reload function that bypasses cache
  const hardReloadCandidates = useCallback(async () => {
    console.log("🔄 Starting hard reload of candidates...");
    setIsHardReloading(true);
    setIsLoading(true);
    setError(null);
    setInitialized(false);
    setForceRefresh((prev) => prev + 1);

    try {
      // Use forceRefetch to bypass cache completely
      await forceRefetchCandidates();
      console.log("✅ Hard reload completed successfully");
    } catch (error) {
      console.error("❌ Error during hard reload:", error);
      setError("Failed to load candidates. Please try again later.");
    } finally {
      // Add a small delay to ensure the UI updates properly
      setTimeout(() => {
        setIsHardReloading(false);
        console.log("🏁 Hard reload state cleared");
      }, 300);
    }
  }, [forceRefetchCandidates]);

  const handleCandidateAdded = useCallback(() => {
    console.log("➕ Candidate added, triggering hard reload...");
    setSearchTerm("");
    setCurrentPage(1); // Reset to first page to see the new candidate
    // Use hard reload instead of regular refetch
    hardReloadCandidates();
  }, [hardReloadCandidates]);

  const handleCandidateUpdated = useCallback(() => {
    console.log("✏️ Candidate updated, triggering hard reload...");
    // Use hard reload for immediate visibility of changes
    hardReloadCandidates();
  }, [hardReloadCandidates]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;

    if (pagination.totalPages <= maxVisiblePages) {
      // Show all pages if total pages is small
      for (let i = 1; i <= pagination.totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Show current page and surrounding pages
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(
        pagination.totalPages,
        startPage + maxVisiblePages - 1
      );

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
    }

    return pageNumbers;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex items-center gap-2">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search candidates..."
          />
          {isHardReloading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Refreshing...</span>
            </div>
          )}
        </div>
        <CandidateForm
          electionId={electionId}
          positions={positions || []}
          partylists={partylists || []}
          onCandidateAdded={handleCandidateAdded}
        />
      </div>

      {error && (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <p className="text-lg text-red-500">{error}</p>
        </div>
      )}

      <CandidatesTable
        candidates={candidates}
        loading={isLoading || isHardReloading || !initialized}
        onCandidateUpdated={handleCandidateUpdated}
        electionId={electionId}
        positions={positions || []}
        partylists={partylists || []}
      />

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * 8 + 1} to{" "}
            {Math.min(currentPage * 8, pagination.total)} of {pagination.total}{" "}
            candidates
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeftIcon className="h-4 w-4" />
              Previous
            </Button>

            {getPageNumbers().map((pageNumber) => (
              <Button
                key={pageNumber}
                variant={currentPage === pageNumber ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(pageNumber)}
                className="w-8 h-8 p-0"
              >
                {pageNumber}
              </Button>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === pagination.totalPages}
            >
              Next
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
