import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCC_Y2-Kpkqyi0bDdKOvOqPkcOcZddaORg",
  authDomain: "sidmadina-techgroup.firebaseapp.com",
  projectId: "sidmadina-techgroup",
  storageBucket: "sidmadina-techgroup.firebasestorage.app",
  messagingSenderId: "650996193010",
  appId: "1:650996193010:web:d131758387f7011fca226b",
  measurementId: "G-CN4DS10MNE"
};

const body = document.body;
const toggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
const themeText = document.getElementById("themeText");
const form = document.getElementById("contactForm");
const formStatus = document.getElementById("formStatus");

const savedTheme = localStorage.getItem("sidmadina-theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
const initialTheme = savedTheme || (prefersDark ? "dark" : "light");

function applyTheme(theme) {
  if (theme === "light") {
    body.classList.add("light-mode");
    themeIcon.className = "fa-solid fa-moon";
    themeText.textContent = "Dark mode";
  } else {
    body.classList.remove("light-mode");
    themeIcon.className = "fa-solid fa-sun";
    themeText.textContent = "Light mode";
  }
  localStorage.setItem("sidmadina-theme", theme);
}

applyTheme(initialTheme);

toggle?.addEventListener("click", () => {
  const nextTheme = body.classList.contains("light-mode") ? "dark" : "light";
  applyTheme(nextTheme);
});

function firebaseConfigIsReady() {
  return Object.values(firebaseConfig).every(
    (value) => typeof value === "string" && value.trim() !== "" && !value.includes("PASTE_YOUR")
  );
}

let db = null;

if (firebaseConfigIsReady()) {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} else {
  console.warn("Firebase config is still placeholder text. Add your real Firebase config in script.js.");
}

function setStatus(message, type = "") {
  formStatus.textContent = message;
  formStatus.className = `form-status ${type}`.trim();
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const submitButton = form.querySelector("button[type='submit']");
  const formData = new FormData(form);
  const payload = {
    name: String(formData.get("name") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    service: String(formData.get("service") || "").trim(),
    message: String(formData.get("message") || "").trim(),
    createdAt: serverTimestamp(),
  };

  if (!payload.name || !payload.email || !payload.message) {
    setStatus("Please fill in your name, email, and project details.", "error");
    return;
  }

  if (!db) {
    setStatus("Firebase is not configured yet. Add your Firebase config in script.js first.", "error");
    return;
  }

  try {
    submitButton.disabled = true;
    submitButton.textContent = "Sending...";
    setStatus("Submitting your inquiry...", "");

    await addDoc(collection(db, "inquiries"), payload);

    setStatus("Your inquiry has been sent successfully.", "success");
    form.reset();
  } catch (error) {
    console.error("Error saving inquiry:", error);
    setStatus("Something went wrong while sending your inquiry. Please try again.", "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Send Inquiry";
  }
});

function runChecks() {
  console.assert(document.getElementById("themeToggle"), "Theme toggle button should exist");
  console.assert(document.getElementById("contactForm"), "Contact form should exist");
  console.assert(document.getElementById("formStatus"), "Form status element should exist");
  console.assert(toggle, "Toggle reference should be available");
  console.assert(form, "Form reference should be available");
}

runChecks();
