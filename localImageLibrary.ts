export const LocalImageLibrary = {
  person: {
    male: [
      '/assets/fallback/person-male-1.jpg',
      '/assets/fallback/person-male-2.jpg'
    ],
    female: [
      '/assets/fallback/person-female-1.jpg',
      '/assets/fallback/person-female-2.jpg'
    ]
  },
  
  top: {
    casual: ['/assets/fallback/top-casual.jpg'],
    formal: ['/assets/fallback/top-formal.jpg'],
    sport: ['/assets/fallback/top-sport.jpg']
  },
  
  bottom: {
    casual: ['/assets/fallback/bottom-casual.jpg'],
    formal: ['/assets/fallback/bottom-formal.jpg'],
    sport: ['/assets/fallback/bottom-sport.jpg']
  },
  
  accessory: {
    default: ['/assets/fallback/accessory-1.jpg']
  }
};

export function getLocalFallback(category: string, style?: string): string {
  const lib = LocalImageLibrary as any;
  
  if (!lib[category]) {
    return '/assets/fallback/placeholder.jpg';
  }
  
  const options = lib[category][style || 'casual'] || lib[category].default || Object.values(lib[category])[0];
  
  if (Array.isArray(options)) {
    return options[Math.floor(Math.random() * options.length)];
  }
  
  return options || '/assets/fallback/placeholder.jpg';
}
