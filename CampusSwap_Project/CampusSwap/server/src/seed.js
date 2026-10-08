'use strict';

const { nowIso } = require('./store');

/**
 * Demo data so the app looks alive the first time it boots.
 * Passwords are hashed by the caller (models.ensureSeed) before insertion.
 */

const DEMO_PASSWORD = 'campus123';

const DEMO_USERS = [
  {
    id: 'u_ananya',
    name: 'Ananya Rao',
    email: 'ananya@campus.edu',
    campus: 'Sunrise Institute of Technology',
    course: 'Computer Science',
    year: '3rd year',
    bio: 'Selling my senior-year books and gadgets. Responsive, meet at the Main Library.',
    rating: 4.9,
    trades: 18,
    verified: true,
    meetup: 'Main Library',
    password: DEMO_PASSWORD
  },
  {
    id: 'u_rahul',
    name: 'Rahul Mehta',
    email: 'rahul@campus.edu',
    campus: 'Sunrise Institute of Technology',
    course: 'Electronics',
    year: '2nd year',
    bio: 'Calculator and lab gear. Quick to reply between lectures.',
    rating: 4.6,
    trades: 7,
    verified: true,
    meetup: 'Canteen Block B',
    password: DEMO_PASSWORD
  },
  {
    id: 'u_meera',
    name: 'Meera Shah',
    email: 'meera@campus.edu',
    campus: 'Sunrise Institute of Technology',
    course: 'Architecture',
    year: '4th year',
    bio: 'Hostel essentials as I graduate. Everything works, prices negotiable.',
    rating: 4.8,
    trades: 11,
    verified: true,
    meetup: 'Hostel Reception',
    password: DEMO_PASSWORD
  },
  {
    id: 'u_arjun',
    name: 'Arjun Nair',
    email: 'arjun@campus.edu',
    campus: 'Sunrise Institute of Technology',
    course: 'Mechanical',
    year: '3rd year',
    bio: 'Cycles and sports gear. You can test-ride before you buy.',
    rating: 4.5,
    trades: 9,
    verified: true,
    meetup: 'Sports Complex',
    password: DEMO_PASSWORD
  }
];

const DEMO_LISTINGS = [
  {
    id: 'l_dsa',
    name: 'DSA Made Easy — 2nd Edition',
    category: 'Books',
    price: 280,
    condition: 'Like new',
    desc: 'Clean pages, no highlights. Perfect for DSA semester prep.',
    sellerId: 'u_ananya',
    watch: 6
  },
  {
    id: 'l_casio',
    name: 'Casio FX-991ES Plus',
    category: 'Gadgets',
    price: 650,
    condition: 'Good',
    desc: 'Fully working scientific calculator with cover.',
    sellerId: 'u_rahul',
    watch: 3
  },
  {
    id: 'l_lamp',
    name: 'Study Lamp + Extension Board',
    category: 'Hostel',
    price: 420,
    condition: 'Good',
    desc: 'Warm LED lamp and 4-socket extension board.',
    sellerId: 'u_meera',
    watch: 4
  },
  {
    id: 'l_cycle',
    name: 'Single-Speed Campus Cycle',
    category: 'Cycles',
    price: 3200,
    condition: 'Used',
    desc: 'Recently serviced. Great for hostel-to-class commuting.',
    sellerId: 'u_arjun',
    watch: 8
  },
  {
    id: 'l_dbms',
    name: 'DBMS Complete Notes',
    category: 'Books',
    price: 150,
    condition: 'Good',
    desc: 'Handwritten + printed notes, unit-wise.',
    sellerId: 'u_ananya',
    watch: 2
  },
  {
    id: 'l_hub',
    name: 'USB-C Hub 6-in-1',
    category: 'Gadgets',
    price: 700,
    condition: 'Like new',
    desc: 'HDMI, USB 3.0, SD and PD charging.',
    sellerId: 'u_meera',
    watch: 5
  },
  {
    id: 'l_rack',
    name: 'Hostel Storage Rack',
    category: 'Hostel',
    price: 550,
    condition: 'Used',
    desc: 'Compact 3-layer rack. Easy to carry.',
    sellerId: 'u_arjun',
    watch: 1
  },
  {
    id: 'l_helmet',
    name: 'Helmet — ISI Certified',
    category: 'Cycles',
    price: 900,
    condition: 'Good',
    desc: 'Lightly used, adjustable fit.',
    sellerId: 'u_rahul',
    watch: 2
  }
];

function buildSeedListings() {
  const created = nowIso();
  return DEMO_LISTINGS.map((listing, index) => ({
    ...listing,
    image: '',
    status: 'active',
    createdAt: new Date(Date.parse(created) - index * 3600 * 1000).toISOString()
  }));
}

module.exports = { DEMO_USERS, DEMO_LISTINGS, DEMO_PASSWORD, buildSeedListings };
