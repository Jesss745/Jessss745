// Get the SVG element
const svg = document.getElementById('leWittArt');

// Define the length of each line in pixels (10 inches = 960 pixels)
// const lineLength = 60;

// Number of lines to generate (10,000)
// const lineCount = 2000;



// Create line function that appends a line to the SVG
function createLine(x1, y1, x2, y2, stroke = 'black', strokeWidth = 0.5) {
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  
  // Set attributes
  line.setAttribute('x1', x1);
  line.setAttribute('y1', y1);
  line.setAttribute('x2', x2);
  line.setAttribute('y2', y2);
  line.setAttribute('stroke', stroke);
  line.setAttribute('stroke-width', strokeWidth);
  
  // Append line to SVG
  return line
}

let line = createLine(10,10,40,40, "red",1)
svg.append(line)

// Function to generate random coordinates within the SVG canvas
// function getRandomPosition(width, height, padding = 100) {
//   const x = Math.random() * (width - padding * 2) + padding;
//   const y = Math.random() * (height - padding * 2) + padding;
//   return { x, y };
// }

// Generate lines and add them to the SVG
// for (let i = 0; i < lineCount; i++) {
//   // Get random starting coordinates
//   const { x: x1, y: y1 } = getRandomPosition(svg.clientWidth, svg.clientHeight);
  
//   // Calculate the end coordinates based on a random angle
//   const angle = Math.random() * 360;
//   const x2 = x1 + lineLength * Math.cos(angle * (Math.PI / 180));
//   const y2 = y1 + lineLength * Math.sin(angle * (Math.PI / 180));
  
//   // Use the createLine function to draw the line
//   let line = createLine(x1, y1, x2, y2);
//   svg.append(line)
// }