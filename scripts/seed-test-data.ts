import { db } from "../server/db";
import { users, teams, fineCategories, fineSubcategories, fines } from "../shared/schema";
import { eq, and } from "drizzle-orm";

const testPlayers = [
  { firstName: "Joe", lastName: "Popple", position: "Forward", nickname: "JP" },
  { firstName: "Rhys", lastName: "May", position: "Midfielder", nickname: "Mayhem" },
  { firstName: "Alex", lastName: "Porter", position: "Defender", nickname: "Port" },
  { firstName: "Krystian", lastName: "Davies", position: "Goalkeeper", nickname: "Kris" },
  { firstName: "Liam", lastName: "Malkin", position: "Forward", nickname: "Malks" },
  { firstName: "Aston", lastName: "Warhurst", position: "Midfielder", nickname: "Ash" },
  { firstName: "Morgan", lastName: "Edwards", position: "Defender", nickname: "Morgs" },
  { firstName: "Keiron", lastName: "Lewis", position: "Winger", nickname: "Kez" },
];

const fineCategories_data = [
  {
    name: "Training",
    description: "Training-related infractions",
    subcategories: [
      { name: "Late to Training", defaultAmount: "5.00", description: "Arriving late to scheduled training sessions" },
      { name: "Missing Training", defaultAmount: "15.00", description: "Failing to attend training without notice" },
      { name: "Forgot Kit", defaultAmount: "3.00", description: "Not bringing proper training equipment" },
      { name: "Wrong Kit", defaultAmount: "2.00", description: "Wearing incorrect or inappropriate training gear" },
    ]
  },
  {
    name: "Match Day",
    description: "Match day violations",
    subcategories: [
      { name: "Late to Match", defaultAmount: "10.00", description: "Arriving late on match day" },
      { name: "Yellow Card", defaultAmount: "5.00", description: "Receiving a yellow card during the match" },
      { name: "Red Card", defaultAmount: "20.00", description: "Receiving a red card during the match" },
      { name: "Forgot Boots", defaultAmount: "8.00", description: "Not bringing football boots to the match" },
      { name: "Missing Match", defaultAmount: "25.00", description: "Failing to show up for a scheduled match" },
    ]
  },
  {
    name: "Social",
    description: "Social and team event violations",
    subcategories: [
      { name: "Social No-Show", defaultAmount: "10.00", description: "Not attending team social events" },
      { name: "Early Departure", defaultAmount: "5.00", description: "Leaving team events early without permission" },
      { name: "Inappropriate Behavior", defaultAmount: "15.00", description: "Misconduct during team social events" },
    ]
  },
  {
    name: "General",
    description: "General team violations",
    subcategories: [
      { name: "Phone in Changing Room", defaultAmount: "5.00", description: "Using mobile phone in the changing room" },
      { name: "Late Payment", defaultAmount: "2.00", description: "Late payment of team fees or fines" },
      { name: "Damage to Equipment", defaultAmount: "Cost + £5", description: "Damaging team or club equipment" },
      { name: "Unsporting Conduct", defaultAmount: "10.00", description: "Behavior detrimental to team spirit" },
    ]
  }
];

export async function seedTestData() {
  try {
    console.log("🌱 Starting to seed test data...");

    // Get the current admin user (assuming they're already logged in)
    const adminUser = await db.select().from(users).limit(1);
    if (!adminUser.length) {
      console.log("❌ No admin user found. Please log in first.");
      return;
    }

    const admin = adminUser[0];
    console.log(`📝 Using admin user: ${admin.firstName} ${admin.lastName}`);

    // Get or create team  
    let team;
    const existingTeam = await db.select().from(teams).limit(1);
    
    if (existingTeam.length > 0) {
      team = existingTeam[0];
      console.log(`🏆 Using existing team: ${team.name}`);
    } else {
      const [newTeam] = await db.insert(teams).values({
        name: "Test FC",
        inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        sport: "Football",
      }).returning();
      team = newTeam;
      console.log(`🏆 Created new team: ${team.name}`);
    }

    // Create test players
    console.log("👥 Creating test players...");
    const createdPlayers = [];
    
    for (const player of testPlayers) {
      try {
        // Check if player already exists
        const existingPlayer = await db.select().from(users).where(
          and(
            eq(users.firstName, player.firstName),
            eq(users.lastName, player.lastName)
          )
        ).limit(1);

        if (existingPlayer.length > 0) {
          console.log(`   ⚠️  Player ${player.firstName} ${player.lastName} already exists`);
          createdPlayers.push(existingPlayer[0]);
          continue;
        }

        const [newPlayer] = await db.insert(users).values({
          id: `test_${player.firstName.toLowerCase()}_${player.lastName.toLowerCase()}`,
          email: `${player.firstName.toLowerCase()}.${player.lastName.toLowerCase()}@testfc.com`,
          firstName: player.firstName,
          lastName: player.lastName,
          position: player.position,
          nickname: player.nickname,
          teamId: team.id,
          role: "player",
        }).returning();
        
        createdPlayers.push(newPlayer);
        console.log(`   ✅ Created ${player.firstName} ${player.lastName} (${player.position})`);
      } catch (error) {
        console.log(`   ❌ Failed to create ${player.firstName} ${player.lastName}:`, error);
      }
    }

    // Create fine categories and subcategories
    console.log("📋 Creating fine categories...");
    const createdCategories = [];
    
    for (const categoryData of fineCategories_data) {
      try {
        // Check if category exists
        const existingCategory = await db.select().from(fineCategories).where(
          and(
            eq(fineCategories.name, categoryData.name),
            eq(fineCategories.teamId, team.id)
          )
        ).limit(1);

        let category;
        if (existingCategory.length > 0) {
          category = existingCategory[0];
          console.log(`   ⚠️  Category '${categoryData.name}' already exists`);
        } else {
          const [newCategory] = await db.insert(fineCategories).values({
            name: categoryData.name,
            description: categoryData.description,
            teamId: team.id,
          }).returning();
          category = newCategory;
          console.log(`   ✅ Created category: ${categoryData.name}`);
        }
        
        createdCategories.push(category);

        // Create subcategories
        for (const subData of categoryData.subcategories) {
          try {
            const existingSub = await db.select().from(fineSubcategories).where(
              and(
                eq(fineSubcategories.name, subData.name),
                eq(fineSubcategories.categoryId, category.id)
              )
            ).limit(1);

            if (existingSub.length > 0) {
              console.log(`     ⚠️  Subcategory '${subData.name}' already exists`);
              continue;
            }

            await db.insert(fineSubcategories).values({
              name: subData.name,
              description: subData.description,
              defaultAmount: subData.defaultAmount,
              categoryId: category.id,
            });
            console.log(`     ✅ Created subcategory: ${subData.name} (£${subData.defaultAmount})`);
          } catch (error) {
            console.log(`     ❌ Failed to create subcategory ${subData.name}:`, error);
          }
        }
      } catch (error) {
        console.log(`   ❌ Failed to create category ${categoryData.name}:`, error);
      }
    }

    // Create some sample fines
    console.log("💰 Creating sample fines...");
    
    // Get subcategories for sample fines
    const allSubcategories = await db.select().from(fineSubcategories);
    const sampleFines = [
      { player: "Joe", subcategory: "Late to Training", paid: false },
      { player: "Rhys", subcategory: "Yellow Card", paid: true },
      { player: "Alex", subcategory: "Forgot Kit", paid: false },
      { player: "Krystian", subcategory: "Social No-Show", paid: true },
      { player: "Liam", subcategory: "Late to Match", paid: false },
      { player: "Morgan", subcategory: "Phone in Changing Room", paid: false },
    ];

    for (const sampleFine of sampleFines) {
      try {
        const player = createdPlayers.find(p => p.firstName === sampleFine.player);
        const subcategory = allSubcategories.find(s => s.name === sampleFine.subcategory);
        
        if (!player || !subcategory) {
          console.log(`   ⚠️  Skipping fine: player or subcategory not found`);
          continue;
        }

        await db.insert(fines).values({
          playerId: player.id,
          subcategoryId: subcategory.id,
          amount: subcategory.defaultAmount.replace(/[^\d.]/g, ''), // Remove non-numeric chars
          description: `Sample fine for ${sampleFine.subcategory}`,
          status: sampleFine.paid ? "paid" : "unpaid",
          issuedBy: admin.id,
        });
        
        console.log(`   ✅ Created fine: ${player.firstName} - ${sampleFine.subcategory} (${sampleFine.paid ? 'Paid' : 'Unpaid'})`);
      } catch (error) {
        console.log(`   ❌ Failed to create sample fine:`, error);
      }
    }

    console.log("🎉 Test data seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   👥 Players: ${createdPlayers.length}`);
    console.log(`   📋 Categories: ${createdCategories.length}`);
    console.log(`   💰 Sample fines: ${sampleFines.length}`);
    console.log(`   🏆 Team: ${team.name}`);

  } catch (error) {
    console.error("❌ Error seeding test data:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedTestData()
    .then(() => {
      console.log("✅ Seeding completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Seeding failed:", error);
      process.exit(1);
    });
}