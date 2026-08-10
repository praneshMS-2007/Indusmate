const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = "admin@indusmate.com";
  
  // Check if admin exists
  let user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    console.log("Admin user already exists.");
    return;
  }

  // Create admin organisation
  const org = await prisma.organisation.create({
    data: {
      name: "IndusMate Security",
      type: "PLATFORM_ADMIN",
      city: "New Delhi",
      lat: 28.6139,
      lng: 77.2090,
      legalName: "IndusMate Platform Pvt Ltd",
      contactName: "Admin User",
      contactPhone: "+91 9999999999",
      contactEmail: email,
      gstin: "00PLATFORMADMIN0",
      pseudonymHandle: "System Admin",
      verified: true,
      kycStatus: "APPROVED",
      rating: 5.0,
    }
  });

  const password = await bcrypt.hash("admin123", 12);

  await prisma.user.create({
    data: {
      email,
      name: "System Admin",
      password,
      orgId: org.id
    }
  });

  console.log("Admin account created successfully!");
  console.log("Email: admin@indusmate.com");
  console.log("Password: admin123");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
