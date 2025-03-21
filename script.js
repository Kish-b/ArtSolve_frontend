document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("drawingCanvas");
    const ctx = canvas.getContext("2d");
    let drawing = false;
    let history = []; // Stores previous canvas states

    ctx.strokeStyle = "white";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";

    // Save the current state before drawing
    function saveState() {
        history.push(canvas.toDataURL()); // Save canvas as an image
        if (history.length > 10) history.shift(); // Keep history manageable
    }

    // Get coordinates for mouse or touch
    function getCoordinates(event) {
        if (event.touches) {
            return {
                x: event.touches[0].clientX - canvas.offsetLeft,
                y: event.touches[0].clientY - canvas.offsetTop
            };
        }
        return { x: event.offsetX, y: event.offsetY };
    }

    // Start drawing (Mouse & Touch)
    function startDrawing(event) {
        event.preventDefault();
        saveState();
        drawing = true;
        const { x, y } = getCoordinates(event);
        ctx.beginPath();
        ctx.moveTo(x, y);
    }

    // Draw (Mouse & Touch)
    function draw(event) {
        if (!drawing) return;
        event.preventDefault();
        const { x, y } = getCoordinates(event);
        ctx.lineTo(x, y);
        ctx.stroke();
    }

    // Stop drawing
    function stopDrawing() {
        drawing = false;
    }

    // Add event listeners for both mouse and touch
    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseout", stopDrawing);

    canvas.addEventListener("touchstart", startDrawing);
    canvas.addEventListener("touchmove", draw);
    canvas.addEventListener("touchend", stopDrawing);
    canvas.addEventListener("touchcancel", stopDrawing);

    // Undo last action
    document.getElementById("undoButton").addEventListener("click", () => {
        if (history.length > 0) {
            let previousState = history.pop();
            let img = new Image();
            img.src = previousState;
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            };
        }
    });

    // Reset canvas
    document.getElementById("resetButton").addEventListener("click", () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        history = []; // Clear history
        document.getElementById("resultText").textContent = "No result yet";
    });

    // Run AI analysis
    document.getElementById("runButton").addEventListener("click", () => {
        canvas.toBlob(async (blob) => {
            if (!blob) return;

            const formData = new FormData();
            formData.append("file", blob, "drawing.png");

            try {
                const response = await fetch("https://artsolve-backend.onrender.com/analyze/", {
                    method: "POST",
                    body: formData,
                    headers: { "Accept": "application/json" }
                });

                const data = await response.json();
                document.getElementById("resultText").textContent = data.result || "Error processing";
            } catch (error) {
                console.error("❌ Error:", error);
                document.getElementById("resultText").textContent = "Error communicating with AI";
            }
        }, "image/png");
    });
});
