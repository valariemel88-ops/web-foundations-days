let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

function searchNotes(word) {
  const searchWord = word.toLowerCase();

  return notes.filter((note) =>
    note.text.toLowerCase().includes(searchWord)
  );
}

console.log(searchNotes("javascript"));
// Expected: [{ id: 4, text: "Revise JavaScript arrays", category: "study" }]
console.log(searchNotes("pizza"));
// Expected: []

function longestNote() {
  if (notes.length === 0) {
    return null;
  }

  let longest = notes[0];

  for (let note of notes) {
    if (note.text.length > longest.text.length) {
      longest = note;
    }
  }

  return longest;
}
console.log(longestNote());
// Expected: the note "Finish the Day 3 assignment"

console.log(longestNote().text.length);
// Expected: 27
function countByCategory() {
  const counts = {};

  for (let note of notes) {
    if (counts[note.category]) {
      counts[note.category]++;
    } else {
      counts[note.category] = 1;
    }
  }

  return counts;
}
console.log(countByCategory());
// Expected: { personal: 2, study: 2, work: 1 }

console.log(countByCategory().work);
// Expected: 1
function getSummary() {
  const counts = countByCategory();

  const total = notes.length;
  const noteWord = total === 1 ? "note" : "notes";

  return `${total} ${noteWord}: ${counts.personal || 0} personal, ${counts.work || 0} work, ${counts.study || 0} study.`;
}
console.log(getSummary());
// Expected: "5 notes: 2 personal, 1 work, 2 study."

console.log(notes.length);
// Expected: 5
function isDuplicate(text) {
  const cleanedText = text.trim().toLowerCase();

  return notes.some((note) =>
    note.text.trim().toLowerCase() === cleanedText
  );
}
console.log(isDuplicate("Call mum"));
// Expected: true

console.log(isDuplicate("   CALL MUM   "));
// Expected: true
function addNote(text, category) {
  const cleanedText = text.trim();

  if (cleanedText.length === 0 || cleanedText.length > 200) {
    console.log("❌ Note rejected: text must be 1-200 characters.");
    return false;
  }

  if (isDuplicate(cleanedText)) {
    console.log("❌ Note rejected: duplicate note.");
    return false;
  }

  if (!["personal", "work", "study"].includes(category)) {
    console.log("❌ Note rejected: invalid category.");
    return false;
  }

  const newNote = {
    id: Date.now(),
    text: cleanedText,
    category: category,
  };

  notes.push(newNote);

  console.log(`✅ Note added: "${newNote.text}"`);
  return true;
}
console.log(addNote("Plan my weekend", "personal"));
// Expected: true

console.log(notes.length);
// Expected: 6
console.log(addNote("  PLAN MY WEEKEND  ", "personal"));
// Expected: false

console.log(notes.length);
// Expected: 6
console.log(addNote("Buy a new notebook", "shopping"));
// Expected: false

console.log(notes.length);
// Expected: 6
console.log(addNote("   ", "personal"));
// Expected: false

console.log(notes.length);
// Expected: 6
const longText = "a".repeat(201);

console.log(addNote(longText, "study"));
// Expected: false

console.log(notes.length);
// Expected: 6