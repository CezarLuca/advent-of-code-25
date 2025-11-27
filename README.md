# Advent of Code 2025 Challenge App

This project is an interactive web application designed to help users solve the Advent of Code challenges for the year 2025. The application provides a structured layout for each day's challenge, allowing users to input parameters, view intermediary steps, and see the final solution.

## Project Structure

The project is organized as follows:

```
advent-of-code-25
├── app
│   ├── components
│   │   ├── ui
│   │   │   ├── BurgerMenu.tsx
│   │   │   └── Collapsible.tsx
│   │   ├── solutions
│   │   │   ├── day1
|   |   |   |   ├── Part1.tsx
|   |   |   |   └── Part2.tsx
│   │   │   ├── day2
|   |   |   |   ├── Part1.tsx
|   |   |   |   └── Part2.tsx
│   │   │   └── ...
│   │   ├── DaySection.tsx
│   │   ├── DayTemplate.tsx
│   │   ├── Footer.tsx
│   │   ├── Navbar.tsx
│   │   └── ProblemToggle.tsx
│   ├── context
│   │   └── DayContext.tsx
│   ├── layout.tsx
│   └── page.tsx
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

## Features

-   **Collapsible Sections**: Each day's challenge is organized into collapsible sections for better navigation.
-   **Dynamic Problem Switching**: Users can switch between different problems for each day using the `ProblemToggle` component.
-   **Input Fields**: Each solution component includes input fields for users to enter initial parameters.
-   **Intermediary Steps Display**: The application displays intermediary steps to help users understand the solution process.
-   **Final Solution Display**: The final solution is presented clearly at the end of each day's section.

## Getting Started

To get started with the project, follow these steps:

1. **Clone the Repository**:

    ```bash
    git clone <repository-url>
    cd advent-of-code-25
    ```

2. **Install Dependencies**:

    ```bash
    npm install
    ```

3. **Run the Application**:

    ```bash
    npm run dev
    ```

4. **Open in Browser**:
   Navigate to `http://localhost:3000` in your web browser to view the application.

## Contributing

Contributions are welcome! If you have suggestions for improvements or new features, feel free to open an issue or submit a pull request.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.
