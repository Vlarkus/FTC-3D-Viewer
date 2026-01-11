# FTC 3D Viewer (V2)

**A High-Performance 3D Debugging Environment for FTC Robotics.**

## Overview

The **FTC 3D Viewer** addresses the “black box” problem of FTC robot development.  
Instead of relying solely on numeric telemetry (`x: 12.0`, `y: 45.0`), the viewer provides a real-time, interactive **3D visualization environment** that exposes robot state, motion, and algorithm behavior spatially.

The application renders live telemetry as geometry in a 3D scene, enabling teams to debug localization, validate trajectories, and reason about complex algorithms visually rather than abstractly.

The viewer runs entirely in the browser and connects to a lightweight Java telemetry server running on the Robot Controller.

**Live DEMO application:**  
👉 https://ftc3dviewer.vlarkus.com
Note: The web version CANNOT connect directly to a robot on the local Control Hub network because browsers block HTTPS pages from requesting data over the robot’s local HTTP endpoints. Use the locally hosted version for robot connectivity.

---

## Key Features

- **Real-Time Visualization**  
  Live telemetry streaming from the robot into a high-performance React Three Fiber canvas.

- **Advanced Grid / Plot Box System**  
  A configurable 3D reference volume that scales to telemetry ranges and provides spatial context.

- **Geometric Debugging Primitives**
  - Points (robot position, waypoints)
  - Lines (paths, vectors, headings)
  - Planes (boundaries, constraints)
  - Parametric surfaces for advanced math and control-theory debugging

- **Camera Systems**
  - Orbit mode with dynamic targets (origin / robot)
  - Free-camera mode (WASD + mouse) for first-person inspection

- **Cross-Platform**
  - Desktop (mouse + keyboard)
  - Mobile (touch-optimized controls)

---

## Telemetry Server (Required)

The FTC 3D Viewer **does not communicate directly with FTC SDK telemetry**.  
Instead, it connects to a lightweight **Java HTTP telemetry server** running on the Robot Controller.

That server:
- Exposes robot telemetry over HTTP
- Handles CORS for browser access
- Provides example OpModes for testing and development

### Java Server Repository

👉 **FTC 3D Viewer Java Server**  
https://github.com/vlarkus/ftc-3d-viewer-java-server

This repository contains:
- A single reusable telemetry server file
- Two example OpModes for testing and controller-driven mock data

---

## Getting Started (Viewer)

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

```bash
git clone https://github.com/vlarkus/ftc-3d-viewer.git
cd ftc-3d-viewer
npm install
```

### Running Locally

```bash
npm run dev
```

Open your browser to the address shown in the terminal (typically `http://localhost:5173`).

---

## Connecting to a Robot

1. Run the Java telemetry server OpMode on the Robot Controller.
2. Enter the robot IP address (e.g. `192.168.43.1`) in the viewer.
3. Connect — telemetry will stream live into the 3D scene.

---

## License

MIT License. See [LICENSE](LICENSE) for details.
