const taskform = document.getElementById("taskform");
const judulInput = document.getElementById("judul");
const matkulInput = document.getElementById("matkul");
const deadlineInput = document.getElementById("deadline");
const formerror = document.getElementById("formerror");
const submitButton = taskform.querySelector('button[type="submit"]');
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

async function api(path, options) {
    let response;
    try {
        response = await fetch(path, options);
    } catch {
        throw new Error("Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.");
    }

    const responseText = await response.text();
    let result = null;

    if (responseText) {
        try {
            result = JSON.parse(responseText);
        } catch {
            if (response.ok) {
                throw new Error("Respons server bukan JSON yang valid.");
            }
            if (response.headers.get("content-type")?.includes("text/plain")) {
                result = responseText.trim();
            }
        }
    }

    if (!response.ok) {
        const serverMessage = typeof result === "string"
            ? result
            : result && (result.message || result.error || result.detail);
        throw new Error(
            typeof serverMessage === "string" && serverMessage
                ? serverMessage
                : `Permintaan gagal (HTTP ${response.status}).`
        );
    }

    return result;
}

function isTask(item) {
    return item &&
        typeof item === "object" &&
        item.id !== undefined &&
        typeof item.judul === "string" &&
        typeof item.matkul === "string" &&
        typeof item.deadline === "string" &&
        typeof item.selesai === "boolean";
}

async function loadTasks() {
    loadstate.dataset.state = "loading";
    loadstate.textContent = "Memuat tugas...";
    retryButton.hidden = true;
    render();

    try {
        const result = await api("/api/tugas");
        const validTasks = Array.isArray(result) && result.every(isTask);
        if (!validTasks) {
            throw new Error("Format data tugas dari server tidak valid.");
        }

        task = result;
        loadstate.dataset.state = "loaded";
        loadstate.textContent = "";
        submitButton.disabled = false;
    } catch (error) {
        loadstate.dataset.state = "error";
        loadstate.textContent = `Gagal memuat tugas: ${error.message}`;
        retryButton.hidden = false;
        submitButton.disabled = true;
    }
    render();
}

taskform.addEventListener("submit", async (event) => {
    event.preventDefault();

    const judul = judulInput.value.trim();
    const matkul = matkulInput.value;
    const deadline = deadlineInput.value;

    if (judul.length < 3) {
        formerror.textContent = "Judul tugas harus terdiri dari minimal 3 karakter.";
        return;
    }

    if (!matkul || !deadline) {
        formerror.textContent = "Mata kuliah dan deadline wajib dipilih.";
        return;
    }

    submitButton.disabled = true;
    formerror.textContent = "";

    try {
        const createdTask = await api("/api/tugas", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ judul, matkul, deadline })
        });

        if (!isTask(createdTask)) {
            throw new Error("Format tugas dari server tidak valid.");
        }

        task.push(createdTask);
        taskform.reset();
        render();
    } catch (error) {
        formerror.textContent = `Gagal menambahkan tugas: ${error.message}`;
    } finally {
        submitButton.disabled = loadstate.dataset.state !== "loaded";
    }
});

tasklist.addEventListener("change", async (event) => {
    if (!(event.target instanceof HTMLInputElement) || event.target.type !== "checkbox") {
        return;
    }

    const listItem = event.target.closest("li[data-id]");
    const taskItem = task.find((item) => String(item.id) === listItem?.dataset.id);
    if (!taskItem) {
        return;
    }

    const checkbox = event.target;
    const nextStatus = checkbox.checked;
    checkbox.disabled = true;
    formerror.textContent = "";

    try {
        const updatedTask = await api(`/api/tugas/${encodeURIComponent(taskItem.id)}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ selesai: nextStatus })
        });

        if (updatedTask !== null && !isTask(updatedTask)) {
            throw new Error("Format tugas dari server tidak valid.");
        }

        Object.assign(taskItem, updatedTask || { selesai: nextStatus });
        render();
    } catch (error) {
        formerror.textContent = `Gagal memperbarui tugas: ${error.message}`;
        render();
    }
});

tasklist.addEventListener("click", async (event) => {
    if (!(event.target instanceof HTMLButtonElement)) {
        return;
    }

    const listItem = event.target.closest("li[data-id]");
    const taskItem = task.find((item) => String(item.id) === listItem?.dataset.id);
    if (!taskItem) {
        return;
    }

    const deleteButton = event.target;
    const checkbox = listItem.querySelector('input[type="checkbox"]');
    deleteButton.disabled = true;
    checkbox.disabled = true;
    formerror.textContent = "";

    try {
        await api(`/api/tugas/${encodeURIComponent(taskItem.id)}`, {
            method: "DELETE"
        });

        task = task.filter((item) => item !== taskItem);
        render();
    } catch (error) {
        formerror.textContent = `Gagal menghapus tugas: ${error.message}`;
        render();
    }
});

filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
        currentFilter = button.dataset.filter;
        render();
    });
});

retryButton.addEventListener("click", loadTasks);

loadTasks();
