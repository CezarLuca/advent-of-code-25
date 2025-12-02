export default function Footer() {
    return (
        <footer className="mx-auto px-4 py-8 border-t-2 border-green-700 text-sm text-green-500 space-y-2">
            <div className="text-center grid-cols-2 gap-4 md:grid">
                <p>
                    <span className="mr-2">📧</span>
                    Contact:{" "}
                    <a
                        href="mailto:cezar.luca96@gmail.com"
                        className="text-red-500 hover:text-red-600 underline"
                    >
                        cezar.luca96@gmail.com
                    </a>
                </p>
                <p>
                    <span className="mr-2">💻</span>
                    GitHub:{" "}
                    <a
                        href="https://github.com/CezarLuca"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-red-500 hover:text-red-600 underline"
                    >
                        Cezar Luca
                    </a>
                </p>
            </div>
        </footer>
    );
}
