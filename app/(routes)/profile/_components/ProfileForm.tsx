"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type UserProfile = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  phoneNumber?: string;
};

export default function ProfileForm() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        // Replace with your actual API call
        // const res = await fetch('/api/profile');
        // const data = await res.json();
        
        // Mock data for now
        const mockData: UserProfile = {
          id: "user-123",
          name: "John Doe",
          email: "john.doe@example.com",
          avatarUrl: "",
          phoneNumber: "+1 (555) 123-4567",
        };
        
        setProfile(mockData);
      } catch (error) {
        console.error("Failed to fetch profile", error);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Handle avatar file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Upload avatar if changed
      let avatarUrl = profile?.avatarUrl || "";
      if (avatarFile) {
        // Replace with your actual avatar upload logic
        // const formData = new FormData();
        // formData.append('avatar', avatarFile);
        // const uploadRes = await fetch('/api/upload-avatar', {
        //   method: 'POST',
        //   body: formData
        // });
        // const uploadData = await uploadRes.json();
        // avatarUrl = uploadData.url;
        
        // Mock successful upload
        avatarUrl = avatarPreview || "";
      }

      // Update profile
      // Replace with your actual profile update logic
      // const updateRes = await fetch('/api/profile', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     ...profile,
      //     avatarUrl
      //   })
      // });
      // const updatedProfile = await updateRes.json();
      
      // Mock successful update
      const updatedProfile = {
        ...profile,
        avatarUrl
      };
      
      setProfile(updatedProfile as UserProfile);
      toast.success("Profile updated successfully");
      
      // Redirect to dashboard after successful update
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500); // Short delay to show the success message
    } catch (error) {
      console.error("Failed to update profile", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading profile...</div>;
  }

  if (!profile) {
    return <div className="text-center py-10 text-red-500">Failed to load profile</div>;
  }

  return (
    <Card className="w-full">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Update your personal details and profile picture
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-6">
            <Avatar className="h-24 w-24">
              <AvatarImage 
                src={avatarPreview || profile.avatarUrl || undefined} 
                alt={profile.name} 
              />
              <AvatarFallback className="text-2xl">
                {profile.name.split(" ").map(n => n[0]).join("").toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-2">
              <Label htmlFor="avatar" className="text-sm font-medium">
                Profile Picture
              </Label>
              <Input
                id="avatar"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="w-full max-w-xs"
              />
              <p className="text-xs text-muted-foreground">
                Recommended: Square image, at least 300x300px
              </p>
            </div>
          </div>

          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              required
            />
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              required
            />
          </div>

          {/* Phone Number Field */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number (Optional)</Label>
            <Input
              id="phone"
              type="tel"
              value={profile.phoneNumber || ""}
              onChange={(e) =>
                setProfile({ ...profile, phoneNumber: e.target.value })
              }
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}