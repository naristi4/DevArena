import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database…");

  const hash = await bcrypt.hash("demo1234", 10);

  // ── Squads ────────────────────────────────────────────────────────────────
  const platform = await prisma.squad.upsert({
    where:  { name: "Platform Squad" },
    update: {},
    create: { name: "Platform Squad", description: "Core platform and infrastructure team" },
  });

  const growth = await prisma.squad.upsert({
    where:  { name: "Growth Squad" },
    update: {},
    create: { name: "Growth Squad", description: "Growth and user acquisition team" },
  });

  const core = await prisma.squad.upsert({
    where:  { name: "Core Squad" },
    update: {},
    create: { name: "Core Squad", description: "Core backend systems team" },
  });

  // ── Users ─────────────────────────────────────────────────────────────────
  const alice = await prisma.user.upsert({
    where:  { email: "alice@squadtracker.io" },
    update: {},
    create: {
      name:     "Alice Johnson",
      email:    "alice@squadtracker.io",
      password: hash,
      role:     "Admin",
      position: "Architect",
      squadId:  platform.id,
    },
  });

  await prisma.user.upsert({
    where:  { email: "bob@squadtracker.io" },
    update: {},
    create: {
      name:     "Bob Smith",
      email:    "bob@squadtracker.io",
      password: hash,
      role:     "SquadMember",
      position: "Developer",
      squadId:  platform.id,
    },
  });

  const carol = await prisma.user.upsert({
    where:  { email: "carol@squadtracker.io" },
    update: {},
    create: {
      name:     "Carol White",
      email:    "carol@squadtracker.io",
      password: hash,
      role:     "SquadMember",
      position: "PM",
      squadId:  growth.id,
    },
  });

  const dan = await prisma.user.upsert({
    where:  { email: "dan@squadtracker.io" },
    update: {},
    create: {
      name:     "Dan Torres",
      email:    "dan@squadtracker.io",
      password: hash,
      role:     "Admin",
      position: "Architect",
      squadId:  core.id,
    },
  });

  await prisma.user.upsert({
    where:  { email: "eva@squadtracker.io" },
    update: {},
    create: {
      name:     "Eva Chen",
      email:    "eva@squadtracker.io",
      password: hash,
      role:     "SquadMember",
      position: "Developer",
      squadId:  core.id,
    },
  });

  // ── Squad leads ───────────────────────────────────────────────────────────
  await prisma.squad.update({ where: { id: platform.id }, data: { leadId: alice.id } });
  await prisma.squad.update({ where: { id: growth.id  }, data: { leadId: carol.id } });
  await prisma.squad.update({ where: { id: core.id    }, data: { leadId: dan.id   } });

  console.log("✓ 3 squads seeded");
  console.log("✓ 5 users seeded (password: demo1234)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
