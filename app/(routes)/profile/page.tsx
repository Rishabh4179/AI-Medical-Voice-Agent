import { UserProfile } from "@clerk/nextjs";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile | MedigenceAI",
  description: "Manage your MedigenceAI profile settings",
};

export default function ProfilePage() {
  return (
    <div className="flex justify-center">
      <UserProfile
        routing="hash"
        appearance={{
          elements: {
            rootBox: "w-full max-w-4xl",
            cardBox: "w-full shadow-none",
          },
        }}
      />
    </div>
  );
}