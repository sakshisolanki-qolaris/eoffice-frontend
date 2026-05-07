import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { endpoints } from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import {
  Paperclip,
  ArrowLeft,
  Loader2,
  X,
  Send,
  Users,
  Trash2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

// 1. Import the shared hook and components we extracted previously
import { useFileHistory } from "../../hooks/useFileHistory";
import {
  PrintableNotesheet,
  PdfViewerPanel,
  FileHeader,
  AuditTrailList,
} from "../../components/SharedFileUI";

const FileDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // 2. Consume the shared history hook to remove duplicated API & Virtualizer logic
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
  } = useFileHistory(id, "fileDetails");

  // Local state for the compose/forwarding window
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [attachments, setAttachments] = useState([]);

  const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [composeHeight, setComposeHeight] = useState(260);

  const dropdownRef = useRef(null);

  const { data: allUsers = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: async () => {
      const response = await endpoints.users.getAll();
      return response.data.data;
    },
    staleTime: 1000 * 60 * 60 * 24,
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getDesignationName = (val) =>
    val?.name || (typeof val === "string" ? val : "");

  const filteredUsers = allUsers.filter(
    (u) =>
      u.id !== user?.id &&
      (u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getDesignationName(u.designation)
          .toLowerCase()
          .includes(searchTerm.toLowerCase())),
  );

  const openForwardConfirmation = () => {
    if (!selectedRecipient) return toast.error("Please select a recipient");
    if (!remarks.trim()) return toast.error("Please enter forwarding remarks");
    if (!user.isPinSet) {
      toast.error("You must set your security PIN before sending files.");
      navigate("/auth/set-pin", { state: { returnUrl: `/files/${id}` } });
      return;
    }
    setIsForwardModalOpen(true);
    setPin("");
  };

  const handleForward = async () => {
    if (pin?.length !== 4)
      return toast.error("Please enter a valid 4-digit PIN");

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("receiverId", selectedRecipient.id);
      formData.append("action", "FORWARD");
      formData.append("remarks", remarks);
      formData.append("pin", pin);

      attachments.forEach((file) => {
        formData.append("attachments", file);
      });

      await endpoints.workflow.move(id, formData);
      toast.success("File forwarded successfully");
      setIsForwardModalOpen(false);
      navigate("/files/outbox");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to forward file");
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeSelectedAttachment = (indexToRemove) => {
    setAttachments((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const startResizing = (e) => {
    e.preventDefault();
    const isTouch = e.type === "touchstart";

    const onMouseMove = (moveEvent) => {
      const clientY = isTouch
        ? moveEvent.touches[0].clientY
        : moveEvent.clientY;
      const newHeight = globalThis.innerHeight - clientY - 80;
      if (newHeight < 100) setComposeHeight(0);
      else if (newHeight <= globalThis.innerHeight * 0.8)
        setComposeHeight(newHeight);
    };

    const onMouseUp = () => {
      document.removeEventListener(
        isTouch ? "touchmove" : "mousemove",
        onMouseMove,
      );
      document.removeEventListener(isTouch ? "touchend" : "mouseup", onMouseUp);
    };

    document.addEventListener(
      isTouch ? "touchmove" : "mousemove",
      onMouseMove,
      { passive: false },
    );
    document.addEventListener(isTouch ? "touchend" : "mouseup", onMouseUp);
  };

  if (isLoading || !file.subject) {
    return (
      <div className="p-10 flex justify-center mt-20">
        <Loader2 className="animate-spin text-slate-600" size={32} />
      </div>
    );
  }

  return (
    <div
      className={`mx-auto animate-fade-in-up transition-all duration-300 flex flex-col print:block print:h-auto print:bg-white print:p-0 print:max-w-full print:w-full ${selectedPdfUrl ? "max-w-[1600px] px-4 h-[calc(100vh-80px)]" : "max-w-[67rem]"}`}
    >
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-4 mt-2 text-sm font-medium transition-colors shrink-0 w-fit print:hidden"
      >
        <ArrowLeft size={16} /> Back
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
          className={`w-full flex flex-col transition-all duration-300 ${selectedPdfUrl ? "lg:w-[40%] h-full" : "h-[calc(100vh-120px)]"}`}
        >
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative z-0 flex flex-col h-full">
            <FileHeader file={file} onPrint={() => globalThis.print()} />

            <div
              ref={parentRef}
              className="flex-1 overflow-y-auto p-6 bg-slate-50/50 flex flex-col"
              style={{ overflowAnchor: "auto" }}
            >
              <div className="flex justify-between items-center mb-6 px-1 shrink-0">
                <span className="text-sm font-bold text-slate-700">
                  Audit Trail
                </span>
              </div>

              {/* 3. Replaced duplicate mapping logic with the Shared Component */}
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

            <button
              type="button"
              aria-label="Resize or toggle remarks panel"
              onMouseDown={startResizing}
              onTouchStart={startResizing}
              onDoubleClick={() =>
                setComposeHeight(composeHeight === 0 ? 260 : 0)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setComposeHeight(composeHeight === 0 ? 260 : 0);
                }
              }}
              className={`w-full cursor-row-resize bg-slate-100 hover:bg-teal-50 transition-colors flex items-center justify-center shrink-0 group border-y border-slate-200 z-10 relative outline-none focus:bg-teal-50 ${composeHeight === 0 ? "h-6" : "h-3"}`}
            >
              <div className="w-12 h-1 bg-slate-400 rounded-full group-hover:bg-teal-500 transition-colors"></div>
              {composeHeight === 0 && (
                <span className="absolute text-[10px] text-slate-500 font-bold tracking-widest uppercase ml-20 pointer-events-none">
                  Open Remarks
                </span>
              )}
            </button>

            <div
              className={`bg-slate-50/50 rounded-b-2xl shrink-0 flex flex-col relative z-30 ${composeHeight === 0 ? "overflow-hidden" : "overflow-visible"}`}
              style={{ height: composeHeight }}
            >
              <div
                className={`flex-1 flex flex-col h-full ${selectedPdfUrl ? "px-6 pb-6 pt-3" : "px-8 pb-8 pt-4"}`}
              >
                <div
                  className={`border border-slate-300 rounded-2xl shadow-lg transition-all bg-white flex flex-col h-full ${composeHeight === 0 ? "overflow-hidden" : "overflow-visible"}`}
                >
                  <div className="shrink-0 flex items-center border-b border-slate-100 px-5 py-3 bg-slate-100/80 rounded-t-2xl relative">
                    <span className="text-black text-sm font-medium w-10">
                      To:
                    </span>
                    {selectedRecipient ? (
                      <div className="flex items-center gap-2 bg-slate-800 text-white border border-slate-700 px-3 py-1.5 rounded-full text-xs shadow-sm">
                        <span className="font-medium">
                          {selectedRecipient.full_name}
                        </span>
                        <span className="opacity-70">
                          ({getDesignationName(selectedRecipient.designation)})
                        </span>
                        <div className="w-px h-3 bg-slate-600 mx-1"></div>
                        <X
                          size={14}
                          className="cursor-pointer hover:text-red-400"
                          onClick={() => setSelectedRecipient(null)}
                        />
                      </div>
                    ) : (
                      <div className="flex-1 relative" ref={dropdownRef}>
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onFocus={() => setIsDropdownOpen(true)}
                          className="w-full bg-transparent text-sm outline-none text-slate-800 py-1 placeholder:text-slate-400"
                          placeholder="Search recipient by name or designation..."
                        />
                        {isDropdownOpen && (
                          <div className="absolute bottom-full left-0 mb-2 w-full max-w-md bg-white border border-slate-200 shadow-2xl rounded-xl z-50 max-h-48 overflow-y-auto">
                            {filteredUsers.length === 0 ? (
                              <div className="p-4 text-center text-slate-400 flex flex-col items-center">
                                <Users size={24} className="mb-2 opacity-30" />
                                <p className="text-xs">No users found</p>
                              </div>
                            ) : (
                              filteredUsers.map((u) => (
                                <button
                                  type="button"
                                  key={u.id}
                                  onClick={() => {
                                    setSelectedRecipient(u);
                                    setSearchTerm("");
                                    setIsDropdownOpen(false);
                                  }}
                                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-none flex items-center justify-between group transition-colors"
                                >
                                  <div>
                                    <p className="text-sm font-bold text-slate-800">
                                      {u.full_name}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                      {getDesignationName(u.designation)}
                                    </p>
                                  </div>
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="flex-1 w-full p-4 text-sm text-slate-800 outline-none resize-none leading-relaxed placeholder:text-slate-400 min-h-[60px]"
                    placeholder="Add your comments before forwarding..."
                  />

                  {attachments.length > 0 && (
                    <div className="shrink-0 px-5 py-3 border-t border-slate-100 flex flex-wrap gap-3 bg-slate-50/50 overflow-y-auto max-h-24">
                      {attachments.map((file, idx) => (
                        <div
                          key={file.name}
                          className="relative group flex flex-col w-24 rounded-lg overflow-hidden shadow-sm border border-slate-200 bg-white"
                        >
                          <button
                            type="button"
                            onClick={() => removeSelectedAttachment(idx)}
                            className="absolute top-1 right-1 z-10 bg-white/90 text-slate-500 hover:text-red-500 hover:bg-red-50 p-1 rounded-full border border-slate-100"
                          >
                            <X size={10} />
                          </button>
                          <div className="h-10 bg-gradient-to-br from-slate-50 to-slate-100 border-b flex items-center justify-center p-1">
                            <Paperclip size={12} className="text-slate-400" />
                          </div>
                          <div className="p-1.5 bg-white">
                            <p className="text-[9px] font-bold text-slate-800 truncate">
                              {file.name}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="shrink-0 flex justify-between items-center px-5 py-3 bg-white border-t border-slate-100 rounded-b-2xl">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={openForwardConfirmation}
                        disabled={isSubmitting || !selectedRecipient}
                        className="w-40 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg shadow-teal-200 transition-all transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        Send File
                      </button>

                      <label
                        className="p-2 text-slate-500 hover:bg-slate-100 rounded-full cursor-pointer transition-colors"
                        title="Attach files"
                      >
                        <Paperclip size={18} />
                        <input
                          type="file"
                          accept="application/pdf"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            if (!e.target.files?.length) return;

                            const newFiles = Array.from(e.target.files);
                            const validFiles = newFiles.filter(
                              (file) => file.size <= 10 * 1024 * 1024,
                            );

                            if (newFiles.length !== validFiles.length)
                              toast.error(
                                "Some files exceed the 10MB limit and were skipped.",
                              );

                            setAttachments((prev) => {
                              const combined = [...prev, ...validFiles];
                              if (combined.length > 10) {
                                toast.error("Maximum 10 attachments allowed.");
                                return combined.slice(0, 10);
                              }
                              return combined;
                            });

                            e.target.value = null;
                          }}
                        />
                      </label>
                    </div>

                    <button
                      onClick={() => {
                        setRemarks("");
                        setAttachments([]);
                        setSelectedRecipient(null);
                      }}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      title="Discard Draft"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isForwardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4 animate-in fade-in duration-200 print:hidden">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-50 p-6 text-center border-b border-slate-100">
              <div className="w-16 h-16 bg-white border border-slate-200 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Send size={24} className="ml-1" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-800">
                Confirm Forward
              </h3>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Forwarding file to <br />
                <span className="font-bold text-slate-800 text-base">
                  {selectedRecipient?.full_name}
                </span>
                {attachments.length > 0 && (
                  <>
                    <br />
                    <span className="text-blue-600 font-medium">
                      ({attachments.length} attachment
                      {attachments.length > 1 ? "s" : ""} included)
                    </span>
                  </>
                )}
              </p>
            </div>

            <div className="p-8">
              <label
                htmlFor="pinInput"
                className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 text-center"
              >
                Enter Security PIN
              </label>
              <input
                id="pinInput"
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full text-center text-4xl tracking-[0.5em] p-4 bg-white border-2 border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none font-black text-slate-800 shadow-inner"
                placeholder="••••"
                autoFocus
              />
            </div>

            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={() => setIsForwardModalOpen(false)}
                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleForward}
                disabled={isSubmitting || pin.length !== 4}
                className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 text-sm"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  "Verify & Send"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileDetails;
