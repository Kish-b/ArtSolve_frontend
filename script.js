document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("drawingCanvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    let drawing = false;
    let history = [];
    let currentTool = 'pen';
    let currentColor = "#ffffff";
    
    function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        
        if (history.length > 0) {
            redrawCanvas();
        }
    }

    function redrawCanvas() {
        if (history.length > 0) {
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            };
            img.src = history[history.length - 1];
        }
    }

    resizeCanvas();
    ctx.imageSmoothingEnabled = false;
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = parseInt(document.getElementById("brushSize").value);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const brushSizeSlider = document.getElementById("brushSize");
    const brushSizeValue = document.getElementById("brushSizeValue");
    const eraserSizeSlider = document.getElementById("eraserSize");
    const eraserSizeValue = document.getElementById("eraserSizeValue");
    const resultText = document.getElementById("resultText");
    
    const cursor = document.createElement("div");
    cursor.className = "cursor pen-cursor white";
    document.body.appendChild(cursor);

    // Create overlay for closing panels
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    document.body.appendChild(overlay);

    // Get control elements
    const penControls = document.querySelector('.pen-controls');
    const eraserControls = document.querySelector('.eraser-controls');
    const colorPalette = document.querySelector('.color-palette');
    const penButton = document.getElementById("penButton");
    const eraserButton = document.getElementById("eraserButton");
    const colorButton = document.getElementById("colorButton");

    brushSizeValue.textContent = brushSizeSlider.value;
    eraserSizeValue.textContent = eraserSizeSlider.value;
    
    brushSizeSlider.addEventListener("input", () => {
        const size = brushSizeSlider.value;
        brushSizeValue.textContent = size;
        if (currentTool === 'pen') {
            ctx.lineWidth = size;
        }
        updateCursor();
    });
    
    eraserSizeSlider.addEventListener("input", () => {
        const size = eraserSizeSlider.value;
        eraserSizeValue.textContent = size;
        if (currentTool === 'eraser') {
            ctx.lineWidth = size;
        }
        updateCursor();
    });
    
    function updateCursor() {
        const size = ctx.lineWidth;
        cursor.style.width = `${size}px`;
        cursor.style.height = `${size}px`;
        
        if (currentTool === 'pen') {
            cursor.className = `cursor pen-cursor ${getActiveColorClass()}`;
        } else {
            cursor.className = "cursor eraser-cursor";
        }
    }
    
    function getActiveColorClass() {
        const activeColor = document.querySelector(".color-option.active");
        return activeColor ? activeColor.classList[1] : "white";
    }
    
    function saveState() {
        history.push(canvas.toDataURL());
        if (history.length > 20) history.shift();
    }
    
    function getCoordinates(event) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }
    
    function updateCursorPosition(event) {
        const { x, y } = getCoordinates(event);
        cursor.style.left = `${x + canvas.offsetLeft}px`;
        cursor.style.top = `${y + canvas.offsetTop}px`;
    }
    
    function startDrawing(event) {
        event.preventDefault();
        saveState();
        
        const { x, y } = getCoordinates(event);
        
        drawing = true;
        
        if (currentTool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.strokeStyle = 'rgba(0,0,0,1)';
            ctx.lineWidth = eraserSizeSlider.value;
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = currentColor;
            ctx.lineWidth = brushSizeSlider.value;
        }
        
        ctx.beginPath();
        ctx.moveTo(x, y);
    }
    
    function draw(event) {
        if (!drawing) return;
        event.preventDefault();
        
        const { x, y } = getCoordinates(event);
        
        ctx.lineTo(x, y);
        ctx.stroke();
    }
    
    function stopDrawing() {
        drawing = false;
    }
    
    // Function to hide all controls
    function hideAllControls() {
        penControls.classList.remove('active');
        eraserControls.classList.remove('active');
        colorPalette.classList.remove('active');
        overlay.classList.remove('active');
        penButton.classList.remove('active');
        eraserButton.classList.remove('active');
        colorButton.classList.remove('active');
    }

    // Function to toggle controls
    function toggleControls(controls, button) {
        const isActive = controls.classList.contains('active');
        hideAllControls();
        
        if (!isActive) {
            controls.classList.add('active');
            button.classList.add('active');
            overlay.classList.add('active');
        }
    }

    // Close controls when clicking outside
    overlay.addEventListener('click', hideAllControls);

    // Event listeners for tool buttons
    penButton.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleControls(penControls, penButton);
        currentTool = 'pen';
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = brushSizeSlider.value;
        updateCursor();
    });
    
    eraserButton.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleControls(eraserControls, eraserButton);
        currentTool = 'eraser';
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
        ctx.lineWidth = eraserSizeSlider.value;
        updateCursor();
    });
    
    colorButton.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleControls(colorPalette, colorButton);
    });
    
    document.querySelectorAll(".color-option").forEach(option => {
        option.addEventListener("click", (e) => {
            e.stopPropagation();
            document.querySelectorAll(".color-option").forEach(opt => {
                opt.classList.remove("active");
            });
            
            option.classList.add("active");
            currentColor = option.dataset.color;
            
            if (currentTool === 'pen') {
                ctx.strokeStyle = currentColor;
                updateCursor();
            }
        });
    });
    
    document.getElementById("undoButton").addEventListener("click", () => {
        if (history.length > 0) {
            const previousState = history.pop();
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            };
            img.src = previousState;
        }
    });
    
    document.getElementById("resetButton").addEventListener("click", () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        history = [];
        document.getElementById("resultText").textContent = "No result yet";
    });
    
    document.getElementById("runButton").addEventListener("click", async () => {
        canvas.toBlob(async (blob) => {
            if (!blob) return;
            
            const formData = new FormData();
            formData.append("file", blob, "drawing.png");
            
            try {
                resultText.textContent = "Processing...";
                
                const response = await fetch("https://artsolve-backend.onrender.com/analyze/", {
                    method: "POST",
                    body: formData,
                    headers: { "Accept": "application/json" }
                });
                
                if (!response.ok) throw new Error("Network response was not ok");
                
                const data = await response.json();
                resultText.textContent = data.result || "No result returned";
            } catch (error) {
                console.error("Error:", error);
                resultText.textContent = "Error communicating with AI";
            }
        }, "image/png", 1.0);
    });
    
    updateCursor();
    
    canvas.addEventListener("mouseenter", (e) => {
        cursor.style.display = "block";
        updateCursorPosition(e);
    });
    canvas.addEventListener("mouseleave", () => {
        cursor.style.display = "none";
    });
    
    canvas.addEventListener("mousedown", (e) => {
        updateCursorPosition(e);
        startDrawing(e);
    });
    canvas.addEventListener("mousemove", (e) => {
        updateCursorPosition(e);
        draw(e);
    });
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseout", stopDrawing);
    
    canvas.addEventListener("touchstart", (e) => {
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent("mousedown", {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    });
    canvas.addEventListener("touchmove", (e) => {
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent("mousemove", {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
        e.preventDefault();
    }, { passive: false });
    canvas.addEventListener("touchend", () => {
        const mouseEvent = new MouseEvent("mouseup", {});
        canvas.dispatchEvent(mouseEvent);
    });
    
    window.addEventListener("resize", () => {
        resizeCanvas();
    });
});
