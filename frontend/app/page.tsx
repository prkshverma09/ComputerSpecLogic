import Link from "next/link";
import {
  Cpu,
  Monitor,
  Zap,
  Shield,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <Cpu className="h-6 w-6 text-primary" />
            <span>Spec-Logic</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/build"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
            >
              Start Building
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-24 sm:py-32">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 to-transparent" />
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Powered by Algolia Agent Studio</span>
              </div>
              <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl">
                Build Your Perfect PC with{" "}
                <span className="text-primary">AI-Powered</span> Compatibility
              </h1>
              <p className="mb-10 text-lg text-muted-foreground sm:text-xl">
                Say goodbye to compatibility nightmares. Our intelligent
                assistant ensures every component works together perfectly,
                from CPU sockets to power requirements.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Link
                  href="/build"
                  className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-base font-medium text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:shadow-xl"
                >
                  Start Building
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  href="#features"
                  className="inline-flex items-center justify-center rounded-md border px-8 py-3 text-base font-medium hover:bg-muted transition-colors"
                >
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="border-t py-24" id="features">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                How It Works
              </h2>
              <p className="text-lg text-muted-foreground">
                Building a PC has never been easier. Our AI-powered assistant
                guides you through every step.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {/* Step 1 */}
              <div className="relative rounded-lg border p-6 bg-card">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-xl font-bold text-primary">1</span>
                </div>
                <h3 className="mb-2 text-xl font-semibold">Select Components</h3>
                <p className="text-muted-foreground">
                  Browse our curated selection of CPUs, GPUs, motherboards, and
                  more. Search by name, filter by specs, or ask our AI for
                  recommendations.
                </p>
              </div>

              {/* Step 2 */}
              <div className="relative rounded-lg border p-6 bg-card">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-xl font-bold text-primary">2</span>
                </div>
                <h3 className="mb-2 text-xl font-semibold">
                  Automatic Validation
                </h3>
                <p className="text-muted-foreground">
                  As you build, we automatically check compatibility. Socket
                  mismatches, memory types, clearances, and power requirements
                  are all verified in real-time.
                </p>
              </div>

              {/* Step 3 */}
              <div className="relative rounded-lg border p-6 bg-card">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-xl font-bold text-primary">3</span>
                </div>
                <h3 className="mb-2 text-xl font-semibold">Export & Build</h3>
                <p className="text-muted-foreground">
                  Once your build is complete, export to PCPartPicker, share
                  with friends, or save for later. Everything you need to make
                  your dream PC a reality.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="border-t bg-muted/30 py-24">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                Built for PC Enthusiasts
              </h2>
              <p className="text-lg text-muted-foreground">
                Whether you&apos;re a first-time builder or a seasoned veteran,
                Spec-Logic has you covered.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border bg-card p-6">
                <Shield className="mb-4 h-10 w-10 text-green-500" />
                <h3 className="mb-2 font-semibold">Compatibility Shield</h3>
                <p className="text-sm text-muted-foreground">
                  Automatic filtering prevents incompatible parts from being
                  shown after your first selection.
                </p>
              </div>

              <div className="rounded-lg border bg-card p-6">
                <Zap className="mb-4 h-10 w-10 text-yellow-500" />
                <h3 className="mb-2 font-semibold">Power Calculator</h3>
                <p className="text-sm text-muted-foreground">
                  Real-time PSU recommendations with transient spike handling
                  for high-end GPUs.
                </p>
              </div>

              <div className="rounded-lg border bg-card p-6">
                <Monitor className="mb-4 h-10 w-10 text-blue-500" />
                <h3 className="mb-2 font-semibold">Clearance Checks</h3>
                <p className="text-sm text-muted-foreground">
                  GPU length and cooler height validation ensures everything
                  fits in your case.
                </p>
              </div>

              <div className="rounded-lg border bg-card p-6">
                <Sparkles className="mb-4 h-10 w-10 text-purple-500" />
                <h3 className="mb-2 font-semibold">AI Assistant</h3>
                <p className="text-sm text-muted-foreground">
                  Ask questions, get recommendations, and learn about
                  compatibility in plain language.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Start Cards */}
        <section className="border-t py-24">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                Ready to Build?
              </h2>
              <p className="text-lg text-muted-foreground">
                Choose a starting point and let our AI guide you to the perfect
                configuration.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                href="/build?budget=1000"
                className="group rounded-lg border p-6 hover:border-primary hover:shadow-lg transition-all"
              >
                <div className="mb-4 text-3xl">🎮</div>
                <h3 className="mb-2 font-semibold group-hover:text-primary transition-colors">
                  Budget Gaming
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Great 1080p gaming performance without breaking the bank.
                </p>
                <span className="text-primary font-medium">~$1,000</span>
              </Link>

              <Link
                href="/build?budget=1500"
                className="group rounded-lg border p-6 hover:border-primary hover:shadow-lg transition-all"
              >
                <div className="mb-4 text-3xl">⚡</div>
                <h3 className="mb-2 font-semibold group-hover:text-primary transition-colors">
                  Mid-Range Beast
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Excellent 1440p gaming with room for future upgrades.
                </p>
                <span className="text-primary font-medium">~$1,500</span>
              </Link>

              <Link
                href="/build?budget=2500"
                className="group rounded-lg border p-6 hover:border-primary hover:shadow-lg transition-all"
              >
                <div className="mb-4 text-3xl">🚀</div>
                <h3 className="mb-2 font-semibold group-hover:text-primary transition-colors">
                  High-End Gaming
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  4K gaming and content creation powerhouse.
                </p>
                <span className="text-primary font-medium">~$2,500</span>
              </Link>

              <Link
                href="/build?budget=4000"
                className="group rounded-lg border p-6 hover:border-primary hover:shadow-lg transition-all"
              >
                <div className="mb-4 text-3xl">🏆</div>
                <h3 className="mb-2 font-semibold group-hover:text-primary transition-colors">
                  Workstation Pro
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Professional-grade for rendering and development.
                </p>
                <span className="text-primary font-medium">~$4,000+</span>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t bg-primary py-16">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl mb-4">
                Start Building Your Dream PC Today
              </h2>
              <p className="text-lg text-primary-foreground/80 mb-8">
                No more compatibility worries. No more second-guessing. Just
                smart, guided PC building.
              </p>
              <Link
                href="/build"
                className="inline-flex items-center justify-center rounded-md bg-white px-8 py-3 text-base font-medium text-primary shadow-lg hover:bg-gray-100 transition-all hover:shadow-xl"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary" />
              <span className="font-semibold">Spec-Logic</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Built for the Algolia Agent Studio Challenge 2026
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground transition-colors">
                GitHub
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors">
                About
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
