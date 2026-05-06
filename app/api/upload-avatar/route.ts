import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("avatar") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Here you would typically:
    // 1. Upload the file to a storage service (AWS S3, Cloudinary, etc.)
    // 2. Get the URL of the uploaded file
    // 3. Return the URL
    
    // This is just a placeholder - implement your actual file upload logic
    const mockUrl = `/uploads/avatars/${Date.now()}-${file.name}`;

    return NextResponse.json({ url: mockUrl });
  } catch (error) {
    console.error("Error uploading avatar:", error);
    return NextResponse.json(
      { error: "Failed to upload avatar" },
      { status: 500 }
    );
  }
}