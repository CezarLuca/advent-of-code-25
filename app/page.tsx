import Navbar from "./components/Navbar";
// import DaySection from "./components/DaySection";
import Footer from "./components/Footer";

export default function Home() {
    return (
        <div>
            <Navbar />
            <main>
                {/* {Array.from({ length: 12 }, (_, index) => (
                    <DaySection key={index + 1} day={index + 1} />
                ))} */}
            </main>
            <Footer />
        </div>
    );
}
