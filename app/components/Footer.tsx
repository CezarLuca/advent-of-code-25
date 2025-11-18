export default function Footer() {
    return (
        <footer
            style={{
                textAlign: "center",
                padding: "1rem",
                background: "#f1f1f1",
            }}
        >
            <p>
                Contact:{" "}
                <a href="mailto:your-email@example.com">
                    your-email@example.com
                </a>
            </p>
            <p>
                GitHub:{" "}
                <a
                    href="https://github.com/your-github-username"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    your-github-username
                </a>
            </p>
        </footer>
    );
}
