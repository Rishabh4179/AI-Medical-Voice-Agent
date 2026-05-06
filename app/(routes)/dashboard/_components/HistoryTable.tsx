"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SessionDetail } from "../medical-agent/[sessionId]/page";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import moment from "moment";
import ViewReportDialog from "./ViewReportDialog";
import axios from "axios";
import { toast } from "sonner";
import { IconTrash, IconAlertTriangle } from "@tabler/icons-react";

type Props = {
  historyList: SessionDetail[];
  onDelete?: () => void;
};

function HistoryTable({ historyList, onDelete }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const openConfirm = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedSessionId) return;
    setDeletingId(selectedSessionId);
    setConfirmOpen(false);
    try {
      await axios.delete(`/api/session-chat?sessionId=${encodeURIComponent(selectedSessionId)}`);
      toast.success("Consultation deleted");
      onDelete?.();
    } catch {
      toast.error("Failed to delete consultation");
    } finally {
      setDeletingId(null);
      setSelectedSessionId(null);
    }
  };

  return (
  <>
    <Table>
      <TableCaption>Previous Consultation Reports</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>AI Medical Specialist</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {historyList.map((record: SessionDetail) => (
          <TableRow key={record?.sessionId}>
            <TableCell className="font-medium">
              {record?.selectedDoctor?.specialist}
            </TableCell>
            <TableCell>{record?.notes}</TableCell>
            <TableCell>
              {moment(new Date(record?.createdOn)).fromNow()}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-2">
                <ViewReportDialog record={record} />
                <Button
                  variant="outline"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10"
                  disabled={deletingId === record?.sessionId}
                  onClick={() => openConfirm(record?.sessionId)}
                >
                  <IconTrash className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>

    <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <IconAlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <DialogTitle>Delete Consultation</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Are you sure you want to delete this consultation? This will permanently remove the session data and medical report. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  );
}

export default HistoryTable;