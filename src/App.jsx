import { useState, useEffect } from 'react';

const enharmonicMap = {
  "Cb": "B", "Db": "C#", "Eb": "D#", "Fb": "E", "Gb": "F#", "Ab": "G#", "Bb": "A#",
  "B#": "C", "C#": "C#", "D#": "D#", "E#": "F", "F#": "F#", "G#": "G#", "A#": "A#",
  "C": "C", "D": "D", "E": "E", "F": "F", "G": "G", "A": "A", "B": "B"
};

const flatToSharp = {
  "Db": "C#",
  "Eb": "D#",
  "Gb": "F#",
  "Ab": "G#",
  "Bb": "A#"
};

const rootNotes = Object.values(enharmonicMap);

const stringNotes = ["E", "A", "D", "G", "B", "e"];
const semitoneNotes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const openStringNotes = [4, 9, 2, 7, 11, 4]; // MIDI values for E A D G B E

const chordGroups = {
  "Major Chords": [
    // Shape Root6: Root on 6th string (relative to root position)
    { 
      name: "Maj-Root6", 
      frets: [0, null, -3, 1, null, null], // Relative to root fret
      root: { string: 0, fret: 0 }, // Root is at fret 0 of this shape
      rootInterval: "root" // This shape has the root on the 6th string
    },
    // Shape Third6: Major 3rd on 6th string (relative to where 3rd should be)
    { 
      name: "Maj-Third6", 
      frets: [0, null, -2, 0, null, null], // Relative to where major 3rd is
      root: { string: 0, fret: 0 }, // Reference point is at fret 0
      rootInterval: "third" // This shape positions the major 3rd on the 6th string
    },
    // Shape Fifth6: Perfect 5th on 6th string (relative to where 5th should be)
    { 
      name: "Maj-Fifth6", 
      frets: [0, null, -1, 2, null, null], // Relative to where perfect 5th is
      root: { string: 0, fret: 0 }, // Reference point is at fret 0
      rootInterval: "fifth" // This shape positions the perfect 5th on the 6th string
    }
  ],
  "Major 7th Chords": [
    // Shape Root6: Root on 6th string (relative to root position)
    { 
      name: "7th-Root6", 
      frets: [0, null, -1, -1, 0, null], // Relative to root fret
      root: { string: 0, fret: 0 }, // Root is at fret 0 of this shape
      rootInterval: "root" // This shape has the root on the 6th string
    },
    // Shape Third6: Major 3rd on 6th string (relative to where 3rd should be)
    { 
      name: "7th-Third6", 
      frets: [0, null, -2, 0, 0, null], // Relative to where major 3rd is
      root: { string: 0, fret: 0 }, // Reference point is at fret 0
      rootInterval: "third" // This shape positions the major 3rd on the 6th string
    },
    // Shape Fifth6: Perfect 5th on 6th string (relative to where 5th should be)
    { 
      name: "7th-Fifth6", 
      frets: [0, null, -1, 1, null, null], // Relative to where perfect 5th is
      root: { string: 0, fret: 0 }, // Reference point is at fret 0
      rootInterval: "fifth" // This shape positions the perfect 5th on the 6th string
    },
    { 
      name: "7th-Seventh6", 
      frets: [0, null, -2, -2, -2, null], // Relative to where perfect 5th is
      root: { string: 0, fret: 0 }, // Reference point is at fret 0
      rootInterval: "seventh" // This shape positions the perfect 5th on the 6th string
    }
  ],
  "6 Chords": [
    // Shape Root6: Root on 6th string (relative to root position)
    { 
      name: "6th-Root6", 
      frets: [0, null, -1, 1, 0, null], // Relative to root fret
      root: { string: 0, fret: 0 }, // Root is at fret 0 of this shape
      rootInterval: "root" // This shape has the root on the 6th string
    },
    // Shape Third6: Major 3rd on 6th string (relative to where 3rd should be)
    { 
      name: "6th-Third6", 
      frets: [0, null, -2, 0, -2, null], // Relative to where major 3rd is
      root: { string: 0, fret: 0 }, // Reference point is at fret 0
      rootInterval: "third" // This shape positions the major 3rd on the 6th string
    },
    // Shape Fifth6: Perfect 5th on 6th string (relative to where 5th should be)
    { 
      name: "6th-Fifth6", 
      frets: [0, null, -1, -1, -2, null], // Relative to where perfect 5th is
      root: { string: 0, fret: 0 }, // Reference point is at fret 0
      rootInterval: "fifth" // This shape positions the perfect 5th on the 6th string
    },
    // Shape Sixth: 6th on 6th string (relative to where 6th should be)
    { 
      name: "6th-Fifth6", 
      frets: [0, null, 0, 0, 0, null], // Relative to where perfect 5th is
      root: { string: 0, fret: 0 }, // Reference point is at fret 0
      rootInterval: "fifth" // This shape positions the perfect 5th on the 6th string
    }
  ],
};

const groupOptions = Object.keys(chordGroups);

function normalizeNote(note) {
  // Capitalize first letter, keep accidental as is
  let cleaned = note.trim().replace(/♭/, "b").replace(/♯/, "#");
  if (cleaned.length > 1) {
    cleaned = cleaned[0].toUpperCase() + cleaned.slice(1).toLowerCase();
  } else {
    cleaned = cleaned.toUpperCase();
  }
  // If it's a flat, convert to sharp for calculation
  if (flatToSharp[cleaned]) {
    return flatToSharp[cleaned];
  }
  // If it's a valid sharp or natural note, return as is
  if (semitoneNotes.includes(cleaned)) {
    return cleaned;
  }
  // Try enharmonic map as fallback
  const normalized = enharmonicMap[cleaned];
  if (normalized && semitoneNotes.includes(normalized)) {
    return normalized;
  }
  console.warn(`Invalid note: ${note}, using C instead`);
  return "C";
}

function getFretForNote(note, stringIndex) {
  let normalized = normalizeNote(note);
  // If the note is a flat, convert to sharp for calculation
  if (flatToSharp[normalized]) {
    normalized = flatToSharp[normalized];
  }
  const openNote = openStringNotes[stringIndex];
  let targetNote = semitoneNotes.indexOf(normalized);
  if (targetNote === -1) {
    console.warn(`Note ${note} not found, using C`);
    targetNote = 0; // C
  }
  let fret = targetNote - openNote;
  if (fret < 0) fret += 12;
  return fret;
}

function transposeShape(shape, rootNote, shapeInfo) {
  const normalizedRoot = normalizeNote(rootNote);
  const rootIndex = semitoneNotes.indexOf(normalizedRoot);
    
  let targetFret;
  
  // Determine the target fret based on the shape's root interval
  switch (shapeInfo.rootInterval) {
    case "root":
      // Shape has root note on the reference string
      targetFret = getFretForNote(normalizedRoot, shapeInfo.root.string);
      break;
    case "third":
      // Shape has major 3rd on the reference string
      const thirdNote = semitoneNotes[(rootIndex + 4) % 12];
      targetFret = getFretForNote(thirdNote, shapeInfo.root.string);
      break;
    case "fifth":
      // Shape has perfect 5th on the reference string
      const fifthNote = semitoneNotes[(rootIndex + 7) % 12];
      targetFret = getFretForNote(fifthNote, shapeInfo.root.string);
      break;
    default:
      targetFret = getFretForNote(normalizedRoot, shapeInfo.root.string);
  }
  
  // Apply the relative fret positions to the target position
  const transposedShape = shape.map((relativeFret) => {
    if (relativeFret === null) return null;
    const absoluteFret = targetFret + relativeFret;
    return absoluteFret;
  });
  
  
  // Check if any frets are negative and adjust if needed
  const validFrets = transposedShape.filter(f => f !== null);
  const minFret = validFrets.length > 0 ? Math.min(...validFrets) : 0;
  
  // If we have frets below 0, move the whole shape up an octave
  if (minFret < 0) {
    return transposedShape.map(f => f === null ? null : (f !== null ? f + 12 : null));
  }
  // If any fret is 0, move the whole shape up an octave
  if (validFrets.includes(0)) {
    return transposedShape.map(f => f === null ? null : (f !== null ? f + 12 : null));
  }
  
  return transposedShape;
}

// Helper to display flats for flat chords
function displayNoteLabel(note, preferFlat = false) {
  const sharpToFlat = {
    "C#": "Db", "D#": "Eb", "F#": "Gb", "G#": "Ab", "A#": "Bb"
  };
  if (preferFlat && sharpToFlat[note]) return sharpToFlat[note];
  return note;
}

function noteLabel(stringIdx, fret, rootChord = null) {
  const midiValue = openStringNotes[stringIdx] + fret;
  const note = semitoneNotes[midiValue % 12];
  // If the root chord is a flat, prefer flat label
  const preferFlat = rootChord && /b/.test(rootChord);
  return displayNoteLabel(note, preferFlat);
}

function FretboardDiagram({ frets, rootChord }) {
  // Include 0 in valid frets
  const validFrets = frets.filter(f => f !== null);
  const startingFret = validFrets.length > 0 ? Math.min(...validFrets) : 0;
  const maxFret = validFrets.length > 0 ? Math.max(...validFrets) : 5;
  const visibleFrets = Math.max(5, maxFret - startingFret + 1);
  const showNut = startingFret === 0;
  const cellSize = 32;
  const stringCount = 5;

  const leftmostFret = frets[0];

  return (
    <div className="inline-block p-3 bg-amber-50 rounded-lg">
      <div className="flex flex-col items-center">
        <div className="flex flex-row items-start">
          {/* Fret numbers on y-axis */}
          <div className="flex flex-col justify-between mr-2" style={{ height: cellSize * visibleFrets }}>
            {[...Array(visibleFrets)].map((_, fretIdx) => (
              <div
                key={`fret-label-${fretIdx}`}
                className="flex items-center justify-end"
                style={{ height: cellSize, minHeight: cellSize, marginRight: 10 }}
              >
                <span className={"text-sm font-bold " + ((startingFret + fretIdx) === leftmostFret ? "text-black" : "text-transparent") }>
                  {startingFret + fretIdx}
                </span>
              </div>
            ))}
          </div>
          <div className="relative" style={{ width: cellSize * stringCount, height: cellSize * visibleFrets }}>
            {/* Draw string lines ONCE, spanning the whole fretboard */}
            {[...Array(stringCount)].map((_, stringIdx) => (
              <div
                key={stringIdx}
                className="absolute top-0 h-full w-0.5 bg-gray-700"
                style={{
                  left: `${(stringIdx + .5) * cellSize}px`,
                  transform: 'translateX(-50%)',
                  zIndex: 1,
                }}
              />
            ))}
            {/* Draw the grid cells */}
            <div className="grid absolute top-0 left-0" style={{
              gridTemplateRows: `repeat(${visibleFrets}, ${cellSize}px)` ,
              gridTemplateColumns: `repeat(${stringCount}, ${cellSize}px)`,
              width: cellSize * stringCount,
              height: cellSize * visibleFrets,
              zIndex: 2,
            }}>
              {[...Array(visibleFrets)].map((_, fretIdx) => (
                [...Array(stringCount)].map((_, stringIdx) => {
                  const currentFret = startingFret + fretIdx;
                  return (
                    <div
                      key={`${fretIdx}-${stringIdx}`}
                      className="border border-gray-400 w-8 h-8 relative bg-yellow-100"
                      style={{
                        borderTopWidth: fretIdx === 0 && showNut ? 4 : 1,
                        borderColor: '#444',
                        boxSizing: 'border-box',
                      }}
                    >
                    </div>
                  );
                })
              ))}
            </div>
            {/* Draw the finger dots ON the string lines */}
            {[...Array(visibleFrets)].map((_, fretIdx) => (
              [...Array(stringCount)].map((_, stringIdx) => {
                const currentFret = startingFret + fretIdx;
                const isFingered = frets[stringIdx] === currentFret;
                if (!isFingered) return null;
                return (
                  <div
                    key={`dot-${fretIdx}-${stringIdx}`}
                    className="w-5 h-5 bg-black rounded-full z-10 flex items-center justify-center absolute"
                    style={{
                      left: `${(stringIdx + 0.5) * cellSize - 15}px`,
                      top: `${(fretIdx + 0.5) * cellSize}px`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <span className="text-[9px] text-white font-bold">{noteLabel(stringIdx, currentFret, rootChord)}</span>
                  </div>
                );
              })
            ))}
          </div>
        </div>
        {/* String labels */}
        <div className="flex flex-row mt-2" style={{ marginLeft: cellSize + 0 }}>
          {stringNotes.map((label, idx) => (
            <div 
              key={idx} 
              className="text-center text-xs font-semibold" 
              style={{ width: cellSize }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

let audioContext = null;

async function initializeAudio() {
  if (!audioContext) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContext();
  }
  return audioContext;
}

async function playChord(frets) {
  try {
    const ctx = await initializeAudio();
    
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    
    const now = ctx.currentTime;
    const activeNotes = frets.filter(f => f !== null && f >= 0).length;
    
    if (activeNotes === 0) {
      return;
    }

    frets.forEach((fret, stringIdx) => {
      if (fret !== null && fret >= 0) {
        const midiNote = openStringNotes[stringIdx] + fret + 48;
        const freq = 440 * Math.pow(2, (midiNote - 69) / 12);
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        const volume = 0.2;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(volume, now + 0.05);
        gain.gain.linearRampToValueAtTime(0, now + 0.5);
        
        osc.start(now);
        osc.stop(now + 0.5);
      }
    });
  } catch (error) {
    alert('Could not play audio. Please try again.');
  }
}

export default function GuitarJazzPractice() {
  const [progression, setProgression] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("Major Chords");
  const [selectedShape, setSelectedShape] = useState("Root6");
  const [sequence, setSequence] = useState("C F Bb Eb");

  const generateProgression = () => {
    const sequenceChords = sequence.trim().split(/\s+/);
    const shapes = chordGroups[selectedGroup];

    if (!shapes || shapes.length === 0) {
      console.warn('No shapes available for selected group');
      return;
    }

    // First, create the initial progression with the selected shape for the first chord
    const initialProgression = sequenceChords.map((chordName, index) => {
      const normalizedChord = normalizeNote(chordName);
      const shape = shapes.find(s => s.name === selectedShape) || shapes[0];
      const transposed = transposeShape(shape.frets, normalizedChord, shape);

      return {
        label: `${chordName} (${shape.name})`,
        shape: transposed,
        shapeName: shape.name
      };
    });

    // Then, optimize the shapes for subsequent chords using a for loop
    const optimizedProgression = [...initialProgression];
    
    for (let i = 1; i < sequenceChords.length; i++) {
      const normalizedChord = normalizeNote(sequenceChords[i]);
      const prevChord = optimizedProgression[i - 1];
      const prevLeftmostFret = prevChord.shape[0];
      
      // Calculate all possible shapes for this chord
      const possibleShapes = shapes.map(s => {
        const transposed = transposeShape(s.frets, normalizedChord, s);
        return {
          shape: s,
          transposed,
          leftmostFret: transposed[0]
        };
      });
      
      // Find the shape that minimizes the absolute difference in leftmost fret
      const bestShape = possibleShapes.reduce((best, current) => {
        const currentDiff = Math.abs(current.leftmostFret - prevLeftmostFret);
        const bestDiff = Math.abs(best.leftmostFret - prevLeftmostFret);
        return currentDiff < bestDiff ? current : best;
      });

      optimizedProgression[i] = {
        label: `${sequenceChords[i]} (${bestShape.shape.name})`,
        shape: bestShape.transposed,
        shapeName: bestShape.shape.name
      };
    }

    setProgression(optimizedProgression);
  };

  useEffect(() => {
    // Initialize audio on component mount
    initializeAudio().catch(error => {
      console.error('Failed to initialize audio:', error);
    });
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Jazz Guitar Chord Sequence Generator</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Chord Group:</label>
            <select 
              value={selectedGroup} 
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {groupOptions.map(group => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">First Chord Shape:</label>
            <select 
              value={selectedShape} 
              onChange={(e) => setSelectedShape(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {chordGroups[selectedGroup].map(shape => (
                <option key={shape.name} value={shape.name}>{shape.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Chord Sequence:</label>
            <input 
              type="text"
              value={sequence} 
              onChange={(e) => setSequence(e.target.value)} 
              placeholder="Enter chord sequence (e.g., C F Bb Eb)"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <button 
          onClick={generateProgression}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors"
        >
          Generate Progression
        </button>
      </div>

      <div className="grid gap-6">
        {progression.map(({ label, shape, shapeName }, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-md">
            <div className="font-bold text-xl mb-4 text-gray-800">{label}</div>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <FretboardDiagram frets={shape} rootChord={label.split(' ')[0]} />
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => playChord(shape)}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  🎵 Play Chord
                </button>
                <div className="text-sm text-gray-600">
                  <strong>Shape:</strong> {shapeName}
                </div>
                <div className="text-xs text-gray-500">
                  <strong>Frets:</strong> [{shape.map(f => f === null ? 'x' : f).join(', ')}]
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {progression.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          <p>Click "Generate Progression" to see chord diagrams</p>
        </div>
      )}
    </div>
  );
}
