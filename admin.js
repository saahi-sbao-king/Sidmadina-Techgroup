import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const body = document.body;
const toggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
const themeText = document.getElementById("themeText");
const loginForm = document.getElementById("adminLoginForm");
const authStatus = document.getElementById("adminAuthStatus");
const inquiriesContainer = document.getElementById("inquiriesContainer");
const guardNotice = document.getElementById("adminGuardNotice");
const refreshButton = document.getElementById("refreshInquiries");
const logoutButton = document.getElementById("logoutButton");
const totalInquiries = document.getElementById("totalInquiries");
const latestService = document.getElementById("latestService");
const lastSubmission = document.getElementById("lastSubmission");
const dashboardStatusText = document.getElementById("dashboardStatusText");

const savedTheme = localStorage.getItem("sidmadina-theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
const initialTheme = savedTheme || (prefersDark ? "dark" : "light");

function applyTheme(theme) {
  if (theme === "light") {
    body.classList.add("light-mode");
    if (themeIcon) themeIcon.className = "fa-solid fa-moon";
    if (themeText) themeText.textContent = "Dark mode";
  } else {
    body.classList.remove("light-mode");
    if (themeIcon) themeIcon.className = "fa-solid fa-sun";
    if (themeText) themeText.textContent = "Light mode";
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

let auth = null;
let db = null;

function setAuthStatus(message, type = "") {
  if (!authStatus) return;
  authStatus.textContent = message;
  authStatus.className = `form-status ${type}`.trim();
}

function formatDate(timestamp) {
  if (!timestamp || !timestamp.toDate) return "—";
  return timestamp.toDate().toLocaleString();
}

function renderInquiryCard(inquiry) {
  const card = document.createElement("article");
  card.className = "inquiry-card";
  card.innerHTML = `
    <h4>${inquiry.name || "Unnamed Client"}</h4>
    <div class="inquiry-meta">${inquiry.email || "No email"}</div>
    <div class="inquiry-meta">Phone: ${inquiry.phone || "—"}</div>
    <div class="inquiry-meta">Service: ${inquiry.service || "—"}</div>
    <div class="inquiry-meta">Submitted: ${formatDate(inquiry.createdAt)}</div>
    <p class="message">${inquiry.message || "No message provided."}</p>
  `;
  return card;
}

async function loadInquiries() {
  if (!db || !inquiriesContainer) return;

  inquiriesContainer.innerHTML = "";
  const inquiriesQuery = query(collection(db, "inquiries"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(inquiriesQuery);
  const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  if (totalInquiries) totalInquiries.textContent = String(items.length);
  if (latestService) latestService.textContent = items[0]?.service || "—";
  if (lastSubmission) {
    lastSubmission.textContent = items[0]?.createdAt?.toDate
      ? items[0].createdAt.toDate().toLocaleDateString()
      : "—";
  }

  if (items.length === 0) {
    inquiriesContainer.innerHTML = '<div class="admin-guard-notice">No inquiries found yet.</div>';
    return;
  }

  items.forEach((item) => inquiriesContainer.appendChild(renderInquiryCard(item)));
}

if (firebaseConfigIsReady()) {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} else {
  setAuthStatus("Firebase is not configured yet. Add your Firebase config in firebase-config.js.", "error");
}

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!auth) {
    setAuthStatus("Firebase Auth is not configured yet.", "error");
    return;
  }

  const formData = new FormData(loginForm);
  const email = String(formData.get("adminEmail") || "").trim();
  const password = String(formData.get("adminPassword") || "");

  if (!email || !password) {
    setAuthStatus("Please enter your admin email and password.", "error");
    return;
  }

  try {
    setAuthStatus("Signing in...", "");
    await signInWithEmailAndPassword(auth, email, password);
    setAuthStatus("Signed in successfully.", "success");
    loginForm.reset();
  } catch (error) {
    console.error(error);
    setAuthStatus("Login failed. Check your credentials and Firebase Auth setup.", "error");
  }
});

refreshButton?.addEventListener("click", async () => {
  try {
    await loadInquiries();
    setAuthStatus("Inquiry list refreshed.", "success");
  } catch (error) {
    console.error(error);
    setAuthStatus("Could not refresh inquiries.", "error");
  }
});

logoutButton?.addEventListener("click", async () => {
  if (!auth) return;
  await signOut(auth);
});

if (auth) {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      if (guardNotice) guardNotice.style.display = "none";
      if (refreshButton) refreshButton.disabled = false;
      if (logoutButton) logoutButton.disabled = false;
      if (dashboardStatusText) dashboardStatusText.textContent = "Signed In";
      await loadInquiries();
    } else {
      if (guardNotice) guardNotice.style.display = "block";
      if (inquiriesContainer) inquiriesContainer.innerHTML = "";
      if (totalInquiries) totalInquiries.textContent = "0";
      if (latestService) latestService.textContent = "—";
      if (lastSubmission) lastSubmission.textContent = "—";
      if (refreshButton) refreshButton.disabled = true;
      if (logoutButton) logoutButton.disabled = true;
      if (dashboardStatusText) dashboardStatusText.textContent = "Signed Out";
    }
  });
}

console.assert(document.getElementById("adminLoginForm"), "Admin login form should exist");
console.assert(document.getElementById("inquiriesContainer"), "Inquiries container should exist");
console.assert(document.getElementById("refreshInquiries"), "Refresh button should exist");
console.assert(document.getElementById("logoutButton"), "Logout button should exist");
console.assert(typeof loadInquiries === "function", "loadInquiries should exist");
