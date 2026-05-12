const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
const TEST_USER = 'test@example.com';

async function seedData() {
  console.log('🚀 Starting automated test seed...');
  
  try {
    const response = await axios.post(`${API_URL}/leads/seed-my-data`, {}, {
      headers: { 'x-user-email': TEST_USER }
    });
    
    console.log('✅ Success:', response.data.message);
    console.log(`📊 Created ${response.data.count} test leads for ${TEST_USER}`);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.response?.data?.error || error.message);
    console.log('Tip: Make sure the server is running and you haven\'t seeded this user already.');
  }
}

seedData();
