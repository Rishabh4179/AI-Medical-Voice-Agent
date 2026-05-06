"use client";

import { useEffect } from "react";
import { useClerk } from "@clerk/nextjs";

export default function ProfileRedirect() {
  const { openUserProfile } = useClerk();
  
  useEffect(() => {
    // Open Clerk's user profile modal
    openUserProfile();
  }, [openUserProfile]);
  
  return null;
}