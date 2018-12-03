const exampleFields = [{
  id: '60000000-0000-0000-0000-000000000000',
  user: '30000000-0000-0000-0000-000000000000',
  type: 0,
  label: 'My Year Composed',
  updatedAt: []
}, {
  id: '60000000-0000-0000-0000-000000000001',
  user: '30000000-0000-0000-0000-000000000000',
  type: 2,
  label: 'My Composition Key',
  options: [
    'C Major',
    'C Minor',
    'C# Major',
    'C# Minor',
    'D Major',
    'D Minor',
    'Eb Major',
    'Eb Minor',
    'F Major',
    'F Minor',
    'F# Major',
    'F# Minor',
    'G Major',
    'G Minor',
    'Ab Major',
    'G# Minor',
    'A Major',
    'A Minor',
    'Bb Major',
    'Bb Minor',
    'B Major',
    'B Minor'
  ],
  updatedAt: []
}, {
  id: '60000000-0000-0000-0000-000000000002',
  user: '30000000-0000-0000-0000-000000000000',
  type: 3,
  label: 'My Associated Moods',
  options: [
    'Aggressive',
    'Cathartic',
    'Cerebral',
    'Energetic',
    'Gloomy',
    'Intense',
    'Marching',
    'Melancholy',
    'Mellow',
    'Playful',
    'Reflective',
    'Sensual',
    'Sentimental',
    'Spooky',
    'Theatrical',
    'Triumphant',
    'Turbulent',
    'Upbeat',
    'Uplifting'
  ],
  updatedAt: []
}, {
  id: '60000000-0000-0000-0000-000000000003',
  user: '30000000-0000-0000-0000-000000000000',
  type: 7,
  label: 'My Youtube Video',
  updatedAt: []
}, {
  id: '60000000-0000-0000-0000-000000000004',
  user: '30000000-0000-0000-0000-000000000000',
  type: 9,
  label: 'My Example Slider',
  updatedAt: []

  /* other user */

}, {
  id: '60000000-0000-0000-0000-000000000005',
  user: '30000000-0000-0000-0000-000000000002',
  type: 2,
  label: 'User2 Composition Key',
  options: [
    'Bb Minor',
    'B Major',
    'B Minor'
  ],
  updatedAt: []
}, {
  id: '60000000-0000-0000-0000-000000000006',
  user: '30000000-0000-0000-0000-000000000002',
  type: 3,
  label: 'User2 Associated Moods',
  options: [
    'Playful',
    'Upbeat',
    'Uplifting'
  ],
  updatedAt: []
}, {
  id: '60000000-0000-0000-0000-000000000007',
  user: '30000000-0000-0000-0000-000000000002',
  type: 7,
  label: 'User2 Youtube Video',
  updatedAt: []

  /* has refId which is used to populate default user accounts on regbister */

}, {
  refId: 'cfield-0',
  id: '60000000-0000-0000-0000-000000000008',
  type: 0,
  label: 'Year Composed',
  updatedAt: []
}, {
  refId: 'cfield-1',
  id: '60000000-0000-0000-0000-000000000009',
  type: 2,
  label: 'Composition Key',
  options: [
    'C Major',
    'C Minor',
    'C# Major',
    'C# Minor',
    'D Major',
    'D Minor',
    'Eb Major',
    'Eb Minor',
    'F Major',
    'F Minor',
    'F# Major',
    'F# Minor',
    'G Major',
    'G Minor',
    'Ab Major',
    'G# Minor',
    'A Major',
    'A Minor',
    'Bb Major',
    'Bb Minor',
    'B Major',
    'B Minor'
  ],
  updatedAt: []
}, {
  refId: 'cfield-2',
  id: '60000000-0000-0000-0000-0000000000010',
  type: 3,
  label: 'Associated Moods',
  options: [
    'Aggressive',
    'Cathartic',
    'Cerebral',
    'Energetic',
    'Gloomy',
    'Intense',
    'Marching',
    'Melancholy',
    'Mellow',
    'Playful',
    'Reflective',
    'Sensual',
    'Sentimental',
    'Spooky',
    'Theatrical',
    'Triumphant',
    'Turbulent',
    'Upbeat',
    'Uplifting'
  ],
  updatedAt: []
}, {
  refId: 'cfield-3',
  id: '60000000-0000-0000-0000-000000000011',
  type: 7,
  label: 'Youtube Video',
  updatedAt: []
}, {
  refId: 'cfield-4',
  id: '60000000-0000-0000-0000-000000000012',
  type: 9,
  label: 'Example Slider',
  updatedAt: []
}];

export default exampleFields;
