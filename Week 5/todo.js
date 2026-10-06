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
