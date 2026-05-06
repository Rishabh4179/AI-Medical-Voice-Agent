"use client";
import { AIDoctorAgents } from "@/shared/list";
import React from "react";
import DoctorAgentCard, { doctorAgent } from "./DoctorAgentCard";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";

function DoctorsAgentList() {
  const router = useRouter();

  const handleStartConsultation = async (doctor: doctorAgent) => {
    try {
      const result = await axios.post("/api/session-chat", {
        notes: "",
        selectedDoctor: doctor,
      });
      if (result.data?.sessionId) {
        router.push("/dashboard/medical-agent/" + result.data.sessionId);
      }
    } catch (error) {
      toast.error("Failed to start consultation. Please try again.");
    }
  };

  return (
    <div className="mt-10">
      <h2 className="font-bold text-xl"> AI Specialist Doctors</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 mt-5">
        {AIDoctorAgents.map((doctor, index) => (
          <div key={index}>
            <DoctorAgentCard doctorAgent={doctor} onStartConsultation={handleStartConsultation} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default DoctorsAgentList;