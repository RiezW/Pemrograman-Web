const taskform = document.getElementById("taskform");
const judulInput = document.getElementById("judul");
const matkulInput = document.getElementById("matkul");
const deadlineInput = document.getElementById("deadline");
const formerror = document.getElementById("formerror");
const tasklist = document.getElementById("tasklist");
const filterButtons = document.querySelectorAll("[data-filter]");

const task = [];
let currentFilter = "semua";

function render() {
    tasklist.innerHTML = "";

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
        checkbox.dataset.action = "toggle";
        checkbox.setAttribute("aria-label", `Tandai ${item.judul} selesai`);

        const taskText = document.createElement("span");
        taskText.textContent = `${item.judul} - ${item.matkul} - ${item.deadline}`;
        if (item.selesai) {
            taskText.classList.add("completed");
        }

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Hapus";
        deleteButton.dataset.action = "delete";
        deleteButton.setAttribute("aria-label", `Hapus ${item.judul}`);

        listItem.append(checkbox, taskText, deleteButton);
        tasklist.appendChild(listItem);
    });
}

render();

filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
        currentFilter = button.dataset.filter;
        render();
    });
});

taskform.addEventListener("submit", (event) => {
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

    formerror.textContent = "";
    task.push({
        id: Date.now(),
        judul,
        matkul,
        deadline,
        selesai: false
    });
    render();
    taskform.reset();
});

tasklist.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) {
        return;
    }

    const control = event.target.closest("[data-action]");
    const listItem = control?.closest("li");
    if (!control || !listItem) {
        return;
    }

    const taskItem = task.find((item) => String(item.id) === listItem.dataset.id);
    if (!taskItem) {
        return;
    }

    if (control.dataset.action === "toggle" && control instanceof HTMLInputElement) {
        taskItem.selesai = control.checked;
    } else if (control.dataset.action === "delete") {
        task.splice(task.indexOf(taskItem), 1);
    }

    render();
});
