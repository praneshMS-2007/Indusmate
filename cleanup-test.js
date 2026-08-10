const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function main() {
  try {
    // Find the user
    const user = await p.user.findUnique({ where: { email: "qa@test.com" }, include: { org: true } });
    if (user && user.org) {
      // Delete KYC docs, then org, then user
      await p.kycDocument.deleteMany({ where: { orgId: user.org.id } });
      await p.organisation.delete({ where: { id: user.org.id } });
    }
    if (user) {
      await p.user.delete({ where: { id: user.id } });
      console.log("Cleaned up user:", user.email);
    } else {
      console.log("User not found, nothing to clean");
    }
  } catch (e) {
    console.log("Error:", e.message);
  }
  await p.$disconnect();
}
main();
