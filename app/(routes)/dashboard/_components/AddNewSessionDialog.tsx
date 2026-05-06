"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DialogClose } from "@radix-ui/react-dialog";
import { ArrowRight, Loader2 } from "lucide-react";
import axios from "axios";
import DoctorAgentCard, { doctorAgent } from "./DoctorAgentCard";
import SuggestedDoctorCard from "./SuggestedDoctorCard";
import { useRouter } from "next/navigation";
import { toast } from "sonner"; // NEW

function AddNewSessionDialog() {
  const [note, setNote] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [suggestedDoctor, setSuggestedDoctor] = useState<doctorAgent[]>();
  const [selectedDoctor, setSelectedDoctor] = useState<doctorAgent>();
  const router = useRouter();

  const resetState = () => {
    setNote(undefined);
    setSuggestedDoctor(undefined);
    setSelectedDoctor(undefined);
  };

  const onClickNext = async () => {
    setLoading(true);
    try {
      const result = await axios.post("/api/suggest-doctors", {
        notes: note ?? "",
      });
      setSuggestedDoctor(result.data);
    } catch (error) {
      console.error("Suggest doctors error:", error);
      toast.error("Failed to suggest doctors. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onStartConsultation = async () => {
    setLoading(true);
    try {
      const result = await axios.post("/api/session-chat", {
        notes: note ?? "",
        selectedDoctor: selectedDoctor,
      });
      if (result.data?.sessionId) {
        router.push("/dashboard/medical-agent/" + result.data.sessionId);
      }
    } catch (error) {
      console.error("Start consultation error:", error);
      toast.error("Failed to start consultation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog onOpenChange={(open) => { if (!open) resetState(); }}>
      <DialogTrigger asChild>
        <Button className="mt-3">+ Start a Consultation</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Basic Details</DialogTitle>
          <DialogDescription asChild>
            {!suggestedDoctor ? (
              <div>
                <h2> Add symptoms or Any Other Details</h2>
                <Textarea
                  placeholder="Add Details here..."
                  className="h-[200px] mt-1"
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            ) : (
              <div>
                <h2> Select the doctor</h2>
                <div className="grid grid-cols-3 gap-5">
                  {/* //Suggested Doctors */}
                  {suggestedDoctor.map((doctor, index) => (
                    <SuggestedDoctorCard
                      doctorAgent={doctor}
                      key={index}
                      setSelectedDoctor={() => setSelectedDoctor(doctor)}
                      //@ts-ignore
                      selectedDoctor={selectedDoctor}
                    />
                  ))}
                </div>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant={"outline"}>Cancel</Button>
          </DialogClose>
          {!suggestedDoctor ? (
            <Button disabled={!note || loading} onClick={() => onClickNext()}>
              Next
              {loading ? <Loader2 className="animate-spin" /> : <ArrowRight />}
            </Button>
          ) : (
            <Button
              disabled={loading || !selectedDoctor}
              onClick={() => onStartConsultation()}
            >
              Start Consultation
              {loading ? <Loader2 className="animate-spin" /> : <ArrowRight />}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddNewSessionDialog;