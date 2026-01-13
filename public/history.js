/*************************************************
 * ELEMENTS
 *************************************************/
const historyList = document.getElementById("historyList");
const undoContainer = document.getElementById("undoContainer");

/*************************************************
 * LOCAL STORAGE KEYS
 *************************************************/
const HIDDEN_KEY = "hiddenNutritionRecords";
const UNDO_KEY = "lastDeletedRecord";

/*************************************************
 * LOAD HISTORY
 *************************************************/
document.addEventListener("DOMContentLoaded", loadHistory);

async function loadHistory() {
  historyList.innerHTML = `<p class="loading">Loading records...</p>`;

  try {
    const res = await fetch("/nutrition");
    if (!res.ok) throw new Error("Failed to fetch records");

    let data = await res.json();

    const hiddenIds = JSON.parse(localStorage.getItem(HIDDEN_KEY)) || [];

    // Filter hidden records (local-only delete)
    data = data.filter(r => !hiddenIds.includes(r.id));

    if (data.length === 0) {
      historyList.innerHTML = `<p class="empty">No nutrition records found</p>`;
      return;
    }

    historyList.innerHTML = "";

    data.forEach(record => renderCard(record));
  } catch (err) {
    console.error(err);
    historyList.innerHTML = `<p class="error">Failed to load history ❌</p>`;
  }
}

/*************************************************
 * RENDER CARD
 *************************************************/
function renderCard(record) {
  const card = document.createElement("div");
  card.className = "history-card";
  card.dataset.id = record.id;

  card.innerHTML = `
    <div class="card-header">
      <strong>${record.name}</strong>
      <span>${new Date(record.created_at).toLocaleDateString()}</span>
    </div>

    <div class="card-body">
      <p><b>Gender:</b> ${record.gender}</p>
      <p><b>Age:</b> ${record.age}</p>
      <p><b>BMI:</b> ${record.bmi} (${record.category})</p>
      <p><b>Energy:</b> ${record.energy} kcal/day</p>
    </div>

    <button class="delete-btn">Delete</button>
  `;

  card.querySelector(".delete-btn").addEventListener("click", () =>
    deleteWithUndo(record)
  );

  historyList.appendChild(card);
}

/*************************************************
 * DELETE WITH UNDO (LOCAL ONLY)
 *************************************************/
function deleteWithUndo(record) {
  // Save for undo
  localStorage.setItem(UNDO_KEY, JSON.stringify(record));

  // Hide record locally
  const hidden = JSON.parse(localStorage.getItem(HIDDEN_KEY)) || [];
  hidden.push(record.id);
  localStorage.setItem(HIDDEN_KEY, JSON.stringify(hidden));

  // Remove from UI
  document.querySelector(`[data-id="${record.id}"]`)?.remove();

  showUndo();
}

/*************************************************
 * UNDO UI
 *************************************************/
function showUndo() {
  undoContainer.innerHTML = `
    <div class="undo-banner">
      Record deleted
      <button id="undoBtn">Undo</button>
    </div>
  `;

  document.getElementById("undoBtn").onclick = undoDelete;

  // Auto-dismiss after 6 seconds
  setTimeout(() => (undoContainer.innerHTML = ""), 6000);
}

/*************************************************
 * UNDO DELETE
 *************************************************/
function undoDelete() {
  const record = JSON.parse(localStorage.getItem(UNDO_KEY));
  if (!record) return;

  let hidden = JSON.parse(localStorage.getItem(HIDDEN_KEY)) || [];
  hidden = hidden.filter(id => id !== record.id);
  localStorage.setItem(HIDDEN_KEY, JSON.stringify(hidden));

  localStorage.removeItem(UNDO_KEY);
  undoContainer.innerHTML = "";

  renderCard(record);
}

