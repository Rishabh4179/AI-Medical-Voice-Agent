
"use client";

import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { doctorAgent } from "../../_components/DoctorAgentCard";
import { Circle, Loader, PhoneCall, PhoneOff } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Vapi from "@vapi-ai/web";
import { toast } from "sonner";

interface VapiWithListeners extends Vapi {
  _callStartListener?: () => void;
  _callEndListener?: () => void;
  _messageListener?: (message: any) => void;
  off: <K>(eventName: string | symbol, listener: (...args: any[]) => void) => this;
}

export type SessionDetail = {
  id: number;
  notes: string;
  sessionId: string;
  report: JSON;
  selectedDoctor: doctorAgent;
  createdOn: string;
};

type messages = {
  role: string;
  text: string;
};

function MedicalVoiceAgent() {
  const { sessionId } = useParams();
  const [sessionDetail, setSessionDetail] = useState<SessionDetail>();
  const [callStarted, setCallStarted] = useState(false);
  const [vapiInstance, setVapiInstance] = useState<VapiWithListeners | null>(null);
  const vapiRef = useRef<VapiWithListeners | null>(null);
  const [currentRole, setCurrentRole] = useState<string | null>();
  const [liveTranscript, setLiveTranscript] = useState<string>();
  const [messages, setMessages] = useState<messages[]>([]);
  const messagesRef = useRef<messages[]>([]);
  const [loading, setLoading] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const router = useRouter();

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (sessionId) GetSessionDetails();
    // cleanup on unmount
    return () => {
      if (vapiRef.current) {
        try {
          vapiRef.current.stop();
        } catch (e) {
          /* ignore */
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const GetSessionDetails = async () => {
    try {
      const result = await axios.get("/api/session-chat?sessionId=" + sessionId);
      setSessionDetail(result.data);
    } catch (error) {
      console.error("Failed to fetch session details:", error);
      toast.error("Error: Could not load session data from the server.");
    }
  };

  const handleVapiError = (err: any) => {
    const errStr = typeof err === "object" ? JSON.stringify(err) : String(err);
    console.error("VAPI error event:", errStr, err);
    setLoading(false);
    setCallStarted(false);

    const message = String(err?.message || errStr || "");
    if (message.includes("401") || message.toLowerCase().includes("unauthorized")) {
      toast.error("VAPI key unauthorized (401). Check key/permissions or regenerate the key.");
    } else if (message.includes("403") || message.includes("Forbidden")) {
      toast.error("VAPI access forbidden (403). Check your API key permissions and assistant configuration.");
    } else if (message.includes("429") || message.toLowerCase().includes("rate limit")) {
      toast.error("VAPI rate limit reached (429). Reduce usage or upgrade plan.");
    } else if (message.toLowerCase().includes("meeting") && message.toLowerCase().includes("ended")) {
      toast.error("Voice session could not be started. Please check your Vapi account credits/plan and try again.");
    } else {
      toast.error("Failed to connect to AI doctor. Please check your Vapi API key and account, then try again.");
    }
  };

  const attemptReconnect = async () => {
    // Don't try forever
    if (reconnectAttempts >= 3) {
      toast.error("Unable to reconnect after multiple attempts.");
      return;
    }
    const waitMs = 1000 * Math.pow(2, reconnectAttempts); // exponential backoff
    setReconnectAttempts((s) => s + 1);
    setTimeout(() => {
      if (!callStarted && !loading) {
        StartCall();
      }
    }, waitMs);
  };

  const StartCall = async () => {
    if (!process.env.NEXT_PUBLIC_VAPI_API_KEY) {
      toast.error("VAPI key not configured. Set NEXT_PUBLIC_VAPI_API_KEY.");
      return;
    }

    setLoading(true);

    try {
      const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_API_KEY!) as VapiWithListeners;
      setVapiInstance(vapi);
      vapiRef.current = vapi;

      // handlers
      const handleCallStart = () => {
        console.log("Call started");
        setCallStarted(true);
        setLoading(false);
        setReconnectAttempts(0);
      };
      const handleCallEnd = () => {
        console.log("Call ended");
        setCallStarted(false);
        setLoading(false);
      };
      const handleMessage = (message: any) => {
        // Handle status updates
        if (message.type === "status-update") {
          const { status, endedReason } = message;
          console.log("Status update:", status, endedReason);
          
          if (status === "ended") {
            setCallStarted(false);
            setLoading(false);
            
            // Handle specific error reasons
            if (endedReason?.includes("providerfault")) {
              if (endedReason.includes("anthropic") || endedReason.includes("claude")) {
                toast.error("Claude AI provider error. The AI service encountered an issue. Please try again.");
              } else {
                toast.error("AI provider error occurred. Please try again.");
              }
            } else if (endedReason?.includes("error")) {
              toast.error("Call ended due to an error. Please try again.");
            }
          }
          return;
        }
        
        // Handle transcript messages
        if (message.type === "transcript") {
          const { role, transcriptType, transcript } = message;
          console.log(`${role}: ${transcript}`);
          if (transcriptType === "partial") {
            setLiveTranscript(transcript);
            setCurrentRole(role);
          } else if (transcriptType === "final") {
            setMessages((prev: messages[]) => {
              const nextMessages = [...prev, { role: role, text: transcript }];
              messagesRef.current = nextMessages;
              return nextMessages;
            });
            setLiveTranscript("");
            setCurrentRole(null);
          }
        }
      };

      // generic error event
      (vapi as any).on?.("error", handleVapiError);
      (vapi as any).on?.("call-start", handleCallStart);
      (vapi as any).on?.("call-end", handleCallEnd);
      (vapi as any).on?.("message", handleMessage);
      (vapi as any).on?.("speech-start", () => setCurrentRole("assistant"));
      (vapi as any).on?.("speech-end", () => setCurrentRole("user"));

      vapi._callStartListener = handleCallStart;
      vapi._callEndListener = handleCallEnd;
      vapi._messageListener = handleMessage;

      const selected = sessionDetail?.selectedDoctor;
      const assistantId = selected?.assistantId;

      if (!assistantId) {
        toast.error("No assistant configured for this doctor. Please try another specialist.");
        setLoading(false);
        return;
      }

      try {
        await vapi.start(assistantId);
        // If start resolves, call-start will be fired and setCallStarted(true)
      } catch (startErr: any) {
        console.error("vapi.start failed:", startErr);
        handleVapiError(startErr);
        // try reconnect with backoff if rate limit or transient
        attemptReconnect();
      }
    } catch (err) {
      console.error("Failed to initialize VAPI:", err);
      handleVapiError(err);
    }
  };

  const endCall = async () => {
    setLoading(true);
    try {
      // Stop the call first so no more messages come in
      if (vapiRef.current) {
        try {
          await vapiRef.current.stop();
        } catch (e) {
          console.warn("Error stopping vapi instance:", e);
        }

        const vapi = vapiRef.current;
        if (vapi._callStartListener && vapi.off) vapi.off("call-start", vapi._callStartListener);
        if (vapi._callEndListener && vapi.off) vapi.off("call-end", vapi._callEndListener);
        if (vapi._messageListener && vapi.off) vapi.off("message", vapi._messageListener);

        setCallStarted(false);
        setVapiInstance(null);
        vapiRef.current = null;
      }

      // Small delay to ensure final transcript messages are processed
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Now generate the report with complete messages
      const reportResult = await GenerateReport();

      if (reportResult) {
        toast.success("Your report is generated!");
      } else {
        toast.warning("Call ended. Report could not be generated - you can retry from History.");
      }

      router.replace("/dashboard");
    } catch (error) {
      console.error("Failed to end call or generate report:", error);
      toast.error("Error ending call. Report may not have been generated - check History.");
      router.replace("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const GenerateReport = async () => {
    const currentMessages = messagesRef.current;
    if (!currentMessages || currentMessages.length === 0) {
      console.warn("No messages to generate report from");
      toast.error("No conversation recorded. Report cannot be generated.");
      return null;
    }
    try {
      const result = await axios.post("/api/medical-report", {
        messages: currentMessages,
        sessionDetail: sessionDetail,
        sessionId: sessionId,
      });
      return result.data;
    } catch (err) {
      console.error("Failed to generate report:", err);
      toast.error("Failed to generate report. You can retry from History.");
      return null;
    }
  };

  return (
    <div className="p-5 border rounded-3xl bg-secondary">
      <div className="flex justify-between items-center">
        <h2 className="p-1 px-2 border rounded-md flex gap-2 items-center">
          <Circle
            className={`h-4 w-4 rounded-full ${callStarted ? "bg-green-500" : "bg-red-500"}`}
          />
          {callStarted ? "Connected..." : "Not Connected"}
        </h2>
        <h2 className="font-bold text-xl text-gray-400"> 00: 00</h2>
      </div>

      {sessionDetail && (
        <div className="flex items-center flex-col mt-10">
          <Image
            src={sessionDetail?.selectedDoctor?.image}
            alt={sessionDetail?.selectedDoctor?.specialist}
            width={120}
            height={120}
            className="h-[100px] w-[100px] object-cover rounded-full"
            priority
          />
          <h2 className="mt-2 text-lg">{sessionDetail?.selectedDoctor?.specialist}</h2>
          <p className="text-sm text-gray-400"> AI Medical Voice Agent</p>

          <div className="mt-12 overflow-y-auto flex flex-col items-center px-10 md:px-28 lg:px-52 xl:px-72">
            {messages?.slice(-4).map((msg: messages, index) => (
              <h2 className="text-gray-400 p-2" key={index}>
                {msg.role} : {msg.text}{" "}
              </h2>
            ))}
            {liveTranscript && liveTranscript?.length > 0 && (
              <h2 className="text-lg">
                {currentRole} : {liveTranscript}
              </h2>
            )}
          </div>

          {!callStarted ? (
            <Button className="mt-20" onClick={StartCall} disabled={loading}>
              {loading ? <Loader className="animate-spin" /> : <PhoneCall />} Start Call
            </Button>
          ) : (
            <Button variant={"destructive"} onClick={endCall} disabled={loading}>
              {loading ? <Loader className="animate-spin" /> : <PhoneOff />}
              Disconnect
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default MedicalVoiceAgent;
