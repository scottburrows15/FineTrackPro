// Simple script to add test players via API
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

const BASE_URL = 'http://localhost:5000';

async function addTestPlayers() {
  console.log('🌱 Adding test players...');
  
  for (const player of testPlayers) {
    try {
      const response = await fetch(`${BASE_URL}/api/admin/players`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: player.firstName,
          lastName: player.lastName,
          position: player.position,
          nickname: player.nickname,
          email: `${player.firstName.toLowerCase()}.${player.lastName.toLowerCase()}@testfc.com`,
        }),
      });
      
      if (response.ok) {
        console.log(`✅ Added ${player.firstName} ${player.lastName}`);
      } else {
        console.log(`❌ Failed to add ${player.firstName} ${player.lastName}: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Error adding ${player.firstName} ${player.lastName}:`, error.message);
    }
  }
  
  console.log('🎉 Test players added!');
}

addTestPlayers();