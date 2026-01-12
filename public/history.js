/*document.addEventListener("DOMContentLoaded", async () => {
  const historyList = document.getElementById("historyList");

  if (!historyList) {
    console.error("❌ historyList element not found");
    return;
  }

  historyList.innerHTML = "<p>Loading records...</p>";

  try {
    const res = await fetch("/nutrition");

    if (!res.ok) {
      throw new Error(`Server error: ${res.status}`);
    }

    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      historyList.innerHTML = "<p>No nutrition records found</p>";
      return;
    }

    historyList.innerHTML = "";

    data.forEach(r => {
      const div = document.createElement("div");
      div.className = "history-card";

      div.innerHTML = `
        <p><b>Name:</b> ${r.name}</p>
        <p><b>Gender:</b> ${r.gender}</p>
        <p><b>Age:</b> ${r.age}</p>
        <p><b>Weight:</b> ${r.weight} kg</p>
        <p><b>Height:</b> ${r.height} cm</p>
        <p><b>BMI:</b> ${r.bmi} (${r.category})</p>
        ${r.ideal_weight ? `<p><b>Ideal:</b> ${r.ideal_weight} kg</p>` : ""}
        <p><b>Energy:</b> ${r.energy} kcal/day</p>
        <small>${new Date(r.created_at).toLocaleString()}</small>
      `;

      historyList.appendChild(div);
    });

  } catch (err) {
    console.error("❌ History load failed:", err);
    historyList.innerHTML = "<p>Failed to load history ❌</p>";
  }
});*/































const historyList = document.getElementById("historyList");
const dateFilter = document.getElementById("dateFilter");

let allRecords = [];

/*************************************************
 * LOAD HISTORY
 *************************************************/
document.addEventListener("DOMContentLoaded", loadHistory);

async function loadHistory() {
  historyList.innerHTML = `<p class="loading">Loading records...</p>`;

  try {
    const res = await fetch("/nutrition");
    if (!res.ok) throw new Error("Fetch failed");

    allRecords = await res.json();

    if (allRecords.length === 0) {
      historyList.innerHTML = `<p class="empty">No records found</p>`;
      return;
    }

    renderRecords(allRecords);

  } catch (err) {
    console.error(err);
    historyList.innerHTML = `<p class="error">Failed to load history ❌</p>`;
  }
}

/*************************************************
 * RENDER RECORDS
 *************************************************/
function renderRecords(records) {
  historyList.innerHTML = "";

  records.forEach(record => {
    const card = document.createElement("div");
    card.className = "history-card";

    card.innerHTML = `
      <div class="card-header">
        <span>${record.name}</span>
        <span>${new Date(record.created_at).toLocaleDateString()}</span>
      </div>

      <div class="card-body">
        <p><b>Gender:</b> ${record.gender}</p>
        <p><b>Age:</b> ${record.age}</p>
        <p><b>Weight:</b> ${record.weight} kg</p>
        <p><b>Height:</b> ${record.height} cm</p>
        <p><b>BMI:</b> ${record.bmi} (${record.category})</p>
        <p><b>Energy:</b> ${record.energy} kcal/day</p>

        <button class="delete-btn" data-id="${record.id}">
          Delete
        </button>
      </div>
    `;

    historyList.appendChild(card);
  });

  attachDeleteHandlers();
}

/*************************************************
 * DATE FILTER
 *************************************************/
dateFilter.addEventListener("change", () => {
  const selectedDate = dateFilter.value;

  if (!selectedDate) {
    renderRecords(allRecords);
    return;
  }

  const filtered = allRecords.filter(r =>
    r.created_at.startsWith(selectedDate)
  );

  renderRecords(filtered);
});

/*************************************************
 * DELETE RECORD
 *************************************************/
function attachDeleteHandlers() {
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;

      if (!confirm("Delete this record?")) return;

      try {
        const res = await fetch(`/nutrition/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Delete failed");

        allRecords = allRecords.filter(r => r.id != id);
        renderRecords(allRecords);

      } catch (err) {
        alert("Failed to delete record ❌");
      }
    });
  });
}

