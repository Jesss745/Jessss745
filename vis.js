const svgNS = "http://www.w3.org/2000/svg";
const svg = document.getElementById("SVGArt");

// Function to create a circle
function createCircle(cx, cy, r, color) {
  let circle = document.createElementNS(svgNS, "circle");
  circle.setAttribute("cx", cx);
  circle.setAttribute("cy", cy);
  circle.setAttribute("r", r);
  circle.setAttribute("fill", color);
  return circle;
}

// Function to create a rectangle
function createRectangle(x, y, width, height, color) {
  let rect = document.createElementNS(svgNS, "rect");
  rect.setAttribute("x", x);
  rect.setAttribute("y", y);
  rect.setAttribute("width", width);
  rect.setAttribute("height", height);
  rect.setAttribute("fill", color);
  return rect;
}

// Function to generate random color
function getRandomColor() {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Function to clear the SVG canvas
function clearCanvas() {
    svg.innerHTML = ''; // Clear the SVG by setting innerHTML to an empty string
}

// Function to generate the artwork
function generateArtwork() {
    clearCanvas(); // Clear the previous artwork
    for (let i = 0; i < 15; i++) {
        let circle = createCircle(
            Math.random() * 500,   // Random x position
            Math.random() * 500,   // Random y position
            Math.random() * 50 + 10,  // Random radius
            getRandomColor()       // Random color
        );
        svg.appendChild(circle);

        let rect = createRectangle(
            Math.random() * 400,  // Random x position
            Math.random() * 400,  // Random y position
            Math.random() * 100 + 50,  // Random width
            Math.random() * 100 + 50,  // Random height
            getRandomColor()      // Random color
        );
        svg.appendChild(rect);
    }
}

// Initial artwork generation
generateArtwork();

// Generate a new artwork every 5 seconds
setInterval(generateArtwork, 5000);