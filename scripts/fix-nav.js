const fs = require('fs');

const newLinksStr = `const links = [
    { h: '/dashboard', i: 'dashboard', l: 'Dashboard' },
    { h: '/discover', i: 'local_fire_department', l: 'For You' },
    { h: '/search', i: 'search', l: 'Search' },
    { h: '/likes', i: 'favorite', l: 'Likes' },
    { h: '/chat', i: 'chat', l: 'Messages' },
    { h: '/profile', i: 'person', l: 'Profile' },
  ]`;

const newNavLinksStr = `const navLinks = [
    { href: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { href: '/discover', icon: 'local_fire_department', label: 'For You' },
    { href: '/search', icon: 'search', label: 'Search' },
    { href: '/likes', icon: 'favorite', label: 'Likes' },
    { href: '/chat', icon: 'chat', label: 'Messages' },
    { href: '/profile', icon: 'person', label: 'Profile' },
  ]`;

const files = [
  'src/app/discover/page.tsx',
  'src/app/likes/page.tsx',
  'src/app/search/page.tsx',
  'src/app/profile/page.tsx',
  'src/app/chat/page.tsx',
  'src/app/dashboard/page.tsx',
  'src/app/payment/page.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');

  // Replace links
  content = content.replace(/const links = \[[^\]]*\]/m, newLinksStr);
  
  // Replace navLinks (in dashboard)
  content = content.replace(/const navLinks = \[[^\]]*\]/m, newNavLinksStr);
  
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed nav in', file);
});
