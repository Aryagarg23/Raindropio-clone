export const namedColors: { [hex: string]: string } = {
  "#A0D2EB": "Light Blue",
  "#E57373": "Light Coral",
  "#C41230": "UC Red",
  "#1A202C": "Dark Slate",
  "#2D3748": "Light Slate",
  "#F7FAFC": "Off-White",
  "#A0AEC0": "Light Gray",
  "#4A5568": "Gray",
  "#F8F9FA": "Off-White",
  "#FFFFFF": "Pure White",
  "#212529": "Dark Gray",
  "#6C757D": "Lighter Gray",
  "#E9ECEF": "Light Gray"
};

export function getClosestColorName(hex: string) {
  return namedColors[hex.toUpperCase()] || hex;
}

export const stickyPalette: string[] = [
  '#FFEB3B', // Sticky Yellow
  '#FFE082', // Light Amber
  '#FFCC80', // Peach
  '#FFAB91', // Coral
  '#F8BBD0', // Pink
  '#E1BEE7', // Lavender
  '#B39DDB', // Soft Purple
  '#C8E6C9', // Mint Green
  '#B2DFDB', // Teal Mint
  '#BBDEFB'  // Sky Blue
];
