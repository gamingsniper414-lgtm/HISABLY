import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Check,
  ChevronDown,
  CircleDollarSign,
  LockKeyhole,
  LogOut,
  Menu,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useAuth } from "./context/AuthContext.jsx";

const features = [
  {
    icon: BookOpen,
    title: "A clearer digital khata",
    description:
      "Keep transactions, notes, and payment history organized in one place.",
  },
  {
    icon: Users,
    title: "Every person, one profile",
    description:
      "See the records and outstanding balance associated with each customer.",
  },
  {
    icon: BarChart3,
    title: "Understand your money",
    description:
      "Turn your financial records into useful reports and visual insights.",
  },
  {
    icon: ShieldCheck,
    title: "Your records, your account",
    description:
      "Sign in with Google and keep your financial records associated with your account.",
  },
];

const steps = [
  {
    number: "01",
    title: "Sign in securely",
    description: "Use your Google account to access your personal workspace.",
  },
  {
    number: "02",
    title: "Add your records",
    description:
      "Record transactions and connect them to the people you deal with.",
  },
  {
    number: "03",
    title: "Stay in control",
    description:
      "Review balances and reports whenever you need a clearer picture.",
  },
];

const faqs = [
  {
    question: "Who is Hisably for?",
    answer:
      "Hisably is designed for students, individuals, and small businesses who want a clearer way to organize financial records.",
  },
  {
    question: "Do I need to enter my Google password here?",
    answer:
      "No. Google sign-in takes place through Google's authentication flow. Hisably does not ask you to type your Google password into the application.",
  },
  {
    question: "Can I track money given and received?",
    answer:
      "The ledger is being built to support transactions, balances, and payment history.",
  },
  {
    question: "Is Hisably a bank or payment service?",
    answer:
      "No. Hisably is a record-keeping tool. It does not hold money or transfer payments.",
  },
];

function Logo() {
  return (
    <a
      href="#home"
      aria-label="Hisably home"
      className="inline-flex items-center gap-2.5"
    >
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
        <Wallet size={21} strokeWidth={2.2} />
      </span>
      <span className="text-xl font-bold tracking-tight">hisably</span>
    </a>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.75 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.87 0-5.3-1.94-6.17-4.54H2.15v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.83 14.1A6.6 6.6 0 0 1 5.48 12c0-.73.13-1.44.35-2.1V7.06H2.15a11 11 0 0 0 0 9.88l3.68-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.36c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.6 10.6 0 0 0 12 1a11 11 0 0 0-9.85 6.06L5.83 9.9C6.7 7.3 9.13 5.36 12 5.36Z"
      />
    </svg>
  );
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
        {eyebrow}
      </p>
      <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 leading-7 text-slate-600 dark:text-slate-400">
        {description}
      </p>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="absolute -inset-5 rounded-[2.5rem] bg-blue-500/15 blur-3xl dark:bg-blue-500/20" />

      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl shadow-blue-950/10 dark:border-slate-700 dark:bg-slate-900 sm:p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-5 dark:border-slate-800">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Your workspace
            </p>
            <h3 className="mt-1 text-lg font-bold">Financial overview</h3>
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
            <Sparkles size={19} />
          </div>
        </div>

        <p className="mt-4 text-xs font-medium text-slate-500 dark:text-slate-400">
          Illustrative preview — not actual financial data
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-blue-50 p-4 dark:bg-blue-950/50">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <ArrowDownLeft size={17} />
              <span className="text-xs font-semibold">Money received</span>
            </div>
            <p className="mt-4 text-xl font-bold">₹ —</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Your incoming records
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <ArrowUpRight size={17} />
              <span className="text-xs font-semibold">Money given</span>
            </div>
            <p className="mt-4 text-xl font-bold">₹ —</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Your outgoing records
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Your activity</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                A simpler way to see the bigger picture
              </p>
            </div>
            <BarChart3 className="text-blue-500" size={20} />
          </div>

          <div
            aria-hidden="true"
            className="mt-6 flex h-28 items-end gap-2 border-b border-slate-200 dark:border-slate-700 sm:gap-4"
          >
            {[35, 55, 42, 70, 52, 82, 64, 95].map((height, index) => (
              <div
                key={index}
                className="flex-1 rounded-t-lg bg-gradient-to-t from-blue-600 to-blue-300 opacity-70"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-blue-600 dark:bg-slate-700 dark:text-blue-300">
            <LockKeyhole size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold">Made for your records</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Organized, accessible, and easy to review
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountScreen({ user, onLogout, busy }) {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-81px)] max-w-7xl items-center justify-center px-5 py-16 sm:px-8">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-blue-950/5 dark:border-slate-800 dark:bg-slate-900 sm:p-10">
        <div className="flex items-center gap-4">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt=""
              referrerPolicy="no-referrer"
              className="h-16 w-16 rounded-full"
            />
          ) : (
            <div className="grid h-16 w-16 place-items-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <Users size={28} />
            </div>
          )}

          <div className="min-w-0">
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              Signed in with Google
            </p>
            <h1 className="mt-1 break-words text-2xl font-bold">
              Welcome, {user.displayName || "there"}!
            </h1>
          </div>
        </div>

        <div className="mt-8 rounded-2xl bg-slate-50 p-5 dark:bg-slate-800">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Account email
          </p>
          <p className="mt-2 break-all font-medium">
            {user.email || "Not available"}
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5 text-sm leading-7 text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100">
          Google sign-in is connected. The financial dashboard and ledger are
          still being built. Please don’t enter real financial data until we
          have implemented and tested the database security rules.
        </div>

        <button
          type="button"
          onClick={onLogout}
          disabled={busy}
          className="mt-7 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          <LogOut size={17} />
          {busy ? "Signing out..." : "Sign out"}
        </button>
      </div>
    </main>
  );
}

function App() {
  const { user, authLoading, signInWithGoogle, logOut } = useAuth();

  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const reducedMotion = useReducedMotion();

  async function handleSignIn() {
    setError("");
    setBusy(true);

    try {
      await signInWithGoogle();
      setMenuOpen(false);
    } catch (signInError) {
      if (signInError.code === "auth/popup-closed-by-user") {
        setError("The sign-in window was closed. You can try again.");
      } else if (signInError.code === "auth/popup-blocked") {
        setError("Your browser blocked the sign-in window. Allow pop-ups and try again.");
      } else if (signInError.code === "auth/unauthorized-domain") {
        setError("This website address is not authorized in Firebase Authentication.");
      } else {
        setError("Google sign-in failed. Please try again.");
        console.error("Google sign-in error:", signInError);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    setError("");
    setBusy(true);

    try {
      await logOut();
    } catch (logoutError) {
      setError("Could not sign out. Please try again.");
      console.error("Sign-out error:", logoutError);
    } finally {
      setBusy(false);
    }
  }

  const reveal = reducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.2 },
        transition: { duration: 0.55 },
      };

  const linkClass =
    "text-sm font-medium text-slate-600 transition hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400";

  return (
    <div className={dark ? "dark" : ""}>
      <div
        id="home"
        className="min-h-screen bg-white text-slate-900 transition-colors dark:bg-slate-950 dark:text-white"
      >
        <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/85">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
            <Logo />

            {!user && (
              <nav
                aria-label="Main navigation"
                className="hidden items-center gap-8 md:flex"
              >
                <a href="#features" className={linkClass}>Features</a>
                <a href="#how-it-works" className={linkClass}>How it works</a>
                <a href="#faq" className={linkClass}>FAQ</a>
              </nav>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDark((value) => !value)}
                aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
                className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {dark ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {!authLoading && !user && (
                <>
                  <button
                    type="button"
                    onClick={handleSignIn}
                    disabled={busy}
                    className="hidden rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60 sm:inline-flex"
                  >
                    {busy ? "Connecting..." : "Get started"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setMenuOpen((value) => !value)}
                    aria-label={menuOpen ? "Close menu" : "Open menu"}
                    aria-expanded={menuOpen}
                    aria-controls="mobile-menu"
                    className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 dark:border-slate-700 md:hidden"
                  >
                    {menuOpen ? <X size={19} /> : <Menu size={19} />}
                  </button>
                </>
              )}
            </div>
          </div>

          {menuOpen && !user && (
            <nav
              id="mobile-menu"
              aria-label="Mobile navigation"
              className="flex flex-col gap-4 border-t border-slate-100 px-5 py-5 dark:border-slate-800 md:hidden"
            >
              <a href="#features" className={linkClass} onClick={() => setMenuOpen(false)}>
                Features
              </a>
              <a href="#how-it-works" className={linkClass} onClick={() => setMenuOpen(false)}>
                How it works
              </a>
              <a href="#faq" className={linkClass} onClick={() => setMenuOpen(false)}>
                FAQ
              </a>
              <button
                type="button"
                onClick={handleSignIn}
                disabled={busy}
                className="self-start text-sm font-semibold text-blue-600 disabled:opacity-60 dark:text-blue-400"
              >
                {busy ? "Connecting..." : "Get started"}
              </button>
            </nav>
          )}
        </header>

        {error && (
          <div
            role="alert"
            className="mx-auto mt-4 flex max-w-7xl items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100"
          >
            <p>{error}</p>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
              className="shrink-0 rounded-md p-1"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {authLoading ? (
          <main
            role="status"
            className="flex min-h-[60vh] items-center justify-center px-5 text-slate-500 dark:text-slate-400"
          >
            Checking your account...
          </main>
        ) : user ? (
          <AccountScreen user={user} onLogout={handleLogout} busy={busy} />
        ) : (
          <>
            <main>
              <section className="relative overflow-hidden">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-blue-100/70 blur-3xl dark:bg-blue-900/20"
                />

                <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:py-28">
                  <motion.div {...reveal}>
                    <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300">
                      <Sparkles size={14} />
                      Your money. Your records. Your control.
                    </div>

                    <h1 className="mt-7 max-w-2xl text-5xl font-bold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
                      Manage Your Money.{" "}
                      <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                        Simplify Your Life.
                      </span>
                    </h1>

                    <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 dark:text-slate-400 sm:text-lg">
                      Your personal digital khata to track transactions, manage
                      debts, record sales and stay in control of your finances.
                    </p>

                    <div className="mt-9 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleSignIn}
                        disabled={busy}
                        className="inline-flex items-center justify-center gap-3 rounded-xl bg-blue-600 px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:opacity-60"
                      >
                        <span className="rounded-full bg-white p-1">
                          <GoogleIcon />
                        </span>
                        {busy ? "Connecting..." : "Get Started with Google"}
                        <ArrowRight size={17} />
                      </button>

                      <a
                        href="#features"
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-6 py-4 text-sm font-semibold transition hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:hover:border-blue-500"
                      >
                        Explore Features
                        <ArrowRight size={17} />
                      </a>
                    </div>

                    <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-2">
                        <Check size={16} className="text-blue-600" />
                        Designed for everyday clarity
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <Check size={16} className="text-blue-600" />
                        Your personal workspace
                      </span>
                    </div>
                  </motion.div>

                  <motion.div {...reveal}>
                    <DashboardPreview />
                  </motion.div>
                </div>
              </section>

              <section
                id="features"
                className="scroll-mt-24 bg-slate-50 px-5 py-24 dark:bg-slate-900/40 sm:px-8"
              >
                <div className="mx-auto max-w-7xl">
                  <SectionHeading
                    eyebrow="Built for clarity"
                    title="Everything in its right place."
                    description="Spend less time piecing together records and more time understanding where you stand."
                  />

                  <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {features.map((feature) => {
                      const Icon = feature.icon;

                      return (
                        <motion.div
                          key={feature.title}
                          {...reveal}
                          className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-950/5 dark:border-slate-800 dark:bg-slate-900"
                        >
                          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                            <Icon size={22} />
                          </div>
                          <h3 className="mt-6 text-lg font-bold">{feature.title}</h3>
                          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
                            {feature.description}
                          </p>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </section>

              <section
                id="how-it-works"
                className="scroll-mt-24 px-5 py-24 sm:px-8"
              >
                <div className="mx-auto max-w-7xl">
                  <SectionHeading
                    eyebrow="Simple by design"
                    title="A little organization goes a long way."
                    description="A straightforward workspace for the records that matter to you."
                  />

                  <div className="mt-14 grid gap-6 md:grid-cols-3">
                    {steps.map((step) => (
                      <motion.div
                        key={step.number}
                        {...reveal}
                        className="rounded-3xl border border-slate-200 p-8 dark:border-slate-800"
                      >
                        <span className="text-sm font-bold tracking-widest text-blue-600 dark:text-blue-400">
                          {step.number}
                        </span>
                        <h3 className="mt-5 text-xl font-bold">{step.title}</h3>
                        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
                          {step.description}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="bg-slate-50 px-5 py-24 dark:bg-slate-900/40 sm:px-8">
                <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
                  <motion.div {...reveal}>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
                      Less guesswork
                    </p>
                    <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                      Make room for more confident decisions.
                    </h2>
                    <p className="mt-5 max-w-xl leading-7 text-slate-600 dark:text-slate-400">
                      From everyday expenses to outstanding balances, your records
                      deserve a home that makes them easier to understand.
                    </p>
                  </motion.div>

                  <motion.div {...reveal} className="grid gap-4 sm:grid-cols-2">
                    {[
                      "Keep your records organized",
                      "Review outstanding balances",
                      "Explore reports and trends",
                      "Find transactions faster",
                    ].map((benefit) => (
                      <div
                        key={benefit}
                        className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                      >
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                          <Check size={16} />
                        </span>
                        <span className="pt-1 text-sm font-semibold">
                          {benefit}
                        </span>
                      </div>
                    ))}
                  </motion.div>
                </div>
              </section>

              <section id="faq" className="scroll-mt-24 px-5 py-24 sm:px-8">
                <div className="mx-auto max-w-3xl">
                  <SectionHeading
                    eyebrow="Good to know"
                    title="Frequently asked questions."
                    description="A few answers to help you get started."
                  />

                  <div className="mt-12 space-y-3">
                    {faqs.map((faq) => (
                      <details
                        key={faq.question}
                        className="group rounded-2xl border border-slate-200 bg-white px-6 dark:border-slate-800 dark:bg-slate-900"
                      >
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-semibold [&::-webkit-details-marker]:hidden">
                          {faq.question}
                          <ChevronDown
                            size={19}
                            className="shrink-0 text-slate-400 transition group-open:rotate-180"
                          />
                        </summary>
                        <p className="pb-5 text-sm leading-7 text-slate-600 dark:text-slate-400">
                          {faq.answer}
                        </p>
                      </details>
                    ))}
                  </div>
                </div>
              </section>

              <section className="px-5 pb-24 sm:px-8">
                <motion.div
                  {...reveal}
                  className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-600 px-6 py-16 text-center text-white sm:px-12"
                >
                  <div
                    aria-hidden="true"
                    className="absolute -right-16 -top-32 h-72 w-72 rounded-full bg-white/10 blur-2xl"
                  />
                  <div className="relative">
                    <CircleDollarSign className="mx-auto" size={34} />
                    <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
                      Ready for a clearer view?
                    </h2>
                    <p className="mx-auto mt-4 max-w-xl leading-7 text-blue-100">
                      Bring your records together and take the next step toward
                      feeling more in control.
                    </p>
                    <button
                      type="button"
                      onClick={handleSignIn}
                      disabled={busy}
                      className="mt-8 inline-flex items-center gap-3 rounded-xl bg-white px-6 py-4 text-sm font-semibold text-blue-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50 disabled:opacity-60"
                    >
                      <GoogleIcon />
                      {busy ? "Connecting..." : "Get Started with Google"}
                      <ArrowRight size={17} />
                    </button>
                  </div>
                </motion.div>
              </section>
            </main>

            <footer className="border-t border-slate-200 px-5 py-10 dark:border-slate-800 sm:px-8">
              <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 sm:flex-row sm:items-center">
                <div>
                  <Logo />
                  <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                    Your Money. Your Records. Your Control.
                  </p>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  © {new Date().getFullYear()} Hisably. All rights reserved.
                </p>
              </div>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}

export default App;