const exampleSongs = [{
  title: 'Nocturne in B-flat minor Op.9 No.1',
  artist: 0,
  instrument: 0,
  genre: 0,
  difficulty: 6,
  progress: 4,
  customFields: [
    { id: 0, value: 1838 },
    { id: 1, value: 'Bb Major' },
    { id: 2, value: ['Intense', 'Theatrical'] },
    { id: 3, value: 'gxXSlhO4a5A' }
  ]
}, {
  title: 'Nocturne in E-flat major Op.9 No.2',
  artist: 0,
  instrument: 0,
  genre: 0,
  difficulty: 6,
  progress: 1,
  customFields: [
    { id: 0, value: 1830 },
    { id: 1, value: 'Eb Major' },
    { id: 2, value: ['Reflective', 'Sentimental'] },
    { id: 3, value: 'tV5U8kVYS88' }
  ]
}, {
  title: '12 Études Op. 10 No.1 in C major "Waterfall"',
  artist: 0,
  instrument: 0,
  genre: 0,
  difficulty: 10,
  progress: 1,
  customFields: [
    { id: 0, value: 1830 },
    { id: 1, value: 'C Major' },
    { id: 2, value: ['Intense'] },
    { id: 3, value: '9E82wwNc7r8' }
  ]
}, {
  title: '12 Études Op. 10 No.4 in C-sharp minor "Torrent"',
  artist: 0,
  instrument: 0,
  genre: 0,
  difficulty: 10,
  progress: 4,
  customFields: [
    { id: 0, value: 1832 },
    { id: 1, value: 'C# Minor' },
    { id: 2, value: ['Cathartic', 'Turbulent', 'Intense'] },
    { id: 3, value: 'mUVCGsWhwHU' }
  ]
}, {
  title: '12 Études Op.10 No.12 in C minor "Revolutionary"',
  year: 1831,
  artist: 0,
  instrument: 0,
  genre: 0,
  difficulty: 10,
  progress: 4,
  customFields: [
    { id: 0, value: 1838 },
    { id: 1, value: 'C Minor' },
    { id: 2, value: [ 'Cerebral', 'Energetic', 'Intense', 'Marching' ] },
    { id: 3, value: 'Gi5VTBdKbFM' }
  ]
}, {
  title: 'Prelude in E minor Op.28 No.4',
  artist: 0,
  instrument: 0,
  genre: 0,
  difficulty: 4,
  progress: 3,
  customFields: [
    { id: 0, value: 1838 },
    { id: 1, value: 'E Minor' },
    { id: 2, value: [ 'Cerebral', 'Energetic', 'Intense', 'Marching' ] },
    { id: 3, value: 'https://www.youtube.com/watch?v=vYZS05S9qeI' }
  ]

}, {
  title: 'Piano Sonata No.1 Op.2 in F minor',
  artist: 1,
  instrument: 0,
  genre: 0,
  difficulty: 7,
  progress: 2,
  customFields: [
    { id: 0, value: 1795 },
    { id: 1, value: 'F Minor' },
    { id: 2, value: ['Cathartic', 'Turbulent', 'Intense'] },
    { id: 3, value: '9oIdtq9E2ZU' }
  ]
}, {
  title: 'Bagatelle in A minor (Fur Elise)',
  artist: 1,
  instrument: 0,
  genre: 0,
  difficulty: 5,
  progress: 2,
  customFields: [
    { id: 0, value: 1810 },
    { id: 1, value: 'A Minor' },
    { id: 2, value: ['Cathartic', 'Turbulent', 'Intense'] },
    { id: 3, value: 'yAsDLGjMhFI' }
  ]
}, {
  title: 'Piano Sonata No.14 Op.27 (Moonlight) in C# Minor',
  artist: 1,
  instrument: 0,
  genre: 0,
  difficulty: 2,
  progress: 4,
  customFields: [
    { id: 0, value: 1801 },
    { id: 1, value: 'C# Minor' },
    { id: 2, value: ['Cathartic', 'Turbulent', 'Intense'] },
    { id: 3, value: 'SqciMXaABjA' }
  ]

}, {
  title: 'The Flight of the Bumblebee (The Tale of Tsar Saltan Act III)',
  artist: 2,
  instrument: 0,
  genre: 0,
  difficulty: 14,
  progress: 0,
  customFields: [
    { id: 0, value: 1899 },
    { id: 1, value: 'A Minor' },
    { id: 2, value: ['Cathartic', 'Turbulent', 'Intense'] },
    { id: 3, value: '8alxBofd_eQ' }
  ]

}, {
  title: 'Canon in D',
  artist: 3,
  instrument: 0,
  genre: 0,
  difficulty: 3,
  progress: 1,
  customFields: [
    { id: 0, value: 1680 },
    { id: 1, value: 'D Major' },
    { id: 2, value: ['Cathartic', 'Turbulent', 'Intense'] },
    { id: 3, value: 'pnpgDzDeTjc' }
  ]

}, {
  title: 'Eine Kleine Nachtmusik (Serenade for Strings in G Major)',
  artist: 4,
  instrument: 0,
  genre: 0,
  difficulty: 5,
  progress: 1,
  customFields: [
    { id: 0, value: 1787 },
    { id: 1, value: 'G Major' },
    { id: 2, value: ['Cathartic', 'Turbulent', 'Intense'] },
    { id: 3, value: 'ElCb0Ar1ee4' }
  ]
}, {
  title: 'Piano Sonata No.11 in A major (Turkish March)',
  artist: 4,
  instrument: 0,
  genre: 0,
  difficulty: 8,
  progress: 3,
  customFields: [
    { id: 0, value: 1783 },
    { id: 1, value: 'A Major' },
    { id: 2, value: ['Cathartic', 'Turbulent', 'Intense'] },
    { id: 3, value: 'uWYmUZTYE78' }
  ]

}, {
  title: "Concerto No.1 in E major Spring from 'The Four Seasons'",
  artist: 5,
  instrument: 0,
  genre: 0,
  difficulty: 6,
  progress: 0,
  customFields: [
    { id: 0, value: 1723 },
    { id: 1, value: 'E Major' },
    { id: 2, value: ['Cathartic', 'Turbulent', 'Intense'] },
    { id: 3, value: 'Ocd5MWydCzU' }
  ]

}, {
  title: 'Orchestral Suite No.3 in D Major (Air on the G String)',
  artist: 6,
  instrument: 0,
  genre: 0,
  difficulty: 5,
  progress: 2,
  customFields: [
    { id: 0, value: 1730 },
    { id: 1, value: 'D Major' },
    { id: 2, value: ['Cathartic', 'Turbulent', 'Intense'] },
    { id: 3, value: 'vNkIj_BhHvY' }
  ]

}, {
  title: "Dance of the Sugar Plum Fairy from 'The Nutcracker'",
  artist: 7,
  instrument: 0,
  genre: 0,
  difficulty: 10,
  progress: 1,
  customFields: [
    { id: 0, value: 1892 },
    { id: 1, value: 'D Minor' },
    { id: 2, value: ['Cathartic', 'Turbulent', 'Intense'] },
    { id: 3, value: 'TPFFx3KRwEQ' }
  ]
}];

export default exampleSongs;
