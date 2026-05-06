import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get the current user's profile from your database
    // This is just a placeholder - implement your actual database logic
    const profile = {
      id: "user-123",
      name: "John Doe",
      email: "john.doe@example.com",
      avatarUrl: "",
      phoneNumber: "+1 (555) 123-4567",
    };

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    
    // Update the user's profile in your database
    // This is just a placeholder - implement your actual database logic
    const updatedProfile = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}