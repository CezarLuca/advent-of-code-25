export default function Footer() {
    return (
        <footer className="mx-auto px-4 py-8 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400 space-y-2">
            <div className="text-center grid-cols-2 gap-4 md:grid">
                <p>
                    Contact:{" "}
                    <a href="mailto:cezar.luca96@gmail.com">
                        cezar.luca96@gmail.com
                    </a>
                </p>
                <p>
                    GitHub:{" "}
                    <a
                        href="https://github.com/CezarLuca"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Cezar Luca
                    </a>
                </p>
            </div>
        </footer>
    );
}
