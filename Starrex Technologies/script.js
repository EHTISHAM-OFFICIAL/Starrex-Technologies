/* STARREX ANIMATED 3D WIREFRAME */

const canvas = document.getElementById("wireframe");
const ctx = canvas.getContext("2d");

let width, height;
let time = 0;

function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function drawWireframe() {

    ctx.clearRect(0, 0, width, height);

    const spacing = 35;
    const rows = 24;
    const cols = Math.ceil(width / spacing) + 4;

    const points = [];

    for (let y = 0; y <= rows; y++) {

        points[y] = [];

        for (let x = 0; x <= cols; x++) {

            const px = (x - 2) * spacing;
            const py = (y - rows / 2) * spacing;

            const wave =
                Math.sin(px * 0.008 + time) * 35 +
                Math.cos(py * 0.018 + time) * 20 +
                Math.sin((px + py) * 0.012 + time) * 15;

            const perspective = 0.75 + (y / rows) * 0.5;

            points[y][x] = {
                x: width / 2 + (px - width / 2) * perspective,
                y: height / 2 + py * perspective + wave
            };
        }
    }

    ctx.lineWidth = 0.8;

    for (let y = 0; y <= rows; y++) {

        for (let x = 0; x <= cols; x++) {

            const point = points[y][x];

            ctx.beginPath();
            ctx.strokeStyle = "rgba(65, 115, 165, 0.35)";

            if (x < cols) {
                ctx.moveTo(point.x, point.y);
                ctx.lineTo(points[y][x + 1].x, points[y][x + 1].y);
            }

            if (y < rows) {
                ctx.moveTo(point.x, point.y);
                ctx.lineTo(points[y + 1][x].x, points[y + 1][x].y);
            }

            ctx.stroke();
        }
    }

    time += 0.008;

    requestAnimationFrame(drawWireframe);
}

drawWireframe();