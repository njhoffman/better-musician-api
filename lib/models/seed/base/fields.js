// id: 5, label: 'Radio Buttons',
// id: 6, label: 'Date',
// id: 7, label: 'YouTube Link',
// id: 8, label: 'PDF Link',
// id: 9, label: 'Slider',
// id: 10, label: 'Metronome',
// id: 11, label: 'Number Box',

const baseFields = [{
  // Text Box
  typeId: 0,
  refId: 0.1,
  label: 'Year Composed',
}, {

  // AutoComplete
  typeId: 1,
  refId: 1.1,
  label: 'Sub-Genre',
  options: [
  ],
}, {
  typeId: 1,
  refId: 1.2,
  label: 'Country',
  options: [
  ],
}, {
  typeId: 1,
  refId: 1.3,
  label: 'State',
  options: [
  ],
}, {

  // Select Menu
  typeId: 2,
  refId: 2.1,
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
}, {
  typeId: 2,
  refId: 2.2,
  label: 'Record Certification',
  options: [
    'None',
    'Gold',
    'Platinum',
    'Diamond'
  ]
}, {
  typeId: 5,
  refId: 2.3,
  label: 'Single Certification',
  options: [
    'Gold',
    'Platinum',
    'Multi-Platinum'
  ]
}, {

  // Multi-Select Menu
  typeId: 3,
  refId: 3.1,
  label: 'Moods',
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
}, {
  typeId: 3,
  refId: 3.2,
  label: 'Scenario',
  options: [
    'Drive',
    'Exercise',
    'Party',
    'Relax',
    'Study',
    'Work'
  ],
}, {

  // Checkbox
  typeId: 4,
  refId: 4.1,
  label: 'Is Copyrighted'
}, {
  typeId: 4,
  refId: 4.2,
  label: 'Original Arrangement'
}, {

  // Radio buttons
  typeId: 5,
  refId: 5.1,
  label: 'Record Certification',
  options: [
    'None',
    'Gold',
    'Platinum',
    'Diamond'
  ]
}, {
  typeId: 5,
  refId: 5.2,
  label: 'Single Certification',
  options: [
    'Gold',
    'Platinum',
    'Multi-Platinum'
  ]
}, {

  // YouTube Link
  typeId: 7,
  refId: 7.1,
  label: 'Live Performance',
}, {
  typeId: 7,
  refId: 7.2,
  label: 'Original Performance',
}, {
  typeId: 7,
  refId: 7.3,
  label: 'Lyrics Video',
}, {

  // PDF Link
  typeId: 8,
  refId: 8.1,
  label: 'Sheet Music',
}, {
  typeId: 8,
  refId: 8.2,
  label: 'Lyrics',
}, {
  typeId: 8,
  refId: 8.3,
  label: 'Chord Chart',
}, {

  // Slider
  typeId: 9,
  refId: 9.1,
  label: 'Average dB',
  min: 0,
  max: 60,
  unit: 'dB'
}, {
  typeId: 9,
  refId: 9.2,
  label: 'Speed Progress',
  min: 90,
  max: 130,
  unit: 'BPM'
}, {
  typeId: 9,
  refId: 9.3,
  label: 'Dance Floor Response',
  min: 0,
  max: 100

  // Number Box

  // Simple Metronome
// }, {
//   typeId: 10,
//   refId: 10.0,
//   label: 'My Metronome'
// }, {
//
//   // Metronome Goal
//   typeId: 11,
//   refId: 11.0,
//   label: 'My Metronome Goal'
}];

module.exports = baseFields;
