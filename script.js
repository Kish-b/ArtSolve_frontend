document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("drawingCanvas");
    const ctx = canvas.getContext("2d");
    let drawing = false;
    let history = []; // Store canvas states

    // Set up drawing properties
    ctx.strokeStyle = "white";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";

    // Save the current state before drawing
    function saveState() {
        history.push(canvas.toDataURL()); // Save the canvas as an image
    }

    // Start drawing
    canvas.addEventListener("mousedown", (e) => {
        saveState();
        drawing = true;
        ctx.beginPath();
        ctx.moveTo(e.offsetX, e.offsetY);
    });

    canvas.addEventListener("mousemove", (e) => {
        if (!drawing) return;
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
    });

    canvas.addEventListener("mouseup", () => drawing = false);
    canvas.addEventListener("mouseout", () => drawing = false);

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

    // Run analysis
    document.getElementById("runButton").addEventListener("click", () => {
        canvas.toBlob(async (blob) => {
            if (!blob) return;

            const formData = new FormData();
            formData.append("file", blob, "drawing.png");

            try {
                const response = await fetch("https://artsolve-backend.onrender.com", {
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
