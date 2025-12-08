# Advent of Code 2025 Challenge App

This project is an interactive web application designed to help users solve the Advent of Code challenges for the year 2025. The application provides a structured layout for each day's challenge, allowing users to input parameters, view intermediary steps, and see the final solution.

## Project layout (key files)

-   app/
    -   [page.tsx](app/page.tsx) — main page rendering all days
    -   [layout.tsx](app/layout.tsx) — root layout and fonts
    -   [globals.css](app/globals.css) — global styles & Tailwind imports
    -   context/
        -   [DayContext.tsx](app/context/DayContext.tsx) — provides [`DayProvider`](app/context/DayContext.tsx), [`useDayContext`](app/context/DayContext.tsx) and [`TOTAL_DAYS`](app/context/DayContext.tsx)
    -   components/
        -   [DayTemplate.tsx](app/components/DayTemplate.tsx) — lazy-loads day/part components (mapping lives here)
        -   [SolutionTemplate.tsx](app/components/SolutionTemplate.tsx) — input, Solve button, virtualized steps list
        -   [Navbar.tsx](app/components/Navbar.tsx), [Footer.tsx](app/components/Footer.tsx)
        -   [ProblemToggle.tsx](app/components/ProblemToggle.tsx) and ui/
            -   [ui/BurgerMenu.tsx](app/components/ui/BurgerMenu.tsx)
            -   [ui/Collapsible.tsx](app/components/ui/Collapsible.tsx)
        -   solutions/ — per-day solution entry components (e.g. [app/components/solutions/day1/Part1.tsx](app/components/solutions/day1/Part1.tsx))
-   public/
    -   inputs (example: [public/inputs/day1/Problem1.txt](public/inputs/day1/Problem1.txt))
-   Root files:
    -   [package.json](package.json) — scripts & deps
    -   [tsconfig.json](tsconfig.json)
    -   [postcss.config.mjs](postcss.config.mjs)

## How it works

-   The app state (open day, selected part) is centralized in [`DayProvider`](app/context/DayContext.tsx) and consumed with [`useDayContext`](app/context/DayContext.tsx).
-   Each day section uses [DayTemplate.tsx](app/components/DayTemplate.tsx) which lazy-loads the appropriate Part component (e.g. `day3/Part1`) so UI bundles stay small.
-   Each Part component renders a small UI that uses [`SolutionTemplate`](app/components/SolutionTemplate.tsx) to accept input, run the `solve` function and show step-by-step logs and the final answer.
-   UI niceties: collapsible sections ([ui/Collapsible.tsx](app/components/ui/Collapsible.tsx)), mobile jump menu ([ui/BurgerMenu.tsx](app/components/ui/BurgerMenu.tsx)), and a responsive Navbar ([Navbar.tsx](app/components/Navbar.tsx)).

## Running locally

```bash
npm install
npm run dev
# open http://localhost:3000
```

## Contributing

Contributions are welcome! If you have suggestions for improvements or new features, feel free to open an issue or submit a pull request.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.
