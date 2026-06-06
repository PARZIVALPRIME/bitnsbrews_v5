# Bits'nBrews Architecture Explorer

An interactive, immersive 3D semiconductor SoC (System-on-Chip) explorer. Walk through physical layers of hardware design—from the outer laptop chassis down to the microscopic pipeline stages of a CPU—with an automated spotlight narrative and an interactive co-spatial silicon journal.

---

## 🌟 Key Features

1. **10-Chapter Hardware Narrative**
   - Glides sequentially through a detailed narrative arc: from laptop casing, MCM organic substrate, bare silicon die floorplan, down to individual processing blocks (CPU, GPU, NPU, Modem, Media Pipeline, Memory/Fabric, and Instruction Pipelines).
2. **Dynamic Block Spotlight & Explode Animations**
   - Primary chip blocks lift up (`Y-axis` offset) and glow dynamically when they are the focus of a chapter, while neighboring blocks dim automatically.
3. **Automated Close-up Camera Paths**
   - Implements precision target coordinates above each block, offering a clear top-down perspective to easily read labels and articles.
4. **Interactive Co-Spatial 3D Silicon Journal**
   - Renders HTML elements inside the WebGL context using Drei's `<Html transform>`.
   - Offers **Read Mode** (with custom markdown parsing) and **Edit Mode** (allowing notes/text updates) that persist locally in browser storage.
5. **Responsive Premium UI**
   - Clean, modern HUD with glowing SVG circuit trace background animations, glassmorphic overlays, and indicators.

---

## 🛠️ Technology Stack

* **Frontend Framework:** React + TypeScript + Vite
* **3D Library:** Three.js (via React Three Fiber & `@react-three/drei`)
* **Styling:** Tailwind CSS + Custom CSS Variables
* **Icons:** Lucide React

---

## 📂 Project Structure

```
final-mark/
├── src/
│   ├── soc/
│   │   ├── BlockArticle.tsx      # Handles HTML article cards rendered on block tops
│   │   ├── SocBlock.tsx          # Component for rendering individual 3D silicon blocks
│   │   ├── Scene.tsx             # Coordinates the main 3D canvas assemblies
│   │   ├── levelManager.ts       # Manages 3D camera paths, field of view, and interpolation
│   │   ├── ProceduralModels.tsx  # Houses 3D models for Laptop, Substrate, and Pipelines
│   │   └── data.ts               # Silicon block sizes, dimensions, colors, coordinates
│   ├── chapters.ts               # Narrative definitions for the 10 explorer stages
│   ├── AppUI.tsx                 # Main overlay UI layout (titles, buttons, scroll logic)
│   ├── RootApp.tsx               # Orchestrator dividing desktop and mobile views
│   └── main.tsx                  # Vite client entry point
```

---

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js installed (v16+ recommended).

### Installation
Clone the repository, navigate to the folder, and install dependencies:
```bash
npm install
```

### Run Locally
Start the development server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production
Generate the production bundle:
```bash
npm run build
```
The optimized bundle will be created in the `dist/` directory.

---

## 📄 License
This project is open-source. Feel free to use, modify, and distribute it.
