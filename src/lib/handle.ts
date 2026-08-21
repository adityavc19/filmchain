const adjectives = [
  'cinematic', 'golden', 'silver', 'crimson', 'velvet', 'midnight', 'cosmic',
  'electric', 'phantom', 'neon', 'shadow', 'stellar', 'mystic', 'rogue',
  'vivid', 'blazing', 'frozen', 'silent', 'wild', 'rapid', 'bold', 'keen',
  'swift', 'dark', 'bright', 'grand', 'noble', 'epic', 'fierce', 'clever'
];

const animals = [
  'fox', 'owl', 'hawk', 'wolf', 'bear', 'lynx', 'stag', 'crow', 'hare',
  'viper', 'raven', 'tiger', 'eagle', 'cobra', 'puma', 'falcon', 'otter',
  'mantis', 'heron', 'drake', 'shark', 'panther', 'phoenix', 'griffin',
  'condor', 'badger', 'crane', 'bison', 'jaguar', 'osprey'
];

export function getOrCreateHandle(): string {
  if (typeof window === 'undefined') {
    return 'anonymous-user-000';
  }

  let handle = localStorage.getItem('filmchain-handle');
  if (!handle) {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const animal = animals[Math.floor(Math.random() * animals.length)];
    const num = Math.floor(Math.random() * 999) + 1;
    
    handle = `${adj}-${animal}-${num}`;
    localStorage.setItem('filmchain-handle', handle);
  }

  return handle;
}
