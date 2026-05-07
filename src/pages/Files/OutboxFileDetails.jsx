import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useFileHistory } from "../../hooks/useFileHistory";
import {
  PrintableNotesheet,
  PdfViewerPanel,
  FileHeader,
  AuditTrailList,
} from "../../components/SharedFileUI";

const OutboxFileDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // 1. Utilize the shared logic hook
  const {
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
  } = useFileHistory(id, "outboxFileDetails", 30000);

  useEffect(() => {
    if (file?.currentHolder && user) {
      if (
        file.currentHolder === user.fullName ||
        file.currentHolder === user.full_name
      ) {
        toast.success("This file has been returned to your Inbox!", {
          icon: "📥",
          duration: 5000,
        });
        navigate(`/files/${id}`, { replace: true });
      }
    }
  }, [file.currentHolder, user, navigate, id]);

  if (isLoading || !file.subject) {
    return (
      <div className="p-10 flex justify-center mt-20 text-slate-600">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div
      className={`mx-auto animate-fade-in-up transition-all duration-300 flex flex-col print:block print:h-auto print:bg-white print:p-0 print:max-w-full print:w-full h-[calc(100vh-6rem)] overflow-hidden ${selectedPdfUrl ? "max-w-[1600px] px-4" : "max-w-[67rem]"}`}
    >
      <button
        onClick={() => navigate("/files/outbox")}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-4 mt-2 text-sm font-medium transition-colors shrink-0 w-fit print:hidden"
      >
        <ArrowLeft size={16} /> Back to Outbox
      </button>

      <PrintableNotesheet file={file} displayedHistory={displayedHistory} />

      <div
        className={`flex flex-col lg:flex-row gap-6 w-full print:hidden flex-1 overflow-hidden`}
      >
        {selectedPdfUrl && (
          <PdfViewerPanel
            url={selectedPdfUrl}
            name={selectedPdfName}
            onClose={closePdfViewer}
          />
        )}

        <div
          className={`w-full flex flex-col transition-all duration-300 h-full ${selectedPdfUrl ? "lg:w-[40%] h-full" : "h-[calc(100vh-120px)]"}`}
        >
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative z-0 flex flex-col h-full">
            <FileHeader file={file} onPrint={() => globalThis.print()} />

            <div
              ref={parentRef}
              className={`p-6 bg-slate-50/50 flex flex-col ${selectedPdfUrl ? "flex-1 overflow-y-auto" : "flex-1 overflow-y-auto min-h-[400px]"}`}
              style={{ overflowAnchor: "auto" }}
            >
              <div className="flex justify-between items-center mb-6 px-1 shrink-0">
                <span className="text-sm font-bold text-slate-700">
                  Audit Trail
                </span>
              </div>

              {/* 2. Utilize the shared list mapper component */}
              <AuditTrailList
                virtualItems={virtualItems}
                hasNextPage={hasNextPage}
                displayedHistory={displayedHistory}
                rowVirtualizer={rowVirtualizer}
                selectedPdfUrl={selectedPdfUrl}
                selectedPdfName={selectedPdfName}
                onAttachmentClick={handleAttachmentClick}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutboxFileDetails;
