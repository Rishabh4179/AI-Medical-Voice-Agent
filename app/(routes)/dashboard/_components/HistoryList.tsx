"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import AddNewSessionDialog from "./AddNewSessionDialog";
import axios from "axios";
import HistoryTable from "./HistoryTable";
import { SessionDetail } from "../medical-agent/[sessionId]/page";

function HistoryList() {
  const [historyList, setHistoryList] = useState<SessionDetail[]>([]);

  useEffect(() => {
    GetHistoryList(); 
  }, []);

  const GetHistoryList = async () => {
    try {
      const result = await axios.get("/api/session-chat?sessionId=all");
      setHistoryList(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error("Failed to fetch history list:", error);
      setHistoryList([]);
    }
  };

  return (
    <div className="mt-10">
      {historyList.length == 0 ? (
        <div className="flex items-center flex-col justify-center p-7 border-2 border-dashed rounded-2xl">
          {" "}
          <Image
            className="w-auto h-auto"
            src={'/medical-assistance-1.png'}
            alt='empty'
            width={150}
            height={150}
            priority
          />
          <h2 className="font-bold text-xl mt-2">No Recent Consultations</h2>
          <p>It looks like you haven't consulted with any doctors yet</p>
          <AddNewSessionDialog />
        </div>
      ) : (
        <div>
          <HistoryTable historyList={historyList} onDelete={GetHistoryList} />
        </div>
      )}
    </div>
  );
}

export default HistoryList;