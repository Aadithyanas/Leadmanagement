const fs = require('fs');
const path = require('path');

const inputFile = 'dataset_crawler-google-places_2026-05-28_09-47-37-725 (1).json';
const outputDir = path.join(__dirname, 'data');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

const categories = {
  hospital_clinic: ['hospital', 'clinic', 'medical', 'doctor', 'dental', 'health'],
  school: ['school', 'college', 'university', 'education', 'academy', 'institute'],
  gym: ['gym', 'fitness', 'health club', 'yoga'],
  interior_realestate: ['interior', 'architect', 'real estate', 'builder', 'construction']
};

const results = {
  hospital_clinic: [],
  school: [],
  gym: [],
  interior_realestate: [],
  other: []
};

function determineCategory(itemCategories) {
  if (!itemCategories) return 'other';
  const cats = itemCategories.join(' ').toLowerCase();
  
  for (const [key, keywords] of Object.entries(categories)) {
    if (keywords.some(kw => cats.includes(kw))) {
      return key;
    }
  }
  return 'other';
}

data.forEach(item => {
  const category = determineCategory(item.categories);
  
  const name = item.title || 'N/A';
  const phone = item.phone || 'N/A';
  const email = item.email || item.website || 'N/A (No email provided in data)'; // JSON has url or website usually
  const address = [item.street, item.city, item.state].filter(Boolean).join(', ') || 'N/A';
  
  const entry = `Name: ${name}\nPhone: ${phone}\nWebsite/Email: ${email}\nAddress: ${address}\n------------------------\n`;
  
  if (results[category]) {
    results[category].push(entry);
  }
});

for (const [cat, entries] of Object.entries(results)) {
  if (entries.length > 0) {
    fs.writeFileSync(path.join(outputDir, `${cat}.txt`), entries.join('\n'));
    console.log(`Saved ${entries.length} items to data/${cat}.txt`);
  }
}
