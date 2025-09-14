## Project Aesthetic & Design Style Guide

### 1\. Core Philosophy

The design is modern, clean, and focused, with a **dark-first** approach to reduce eye strain and create a sleek interface. The primary goal is to minimize visual clutter and create an intuitive user experience. The interface feels responsive and alive through subtle, snappy animations. A user-selectable light mode is available for accessibility and personal preference.

### 2\. Color Palette

The color system is built on CSS variables to allow for seamless switching between dark (default) and light themes.

#### Dark Mode (Default)

This is the default theme for the application. It uses a dark slate background with vibrant colors for interactive elements.

  * **Primary (`--primary`):** For main interactive elements like buttons and active states.
      * **Light Blue:** `#A0D2EB`
  * **Secondary (`--secondary`):** For less prominent elements.
      * **Light Coral:** `#E57373`
  * **Accent (`--accent`):** For high-emphasis, call-to-action elements.
      * **UC Red:** `#C41230`
  * **Background (`--background`):** The main application background.
      * **Dark Slate:** `#1A202C`
  * **Surface (`--surface`):** Background for container elements like cards and modals.
      * **Light Slate:** `#2D3748`
  * **Text (`--text-primary`, `--text-secondary`):**
      * **Primary Text:** `#F7FAFC` (Off-White)
      * **Secondary Text:** `#A0AEC0` (Light Gray)
  * **Borders (`--border`):** For subtle borders on inputs and containers.
      * **Gray:** `#4A5568`

#### Light Mode

This theme is activated when the user toggles it. It uses a clean, off-white background.

  * **Primary (`--primary`):** `#A0D2EB` (Same as dark mode)
  * **Secondary (`--secondary`):** `#E57373` (Same as dark mode)
  * **Accent (`--accent`):** `#C41230` (Same as dark mode)
  * **Background (`--background`):**
      * **Off-White:** `#F8F9FA`
  * **Surface (`--surface`):**
      * **Pure White:** `#FFFFFF`
  * **Text (`--text-primary`, `--text-secondary`):**
      * **Primary Text:** `#212529` (Dark Gray)
      * **Secondary Text:** `#6C757D` (Lighter Gray)
  * **Borders (`--border`):**
      * **Light Gray:** `#E9ECEF`

-----

### 3\. Typography

  * **Font:** Use a modern, readable sans-serif font like **Inter** or **Nunito Sans**.
  * **Base Font Size:** `16px`
  * **Scale:**
      * `H1` (Page Title): `2.5rem` (40px), `font-weight: 700`
      * `H2` (Section Title): `2rem` (32px), `font-weight: 700`
      * `H3` (Sub-section Title): `1.5rem` (24px), `font-weight: 600`
      * `Body` (Paragraph): `1rem` (16px), `font-weight: 400`
      * `Small` (Captions, labels): `0.875rem` (14px), `font-weight: 400`

-----

### 4\. Layout & Spacing

  * **Principle:** Use generous white space (or "dark space") to reduce clutter.
  * **Base Unit:** `8px`. All padding, margins, and gaps should be multiples of this base unit.
  * **Layout:** Use flexbox and grid for modern, responsive layouts.

-----

### 5\. Border Radius

All elements should have smooth, rounded corners. Avoid sharp `90`-degree angles.

  * **Small (`--rounded-sm`):** `4px` - For tags or badges.
  * **Medium (`--rounded-md`):** `8px` - For buttons and inputs.
  * **Large (`--rounded-lg`):** `16px` - For cards and modals.
  * **Full (`--rounded-full`):** `9999px` - For circular elements like avatars.

-----

### 6\. Shadows

Shadows in dark mode should be more subtle, often created with a semi-transparent white or a slightly lighter border.

  * **Standard Shadow (`--shadow-md`):** `0 4px 6px -1px rgba(0, 0, 0, 0.4)`
  * **Hover/Active Shadow (`--shadow-lg`):** `0 10px 15px -3px rgba(0, 0, 0, 0.4)`

-----

### 7\. Animations & Transitions

Animations should be **snappy and responsive**.

  * **Default Transition Duration:** `200ms` (`--transition-speed: 200ms`)
  * **Default Easing Function:** `ease-out` or `cubic-bezier(0.25, 0.8, 0.25, 1)`
  * **Properties to Animate:** Use `transform` and `opacity` for performance.
  * **Hover Elements:** For elements that appear on hover, they should slide smoothly into view using `transform`.

-----

### 8\. Component Examples

  * **Buttons:**
      * Background: Primary color (`--primary`). Text color should be dark for contrast.
      * Padding: `12px 24px`.
      * Border Radius: Medium (`--rounded-md`).
      * On hover: Slightly darken the background color and apply a larger shadow (`--shadow-lg`).
  * **Cards:**
      * Background: Surface color (`--surface`).
      * Border Radius: Large (`--rounded-lg`).
      * Shadow: Standard shadow (`--shadow-md`).
      * Padding: `24px`.
      * On hover: Lift up using `transform: translateY(-4px)` and gain a larger shadow (`--shadow-lg`).
  * **Inputs:**
      * Background: Surface color (`--surface`).
      * Border: `1px solid var(--border)`.
      * Border Radius: Medium (`--rounded-md`).
      * On focus: The border color changes to the primary color (`--primary`).

-----

### \#\# Implementation Instructions

Update your `app/globals.css` file to define the variables for both themes. The `:root` will hold the default **dark mode** styles. A `[data-theme='light']` selector will override them for **light mode**.

```css
/* app/globals.css */

/* Dark Mode Variables (Default) */
:root {
  --primary: #A0D2EB;
  --secondary: #E57373;
  --accent: #C41230;
  --background: #1A202C;
  --surface: #2D3748;
  --text-primary: #F7FAFC;
  --text-secondary: #A0AEC0;
  --border: #4A5568;

  --rounded-sm: 4px;
  --rounded-md: 8px;
  --rounded-lg: 16px;
  --rounded-full: 9999px;

  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.4);
  
  --transition-speed: 200ms;
  --transition-ease: ease-out;
}

/* Light Mode Variable Overrides */
[data-theme='light'] {
  --background: #F8F9FA;
  --surface: #FFFFFF;
  --text-primary: #212529;
  --text-secondary: #6C757D;
  --border: #E9ECEF;
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
}

body {
  background-color: var(--background);
  color: var(--text-primary);
  font-family: 'Inter', sans-serif;
  /* Add a smooth transition for color changes */
  transition: background-color 0.3s ease, color 0.3s ease;
}