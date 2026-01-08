# Advent of Code 2025 Challenge App 🎄❄️

An interactive web application to explore, verify, and visualize solutions for [Advent of Code 2025](https://adventofcode.com/2025). Featuring festive visual effects, step-by-step solution breakdowns, and advanced computational techniques including parallelized web workers.

## ✨ Visual Effects

The app includes immersive holiday-themed visual effects that can be toggled on/off via the navigation menu:

-   **Snowfall** — Gentle animated snowflakes falling across the screen ([Snowfall.tsx](app/components/ui/Snowfall.tsx))
-   **Fluid Cursor Effect** — A WebGL-powered fluid simulation that follows your cursor with Christmas-themed colors ([FluidCursorEffect.tsx](app/components/ui/FluidCursorEffect.tsx))
-   **Star Cursor** — A festive star cursor to enhance the holiday experience

## 🌟 Highlighted Solution: Day 10

Day 10 showcases some of the most technically impressive features of this project:

### Part 1: Custom Visualization Animation

After solving the puzzle, you can launch an **interactive GSAP-powered animation** that visualizes how the solution works:

-   Server rack visual metaphor with expandable machine rows
-   Step-by-step animation showing button presses and toggle state changes
-   Playback controls (play, pause, step forward/backward, speed adjustment)
-   Navigate between different puzzle rows with auto-play functionality

See [AnimationModal.tsx](app/components/solutions/day10/AnimationModal.tsx), [ServerRack.tsx](app/components/solutions/day10/ServerRack.tsx), and [CenterMachine.tsx](app/components/solutions/day10/CenterMachine.tsx).

### Part 2: Parallelized Web Worker Solver

A high-performance solver designed to tackle large datasets using modern browser capabilities:

-   **Up to 8 parallel web workers** (dynamically scaled based on `navigator.hardwareConcurrency`)
-   Real-time progress reporting with iteration counts and elapsed time
-   Color-coded row indicators showing solve time (blue → white → red gradient)
-   Skip functionality for long-running rows with 30-minute auto-skip timeout
-   Live worker status display showing which rows are being processed

See [Part2.tsx](app/components/solutions/day10/Part2.tsx), [solve2.ts](app/components/solutions/day10/solve2.ts), and [webWorkerRowSolver.ts](app/components/solutions/day10/webWorkerRowSolver.ts).

## 🛠️ How to Use

1. Click on any day section to expand its solutions
2. Toggle between **Problem 1** and **Problem 2** for each day
3. Paste your puzzle input to verify your answers
4. View step-by-step solution logs for hints and learning
5. For Day 10 Part 1, click **"Play Animation"** after solving to see the visualization

## 📁 Project Structure

```
app/
├── page.tsx                    # Main page rendering all days
├── layout.tsx                  # Root layout with fonts
├── globals.css                 # Global styles & Tailwind
├── context/
│   └── DayContext.tsx          # App state (open day, selected problem, effects)
└── components/
    ├── Hero.tsx                # Welcome section with app info
    ├── DayTemplate.tsx         # Lazy-loads day/part components
    ├── SolutionTemplate.tsx    # Input, Solve button, virtualized steps
    ├── Navbar.tsx              # Fixed header with menu
    ├── Footer.tsx              # Page footer
    └── solutions/
        ├── day1/ ... day12/    # Per-day solution components
        └── ui/
            ├── Snowfall.tsx
            ├── FluidCursorEffect.tsx
            ├── BurgerMenu.tsx
            └── Collapsible.tsx
public/
└── inputs/                     # Example puzzle inputs
```

## 🚀 Running Locally

```bash
npm install
npm run dev
# open http://localhost:3000
```

## ⚠️ Disclaimer

This web app is **not affiliated with** Advent of Code or Eric Wastl. It is an open-source project created to demonstrate personal solutions and provide a learning resource for fellow programmers. Please support the official [Advent of Code](https://adventofcode.com) website!

## 🤝 Contributing

Contributions are welcome! If you have suggestions for improvements or new features, feel free to open an issue or submit a pull request.

## 📄 License

This project is licensed under the MIT License. See the LICENSE file for more details.
