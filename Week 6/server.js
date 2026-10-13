const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const databasePath = path.join(__dirname, "db.json");
const port = 3000;

function readTasks() {
    const database = JSON.parse(fs.readFileSync(databasePath, "utf8"));
    if (!Array.isArray(database.tugas)) {
        throw new Error('Database must contain a "tugas" array.');
    }
    return database.tugas;
}

let tasks = readTasks();

function sendJson(response, statusCode, data) {
    response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify(data));
}

function readRequestBody(request) {
    return new Promise((resolve, reject) => {
        let body = "";
        request.setEncoding("utf8");
        request.on("data", (chunk) => {
            body += chunk;
        });
        request.on("end", () => {
            try {
                resolve(JSON.parse(body));
            } catch {
                reject(new Error("Request body must be valid JSON."));
            }
        });
        request.on("error", reject);
    });
}

const server = http.createServer(async (request, response) => {
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (request.method === "OPTIONS") {
        response.writeHead(204);
        response.end();
        return;
    }

    const url = new URL(request.url, `http://${request.headers.host}`);
    const collectionPath = url.pathname === "/tugas";
    const taskMatch = url.pathname.match(/^\/tugas\/(\d+)$/);

    try {
        if (collectionPath && request.method === "GET") {
            sendJson(response, 200, tasks);
            return;
        }

        if (collectionPath && request.method === "POST") {
            const body = await readRequestBody(request);
            if (
                typeof body.judul !== "string" ||
                typeof body.matkul !== "string" ||
                typeof body.deadline !== "string"
            ) {
                sendJson(response, 400, { message: "Judul, mata kuliah, dan deadline wajib diisi." });
                return;
            }

            const nextId = tasks.reduce((highestId, item) => Math.max(highestId, Number(item.id) || 0), 0) + 1;
            const newTask = {
                id: nextId,
                judul: body.judul,
                matkul: body.matkul,
                deadline: body.deadline,
                selesai: false
            };
            tasks.push(newTask);
            sendJson(response, 201, newTask);
            return;
        }

        if (taskMatch && request.method === "PATCH") {
            const body = await readRequestBody(request);
            if (typeof body.selesai !== "boolean") {
                sendJson(response, 400, { message: "Status selesai harus berupa boolean." });
                return;
            }

            const task = tasks.find((item) => String(item.id) === taskMatch[1]);
            if (!task) {
                sendJson(response, 404, { message: "Tugas tidak ditemukan." });
                return;
            }

            task.selesai = body.selesai;
            sendJson(response, 200, task);
            return;
        }

        if (taskMatch && request.method === "DELETE") {
            const remainingTasks = tasks.filter((item) => String(item.id) !== taskMatch[1]);
            if (remainingTasks.length === tasks.length) {
                sendJson(response, 404, { message: "Tugas tidak ditemukan." });
                return;
            }

            tasks = remainingTasks;
            response.writeHead(204);
            response.end();
            return;
        }

        sendJson(response, 404, { message: "Endpoint tidak ditemukan." });
    } catch (error) {
        console.error(error);
        if (!response.headersSent) {
            sendJson(response, 500, { message: "Terjadi kesalahan saat memproses permintaan API." });
        } else {
            response.destroy();
        }
    }
});

server.listen(port, () => {
    console.log(`Mock API berjalan di http://localhost:${port}`);
    console.log(`Endpoint tugas: http://localhost:${port}/tugas`);
});
