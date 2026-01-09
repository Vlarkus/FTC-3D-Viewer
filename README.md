# FTC 3D Viewer (V2)

## NOTE!!!!!

This project is currently not fully functional. Consider this as a demo of the planned version.

**A High-Performance Visual Debugging Environment for FTC Robotics.**

## Overview

The **FTC 3D Viewer** solves the "Black Box" problem of robot autonomy. Instead of relying on abstract log numbers (`x: 12.0`, `y: 45.0`), this tool provides a real-time, interactive 3D dashboard that gives developers visual insight into their code's logic. It allows you to visualize robot localization, debug complex paths, and validate algorithms using 3D geometric overlays.

## Key Features

-   **Real-Time Visualization**: Connect to your robot via IP/WebSocket and see its position and orientation update instantly on a high-performance React Three Fiber canvas.
-   **Advanced Grid System**: A customizable "Plot Box" ("Room View") that scales to your data ranges, providing rich spatial context with visibility optimization for inner walls.
-   **Geometric Debugging**:
    -   **Points**: Visualize waypoints (sphere, box, cone).
    -   **Lines**: Render vectors, tracked paths, and headings.
    -   **Planes**: Visualize algorithm boundaries.
    -   **Parametric Surfaces**: Render complex math functions (`x(u,v)`, `y(u,v)`, `z(u,v)`) to debug control theory curves.
-   **Camera Systems**:
    -   **Orbit Mode**: Inspect from any angle with target tracking (Origin vs. Robot).
    -   **Free Mode**: First-person WASD + Mouse navigation for detailed field inspection.
-   **Cross-Platform**: Fully supported on Desktop (Mouse/Keyboard) and Mobile (Touch-optimized visibility controls).

## Getting Started

### Prerequisites

-   Node.js (v16 or higher)
-   npm

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/vlarkus/ftc-3d-viewer.git
    cd ftc-3d-viewer
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

### Running the Application

Start the development server:

```bash
npm run dev
```

Open your browser to `http://localhost:5173` (or the port shown in the terminal).

### Robot Connection

1.  Enter your Robot Controller's IP address (e.g., `192.168.43.1` or `localhost` if simulated) in the connection panel.
2.  Click **Connect**.
3.  The viewer will start receiving telemetry and rendering the robot state.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
