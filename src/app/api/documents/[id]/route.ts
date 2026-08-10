import { prisma } from "@/lib/prisma";
import { getCurrentOrg } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getCurrentOrg();
    if (admin.type !== "PLATFORM_ADMIN") {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const { id } = await params;

    const doc = await prisma.kycDocument.findUnique({
      where: { id }
    });

    if (!doc) {
      return new NextResponse("Document not found", { status: 404 });
    }

    // Convert Base64 back to binary buffer
    const buffer = Buffer.from(doc.fileData, "base64");

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": doc.mimeType,
        "Content-Disposition": `inline; filename="${doc.fileName}"`
      }
    });
  } catch (error) {
    console.error("Error serving document:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
