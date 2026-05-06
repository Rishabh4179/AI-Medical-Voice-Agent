"use client";
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SessionDetail } from "../medical-agent/[sessionId]/page";
import moment from "moment";
import axios from "axios";

type Props = {
  record: SessionDetail;
};

type MedicalReport = {
  sessionId: string;
  agent: string;
  user: string;
  timestamp: string;
  chiefComplaint: string;
  summary: string;
  symptoms: string[];
  duration: string;
  severity: string;
  medicationsMentioned: string[];
  recommendations: string[];
};

function isReportEmpty(r: MedicalReport | null): boolean {
  if (!r) return true;
  return (
    !r.chiefComplaint &&
    !r.summary &&
    (!r.symptoms || r.symptoms.length === 0) &&
    !r.duration &&
    !r.severity &&
    (!r.medicationsMentioned || r.medicationsMentioned.length === 0) &&
    (!r.recommendations || r.recommendations.length === 0)
  );
}

function ViewReportDialog({ record }: Props) {
    const [qaInput, setQaInput] = useState("");
    const [qaAnswer, setQaAnswer] = useState<string | null>(null);
    const [qaLoading, setQaLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const existing = (record as any).report || null;
  const [report, setReport] = useState<MedicalReport | null>(
    isReportEmpty(existing) ? null : existing
  );
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    const conversation = (record as any).conversation;
    if (!conversation || (Array.isArray(conversation) && conversation.length === 0)) {
      setReport(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post("/api/medical-report", {
        sessionId: record.sessionId,
        sessionDetail: record,
        messages: conversation,
      });
      const data = res.data;
      setReport(isReportEmpty(data) ? null : data);
    } catch (err) {
      console.error("Failed to fetch report", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open && !report) {
      fetchReport();
    }
  }, [open]);

  // Handler for AI-powered Q&A
  const handleAskQuestion = async () => {
    if (!qaInput.trim() || !report) return;
    setQaLoading(true);
    setQaAnswer(null);
    try {
      const res = await fetch("/api/report-qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report, conversation: (record as any).conversation || [], question: qaInput }),
      });
      if (!res.ok) throw new Error("Failed to get answer");
      const data = await res.json();
      setQaAnswer(data.answer || "No answer available.");
    } catch {
      setQaAnswer("Sorry, I couldn't answer that question.");
    }
    setQaLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="link" size="sm">
          View Report
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-4xl md:px-10 px-4 py-8 bg-white shadow-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle asChild>
            <h2 className="text-center text-2xl font-bold text-blue-700">
              🧠 AI Medical Voice Agent Report
            </h2>
          </DialogTitle>
          <DialogDescription asChild>
            {loading ? (
              <p className="text-center mt-10 text-gray-500">
                Loading report...
              </p>
            ) : !report ? (
              <div className="text-center mt-10 space-y-3">
                <p className="text-muted-foreground">
                  No report data available for this consultation.
                </p>
                <>
                  <p className="text-sm text-muted-foreground/70">
                    No conversation was recorded for this session. Please interact with the AI doctor during your consultation to generate a report.
                  </p>
                </>
              </div>
            ) : (
              <div className="max-h-[75vh] overflow-y-auto space-y-6 text-gray-800 text-sm px-2">
                                {/* AI-powered Q&A */}
                                <section className="border-b pb-3">
                                  <h3 className="text-lg font-semibold text-purple-700 mb-1">
                                    Ask About Your Report
                                  </h3>
                                  <div className="flex flex-col md:flex-row gap-2 items-start md:items-end">
                                    <input
                                      className="border rounded px-2 py-1 w-full md:w-2/3"
                                      type="text"
                                      placeholder="Ask a question about your report..."
                                      value={qaInput}
                                      onChange={e => setQaInput(e.target.value)}
                                      onKeyDown={e => { if (e.key === 'Enter') handleAskQuestion(); }}
                                      disabled={qaLoading}
                                    />
                                    <Button onClick={handleAskQuestion} disabled={qaLoading || !qaInput.trim()} size="sm">
                                      {qaLoading ? "Asking..." : "Ask"}
                                    </Button>
                                  </div>
                                  {qaAnswer && (
                                    <div className="mt-2 p-2 bg-gray-100 rounded text-gray-800">
                                      <b>AI Answer:</b> {qaAnswer}
                                    </div>
                                  )}
                                </section>
                {/* Session Info */}
                <section className="border-b pb-3">
                  <h3 className="text-lg font-semibold text-blue-600 mb-1">
                    Session Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <span className="font-bold">Doctor:</span>{" "}
                      {record.selectedDoctor.specialist}
                    </div>
                    <div>
                      <span className="font-bold">Patient:</span>{" "}
                      {report.user || "Anonymous"}
                    </div>
                    <div>
                      <span className="font-bold">Consulted On:</span>{" "}
                      {moment(new Date(record.createdOn)).format(
                        "MMMM Do YYYY, h:mm A"
                      )}
                    </div>
                    <div>
                      <span className="font-bold">Agent:</span> {report.agent}
                    </div>
                  </div>
                </section>

                {/* Chief Complaint */}
                <section>
                  <h3 className="text-blue-600 font-semibold">
                    Chief Complaint
                  </h3>
                  <p className="italic">{report.chiefComplaint || "Not specified"}</p>
                </section>

                {/* Summary */}
                <section>
                  <h3 className="text-blue-600 font-semibold">
                    Consultation Summary
                  </h3>
                  <p>{report.summary || "No summary available"}</p>
                </section>

                {/* Symptoms */}
                <section>
                  <h3 className="text-blue-600 font-semibold">Symptoms</h3>
                  <ul className="list-disc list-inside">
                    {report.symptoms?.length > 0 ? (
                      report.symptoms.map((symptom, i) => (
                        <li key={i}>{symptom}</li>
                      ))
                    ) : (
                      <li>None</li>
                    )}
                  </ul>
                </section>

                {/* Duration & Severity */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-blue-600 font-semibold">Duration</h3>
                    <p>{report.duration || "Not specified"}</p>
                  </div>
                  <div>
                    <h3 className="text-blue-600 font-semibold">Severity</h3>
                    <p>{report.severity || "Not assessed"}</p>
                  </div>
                </section>

                {/* Medications */}
                <section>
                  <h3 className="text-blue-600 font-semibold">
                    Medications Mentioned
                  </h3>
                  <ul className="list-disc list-inside">
                    {report.medicationsMentioned?.length > 0 ? (
                      report.medicationsMentioned.map((med, i) => (
                        <li key={i}>{med}</li>
                      ))
                    ) : (
                      <li>None</li>
                    )}
                  </ul>
                </section>

                {/* Recommendations */}
                <section>
                  <h3 className="text-blue-600 font-semibold">
                    Recommendations
                  </h3>
                  <ul className="list-disc list-inside">
                    {report.recommendations?.length > 0 ? (
                      report.recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))
                    ) : (
                      <li>None</li>
                    )}
                  </ul>
                </section>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

export default ViewReportDialog;
// "use client";
// import React, { useEffect, useState } from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { SessionDetail } from "../medical-agent/[sessionId]/page";
// import moment from "moment";
// import axios from "axios";

// type Props = {
//   record: SessionDetail;
// };

// type MedicalReport = {
//   sessionId: string;
//   agent: string;
//   user: string;
//   timestamp: string;
//   chiefComplaint: string;
//   summary: string;
//   symptoms: string[];
//   duration: string;
//   severity: string;
//   medicationsMentioned: string[];
//   recommendations: string[];
// };

// function ViewReportDialog({ record }: Props) {
//   const [open, setOpen] = useState(false);
//   const [report, setReport] = useState<MedicalReport | null>(
//     //@ts-ignore
//     record.report || null
//   );
//   const [loading, setLoading] = useState(false);

//   const fetchReport = async () => {
//     setLoading(true);
//     try {
//       const res = await axios.post("/api/medical-report", {
//         sessionId: record.sessionId,
//         sessionDetail: record,
//         //@ts-ignore
//         messages: record.conversation || [],
//       });

//       setReport(res.data);
//     } catch (err) {
//       console.error("Failed to fetch report", err);
//     }
//     setLoading(false);
//   };

//   useEffect(() => {
//     if (open && !report) {
//       fetchReport();
//     }
//   }, [open]);

//   return (
//     <Dialog open={open} onOpenChange={setOpen}>
//       <DialogTrigger asChild>
//         <Button variant="link" size="sm">
//           View Report
//         </Button>
//       </DialogTrigger>
//       <DialogContent className="w-full max-w-4xl md:px-10 px-4 py-8 bg-white shadow-2xl rounded-2xl">
//         <DialogHeader>
//           <DialogTitle asChild>
//             <h2 className="text-center text-2xl font-bold text-blue-700">
//               🧠 MedigenceAI Report
//             </h2>
//           </DialogTitle>
//           <DialogDescription asChild>
//             {loading ? (
//               <p className="text-center mt-10 text-gray-500">
//                 Loading report...
//               </p>
//             ) : !report ? (
//               <p className="text-center text-red-500 mt-10">
//                 No report available
//               </p>
//             ) : (
//               <div className="max-h-[75vh] overflow-y-auto space-y-6 text-gray-800 text-sm px-2">
//                 {/* Session Info */}
//                 <section className="border-b pb-3">
//                   <h3 className="text-lg font-semibold text-blue-600 mb-1">
//                     Session Information
//                   </h3>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
//                     <div>
//                       <span className="font-bold">Doctor:</span>{" "}
//                       {record.selectedDoctor.specialist}
//                     </div>
//                     <div>
//                       <span className="font-bold">Patient:</span>{" "}
//                       {report.user || "Anonymous"}
//                     </div>
//                     <div>
//                       <span className="font-bold">Consulted On:</span>{" "}
//                       {moment(new Date(record.createdOn)).format(
//                         "MMMM Do YYYY, h:mm A"
//                       )}
//                     </div>
//                     <div>
//                       <span className="font-bold">Agent:</span> {report.agent}
//                     </div>
//                   </div>
//                 </section>

//                 {/* Chief Complaint */}
//                 <section>
//                   <h3 className="text-blue-600 font-semibold">
//                     Chief Complaint
//                   </h3>
//                   <p className="italic">{report.chiefComplaint}</p>
//                 </section>

//                 {/* Summary */}
//                 <section>
//                   <h3 className="text-blue-600 font-semibold">
//                     Consultation Summary
//                   </h3>
//                   <p>{report.summary}</p>
//                 </section>

//                 {/* Symptoms */}
//                 <section>
//                   <h3 className="text-blue-600 font-semibold">Symptoms</h3>
//                   <ul className="list-disc list-inside">
//                     {report.symptoms.length > 0 ? (
//                       report.symptoms.map((symptom, i) => (
//                         <li key={i}>{symptom}</li>
//                       ))
//                     ) : (
//                       <li>None</li>
//                     )}
//                   </ul>
//                 </section>

//                 {/* Duration & Severity */}
//                 <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div>
//                     <h3 className="text-blue-600 font-semibold">Duration</h3>
//                     <p>{report.duration}</p>
//                   </div>
//                   <div>
//                     <h3 className="text-blue-600 font-semibold">Severity</h3>
//                     <p>{report.severity}</p>
//                   </div>
//                 </section>

//                 {/* Medications */}
//                 <section>
//                   <h3 className="text-blue-600 font-semibold">
//                     Medications Mentioned
//                   </h3>
//                   <ul className="list-disc list-inside">
//                     {report.medicationsMentioned.length > 0 ? (
//                       report.medicationsMentioned.map((med, i) => (
//                         <li key={i}>{med}</li>
//                       ))
//                     ) : (
//                       <li>None</li>
//                     )}
//                   </ul>
//                 </section>

//                 {/* Recommendations */}
//                 <section>
//                   <h3 className="text-blue-600 font-semibold">
//                     Recommendations
//                   </h3>
//                   <ul className="list-disc list-inside">
//                     {report.recommendations.length > 0 ? (
//                       report.recommendations.map((rec, i) => (
//                         <li key={i}>{rec}</li>
//                       ))
//                     ) : (
//                       <li>None</li>
//                     )}
//                   </ul>
//                 </section>
//               </div>
//             )}
//           </DialogDescription>
//         </DialogHeader>
//       </DialogContent>
//     </Dialog>
//   );
// }

// export default ViewReportDialog;
