const tasklist = document.getElementById("tasklist");
const filterButtons = document.querySelectorAll("[data-filter]");
const loadstate = document.getElementById("loadstate");
const retryButton = document.getElementById("retry");
const taskcount = document.getElementById("taskcount");

let task = [];
let currentFilter = "semua";

function render() {
    tasklist.innerHTML = "";

    if (loadstate.dataset.state === "loading" || loadstate.dataset.state === "error") {
        taskcount.textContent = "";
        return;
    }

    taskcount.textContent = `${task.filter((item) => !item.selesai).length} tugas aktif`;

    const visibleTasks = task.filter((item) => {
        if (currentFilter === "aktif") {
            return !item.selesai;
        }
        if (currentFilter === "selesai") {
            return item.selesai;
        }
        return true;
    });

    filterButtons.forEach((button) => {
        const isActive = button.dataset.filter === currentFilter;
        button.classList.toggle("on", isActive);
        button.setAttribute("aria-pressed", String(isActive));
    });

    visibleTasks.forEach((item) => {
        const listItem = document.createElement("li");
        listItem.dataset.id = item.id;

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = item.selesai;
        checkbox.disabled = true;
        checkbox.setAttribute("aria-label", `Status ${item.judul}`);

        const details = document.createElement("span");
        details.classList.add("task-details");

        const title = document.createElement("span");
        title.textContent = item.judul;
        if (item.selesai) {
            title.classList.add("completed");
        }

        const metadata = document.createElement("small");
        metadata.textContent = `${item.matkul} - deadline ${item.deadline}`;
        details.append(title, metadata);

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Hapus";
        deleteButton.disabled = true;
        deleteButton.setAttribute("aria-label", `Hapus ${item.judul}`);

        listItem.append(checkbox, details, deleteButton);
        tasklist.appendChild(listItem);
    });

    if (visibleTasks.length === 0) {
        const emptyMessage = document.createElement("li");
        emptyMessage.textContent = task.length === 0
            ? "Belum ada tugas."
            : "Tidak ada tugas sesuai filter.";
        tasklist.appendChild(emptyMessage);
    }
}

async function api(path) {
    const response = await fetch(path);
    let result;

    try {
        result = await response.json();
    } catch {
        if (!response.ok) {
            throw new Error(`Gagal memuat tugas (HTTP ${response.status}).`);
        }
        throw new Error("Respons server bukan JSON yang valid.");
    }

    if (!response.ok) {
        const serverMessage = result && (result.message || result.error);
        throw new Error(
            typeof serverMessage === "string"
                ? serverMessage
                : `Gagal memuat tugas (HTTP ${response.status}).`
        );
    }

    return result;
}

async function loadTasks() {
    loadstate.dataset.state = "loading";
    loadstate.textContent = "Memuat tugas...";
    retryButton.hidden = true;
    render();

    try {
        const result = await api("/api/tugas");
        const validTasks = Array.isArray(result) && result.every((item) =>
            item &&
            typeof item === "object" &&
            item.id !== undefined &&
            typeof item.judul === "string" &&
            typeof item.matkul === "string" &&
            typeof item.deadline === "string" &&
            typeof item.selesai === "boolean"
        );
        if (!validTasks) {
            throw new Error("Format data tugas dari server tidak valid.");
        }

        task = result;
        loadstate.dataset.state = "loaded";
        loadstate.textContent = "";
    } catch (error) {
        loadstate.dataset.state = "error";
        loadstate.textContent = `Gagal memuat tugas: ${error.message}`;
        retryButton.hidden = false;
    }
    render();
}

filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
        currentFilter = button.dataset.filter;
        render();
    });
});

retryButton.addEventListener("click", loadTasks);

loadTasks();
