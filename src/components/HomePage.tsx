import { Navbar } from "./Navbar";
import { AirdropClaimer } from "./AirdropClaimer";
import { Footer } from "./Footer";

export const HomePage = () => {

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col pt-16">

      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-10 space-y-8">
        <AirdropClaimer />
      </main>
      <Footer />
    </div>
  );
};

