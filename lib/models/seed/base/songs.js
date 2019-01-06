const exampleSongs = [{
  title: 'Nocturne in B-flat minor Op.9 No.1',
  artist: 0,
  instrument: 0,
  genre: 0,
  difficulty: 6,
  progress: 4,
  userFields: [
    { ref: 0.1, value: 1838 },
    { ref: 2.1, value: 'Bb Major' },
    { ref: 3.1, value: ['Intense', 'Theatrical'] },
    { ref: 7.1, value: 'gxXSlhO4a5A' }
  ],
}, {
  title: 'Nocturne in E-flat major Op.9 No.2',
  artist: 0,
  instrument: 0,
  genre: 0,
  difficulty: 6,
  progress: 1,
  userFields: [
    { ref: 0.1, value: 1830 },
    { ref: 2.1, value: 'Eb Major' },
    { ref: 3.1, value: ['Reflective', 'Sentimental'] },
    { ref: 7.1, value: 'tV5U8kVYS88' }
  ],
}, {
  title: '12 Études Op. 10 No.1 in C major "Waterfall"',
  artist: 0,
  instrument: 0,
  genre: 0,
  difficulty: 10,
  progress: 1,
  userFields: [
    { ref: 0.1, value: 1830 },
    { ref: 2.1, value: 'C Major' },
    { ref: 3.1, value: ['Intense'] },
    { ref: 7.1, value: '9E82wwNc7r8' }
  ],
}, {
  title: '12 Études Op. 10 No.4 in C-sharp minor "Torrent"',
  artist: 0,
  instrument: 0,
  genre: 0,
  difficulty: 10,
  progress: 4,
  userFields: [
    { ref: 0.1, value: 1832 },
    { ref: 2.1, value: 'C# Minor' },
    { ref: 3.1, value: ['Cathartic', 'Turbulent', 'Intense'] },
    { ref: 7.1, value: 'mUVCGsWhwHU' }
  ],
}, {
  title: '12 Études Op.10 No.12 in C minor "Revolutionary"',
  artist: 0,
  instrument: 0,
  genre: 0,
  year: 1831,
  difficulty: 10,
  progress: 4,
  userFields: [
    { ref: 0.1, value: 1838 },
    { ref: 2.1, value: 'C Minor' },
    { ref: 3.1, value: ['Cerebral', 'Energetic', 'Intense', 'Marching'] },
    { ref: 7.1, value: 'Gi5VTBdKbFM' }
  ],
}, {
  title: 'Prelude in E minor Op.28 No.4',
  artist: 0,
  instrument: 0,
  genre: 0,
  difficulty: 4,
  progress: 3,
  userFields: [
    { ref: 0.1, value: 1838 },
    { ref: 2.1, value: 'E Minor' },
    { ref: 3.1, value: ['Cerebral', 'Energetic', 'Intense', 'Marching'] },
    { ref: 7.1, value: 'https://www.youtube.com/watch?v=vYZS05S9qeI' }
  ],
}, {
  title: 'Piano Sonata No.1 Op.2 in F minor',
  artist: 1,
  instrument: 0,
  genre: 0,
  difficulty: 7,
  progress: 2,
  userFields: [
    { ref: 0.1, value: 1795 },
    { ref: 2.1, value: 'F Minor' },
    { ref: 3.1, value: ['Cathartic', 'Turbulent', 'Intense'] },
    { ref: 7.1, value: '9oIdtq9E2ZU' }
  ],
}, {
  title: 'Bagatelle in A minor (Fur Elise)',
  artist: 1,
  instrument: 0,
  genre: 0,
  difficulty: 5,
  progress: 2,
  userFields: [
    { ref: 0.1, value: 1810 },
    { ref: 2.1, value: 'A Minor' },
    { ref: 3.1, value: ['Cathartic', 'Turbulent', 'Intense'] },
    { ref: 7.1, value: 'yAsDLGjMhFI' }
  ],
}, {
  title: 'Piano Sonata No.14 Op.27 (Moonlight) in C# Minor',
  artist: 1,
  instrument: 0,
  genre: 0,
  difficulty: 2,
  progress: 4,
  userFields: [
    { ref: 0.1, value: 1801 },
    { ref: 2.1, value: 'C# Minor' },
    { ref: 3.1, value: ['Cathartic', 'Turbulent', 'Intense'] },
    { ref: 7.1, value: 'SqciMXaABjA' }
  ],
}, {
  title: 'The Flight of the Bumblebee (The Tale of Tsar Saltan Act III)',
  artist: 2,
  instrument: 0,
  genre: 0,
  difficulty: 14,
  progress: 0,
  userFields: [
    { ref: 0.1, value: 1899 },
    { ref: 2.1, value: 'A Minor' },
    { ref: 3.1, value: ['Cathartic', 'Turbulent', 'Intense'] },
    { ref: 7.1, value: '8alxBofd_eQ' }
  ],
}, {
  title: 'Canon in D',
  artist: 3,
  instrument: 0,
  genre: 0,
  difficulty: 3,
  progress: 1,
  userFields: [
    { ref: 0.1, value: 1680 },
    { ref: 2.1, value: 'D Major' },
    { ref: 3.1, value: ['Cathartic', 'Turbulent', 'Intense'] },
    { ref: 7.1, value: 'pnpgDzDeTjc' }
  ],
}, {
  title: 'Eine Kleine Nachtmusik (Serenade for Strings in G Major)',
  artist: 4,
  instrument: 0,
  genre: 0,
  difficulty: 5,
  progress: 1,
  userFields: [
    { ref: 0.1, value: 1787 },
    { ref: 2.1, value: 'G Major' },
    { ref: 3.1, value: ['Cathartic', 'Turbulent', 'Intense'] },
    { ref: 7.1, value: 'ElCb0Ar1ee4' }
  ],
}, {
  title: 'Piano Sonata No.11 in A major (Turkish March)',
  artist: 4,
  instrument: 0,
  genre: 0,
  difficulty: 8,
  progress: 3,
  userFields: [
    { ref: 0.1, value: 1783 },
    { ref: 2.1, value: 'A Major' },
    { ref: 3.1, value: ['Cathartic', 'Turbulent', 'Intense'] },
    { ref: 7.1, value: 'uWYmUZTYE78' }
  ],
}, {
  title: 'Concerto No.1 in E major Spring from "The Four Seasons"',
  artist: 5,
  instrument: 0,
  genre: 0,
  difficulty: 6,
  progress: 0,
  userFields: [
    { ref: 0.1, value: 1723 },
    { ref: 2.1, value: 'E Major' },
    { ref: 3.1, value: ['Cathartic', 'Turbulent', 'Intense'] },
    { ref: 7.1, value: 'Ocd5MWydCzU' }
  ]
}, {
  title: 'Orchestral Suite No.3 in D Major (Air on the G String)',
  artist: 6,
  instrument: 0,
  genre: 0,
  difficulty: 5,
  progress: 2,
  userFields: [
    { ref: 0.1, value: 1730 },
    { ref: 2.1, value: 'D Major' },
    { ref: 3.1, value: ['Cathartic', 'Turbulent', 'Intense'] },
    { ref: 7.1, value: 'vNkIj_BhHvY' }
  ],
}, {
  title: 'Dance of the Sugar Plum Fairy from "The Nutcracker"',
  artist: 7,
  instrument: 0,
  genre: 0,
  difficulty: 10,
  progress: 1,
  userFields: [
    { ref: 0.1, value: 1892 },
    { ref: 2.1, value: 'D Minor' },
    { ref: 3.1, value: ['Cathartic', 'Turbulent', 'Intense'] },
    { ref: 7.1, value: 'TPFFx3KRwEQ' }
  ],
}, {
  title: 'Rêverie',
  artist: 20,
  instrument: 0,
  genre: 0,
  difficulty: 10,
  progress: 1,
  userFields: [
    { ref: 0.1, value: 1892 },
    { ref: 2.1, value: 'D Minor' },
    { ref: 3.1, value: ['Cathartic', 'Turbulent', 'Intense'] },
    { ref: 7.1, value: 'TPFFx3KRwEQ' }
  ]
}];

module.exports = exampleSongs;
