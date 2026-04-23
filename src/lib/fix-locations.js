const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const indianCities = [
  { city: 'Mumbai', state: 'Maharashtra' },
  { city: 'Delhi', state: 'Delhi' },
  { city: 'Bengaluru', state: 'Karnataka' },
  { city: 'Hyderabad', state: 'Telangana' },
  { city: 'Ahmedabad', state: 'Gujarat' },
  { city: 'Chennai', state: 'Tamil Nadu' },
  { city: 'Kolkata', state: 'West Bengal' },
  { city: 'Surat', state: 'Gujarat' },
  { city: 'Pune', state: 'Maharashtra' },
  { city: 'Jaipur', state: 'Rajasthan' },
  { city: 'Lucknow', state: 'Uttar Pradesh' },
  { city: 'Kanpur', state: 'Uttar Pradesh' },
  { city: 'Nagpur', state: 'Maharashtra' },
  { city: 'Indore', state: 'Madhya Pradesh' },
  { city: 'Thane', state: 'Maharashtra' },
  { city: 'Bhopal', state: 'Madhya Pradesh' },
  { city: 'Visakhapatnam', state: 'Andhra Pradesh' },
  { city: 'Pimpri-Chinchwad', state: 'Maharashtra' },
  { city: 'Patna', state: 'Bihar' },
  { city: 'Vadodara', state: 'Gujarat' }
];

async function fixLocations() {
  try {
    const profiles = await prisma.profile.findMany();
    console.log(`Found ${profiles.length} profiles to check.`);

    for (const profile of profiles) {
      if (!profile.city || profile.city === 'Unknown') {
        const randomLoc = indianCities[Math.floor(Math.random() * indianCities.length)];
        await prisma.profile.update({
          where: { id: profile.id },
          data: {
            city: randomLoc.city,
            state: randomLoc.state
          }
        });
        console.log(`Updated profile ${profile.id} to ${randomLoc.city}, ${randomLoc.state}`);
      }
    }
    console.log("Location fix complete!");
  } catch (err) {
    console.error("Error fixing locations:", err);
  } finally {
    await prisma.$disconnect();
  }
}

fixLocations();
