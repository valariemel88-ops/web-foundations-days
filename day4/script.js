const noteText = document.querySelector("#note-text");
const charCount = document.querySelector("#char-count");
const wordCount = document.querySelector("#word-count");
const clearBtn = document.querySelector("#clear-btn");
const themeToggle = document.querySelector("#theme-toggle");

function updateCounts() {
  const text = noteText.value;
  const characterCount = text.length;

  const trimmedText = text.trim();
  const words = trimmedText === "" ? [] : trimmedText.split(/\s+/);
  const numberOfWords = words.length;

  charCount.textContent = `${characterCount} / 200 characters`;
  wordCount.textContent = `${numberOfWords} words`;

  charCount.classList.remove("warning", "over");

  if (characterCount > 200) {
    charCount.classList.add("over");
  } else if (characterCount > 180) {
    charCount.classList.add("warning");
  }
}
const STORAGE_KEY = "day4-draft";

noteText.addEventListener("input", () => {
  updateCounts();
  localStorage.setItem(STORAGE_KEY, noteText.value);
});
const savedDraft = localStorage.getItem(STORAGE_KEY);

if (savedDraft !== null) {
  noteText.value = savedDraft;
}

const savedTheme = localStorage.getItem("day4-theme");

if (savedTheme === "dark") {
  document.body.classList.add("dark");
  themeToggle.textContent = "Light mode";
}

updateCounts();
function clearNote() {
  noteText.value = "";
  localStorage.removeItem(STORAGE_KEY);
  updateCounts();
}

clearBtn.addEventListener("click", clearNote);

noteText.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    clearNote();
  }
});
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");

  const isDark = document.body.classList.contains("dark");

  if (isDark) {
    themeToggle.textContent = "Light mode";
    localStorage.setItem("day4-theme", "dark");
  } else {
    themeToggle.textContent = "Dark mode";
    localStorage.setItem("day4-theme", "light");
  }
});