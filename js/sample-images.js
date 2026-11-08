// High-resolution photography sample images for instant testing without external downloads

export const SAMPLE_IMAGES = [
  {
    id: 'realistic',
    name: 'Portrait (Man)',
    url: new URL('../images/realistic-person.jpg', import.meta.url).href
  },
  {
    id: 'cat',
    name: 'Cute Cat',
    url: new URL('../images/sample-cat.jpg', import.meta.url).href
  },
  {
    id: 'horse',
    name: 'Majestic Horse',
    url: new URL('../images/sample-horse.jpg', import.meta.url).href
  }
];
