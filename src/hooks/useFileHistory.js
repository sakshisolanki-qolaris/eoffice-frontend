import { useEffect, useState, useRef } from "react";
import { endpoints } from "../api/axios";
import toast from "react-hot-toast";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";

export const useFileHistory = (id, queryKey, refetchInterval = 0) => {
  const [selectedPdfUrl, setSelectedPdfUrl] = useState(null);
  const [selectedPdfName, setSelectedPdfName] = useState("");
  const [activeMessageIndex, setActiveMessageIndex] = useState(null);
  const parentRef = useRef(null);
  const hasScrolledToBottom = useRef(false);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: [queryKey, id],
      queryFn: async ({ pageParam = null }) => {
        const response = await endpoints.files.history(id, {
          cursor: pageParam,
          limit: 20,
        });
        return response.data;
      },
      getNextPageParam: (lastPage) => lastPage?.nextCursor || undefined,
      refetchInterval,
    });

  const file = data?.pages[0]?.data?.fileInfo || {};
  const displayedHistory =
    data?.pages.reduce((acc, page) => {
      return [...(page.data?.history || []), ...acc];
    }, []) || [];

  useEffect(() => {
    return () => {
      if (selectedPdfUrl) globalThis.URL.revokeObjectURL(selectedPdfUrl);
    };
  }, [selectedPdfUrl]);

  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? displayedHistory.length + 1 : displayedHistory.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 220,
    overscan: 10,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  useEffect(() => {
    if (displayedHistory.length > 0 && !hasScrolledToBottom.current) {
      setTimeout(() => {
        rowVirtualizer.scrollToIndex(displayedHistory.length - 1, {
          align: "end",
          behavior: "auto",
        });
        hasScrolledToBottom.current = true;
      }, 50);
    }
  }, [displayedHistory.length, rowVirtualizer]);

  useEffect(() => {
    if (activeMessageIndex !== null) {
      setTimeout(() => {
        rowVirtualizer.scrollToIndex(activeMessageIndex, {
          align: "center",
          behavior: "auto",
        });
      }, 300);
    }
  }, [selectedPdfUrl, activeMessageIndex, rowVirtualizer]);

  useEffect(() => {
    const firstVisibleItem = virtualItems[0];
    if (!firstVisibleItem) return;

    if (
      firstVisibleItem.index <= 1 &&
      hasNextPage &&
      !isFetchingNextPage &&
      hasScrolledToBottom.current
    ) {
      fetchNextPage();
    }
  }, [hasNextPage, fetchNextPage, isFetchingNextPage, virtualItems]);

  const handleDownload = async (attachmentId, name) => {
    const toastId = toast.loading("Opening document...");
    try {
      const response = await endpoints.files.downloadAttachment(attachmentId);
      const url = globalThis.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" }),
      );
      setSelectedPdfUrl(url);
      setSelectedPdfName(name);
      toast.success(`Opened ${name}`, { id: toastId });
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Failed to open document", { id: toastId });
    }
  };

  const handleAttachmentClick = (index, attId, attName) => {
    setActiveMessageIndex(index);
    handleDownload(attId, attName);
  };

  const closePdfViewer = () => {
    setSelectedPdfUrl(null);
    setSelectedPdfName("");
  };

  return {
    file,
    displayedHistory,
    isLoading,
    hasNextPage,
    selectedPdfUrl,
    selectedPdfName,
    parentRef,
    rowVirtualizer,
    virtualItems,
    handleAttachmentClick,
    closePdfViewer,
  };
};