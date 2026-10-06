const taskform = document.getElementById("taskform");
const judulInput = document.getElementById("judul");
const matkulInput = document.getElementById("matkul");
const deadlineInput = document.getElementById("deadline");
const formerror = document.getElementById("formerror");
const tasklist = document.getElementById("tasklist");

const task = [];

function render() {
    tasklist.innerHTML = "";

    task.forEach((item) => {
        const listItem = document.createElement("li");
        listItem.textContent = `${item.judul} - ${item.matkul} - ${item.deadline}`;
        tasklist.appendChild(listItem);
    });
}

render();

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
