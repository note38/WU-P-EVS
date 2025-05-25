"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { SearchInput } from "../search-input";
import { CandidateForm } from "./candidate-form";
import { CandidatesTable } from "./candidates-table";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useOptimizedFetch, useDebounce } from "@/app/hooks/use-debounce";

interface CandidatesTabProps {
  electionId: number;
}

export function CandidatesTab({ electionId }: CandidatesTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [currentPage, setCurrentPage] = useState(1);

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

  // Build query parameters for candidates
  const candidatesUrl = useMemo(() => {
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: "8",
    });

    if (debouncedSearchTerm.trim()) {
      params.append("search", debouncedSearchTerm.trim());
    }

    return `/api/elections/${electionId}/candidates?${params.toString()}`;
  }, [electionId, currentPage, debouncedSearchTerm]);

  const {
    data: candidatesData,
    loading,
    refetch: refetchCandidates,
  } = useOptimizedFetch<any>(candidatesUrl, undefined, [candidatesUrl]);

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

  const handleCandidateAdded = useCallback(() => {
    setSearchTerm("");
    setCurrentPage(1);
    setTimeout(() => refetchCandidates(), 500);
  }, [refetchCandidates]);

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
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search candidates..."
        />
        <CandidateForm
          electionId={electionId}
          positions={positions || []}
          partylists={partylists || []}
          onCandidateAdded={handleCandidateAdded}
        />
      </div>

      <CandidatesTable
        candidates={candidates}
        loading={loading}
        onCandidateUpdated={() => refetchCandidates()}
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
