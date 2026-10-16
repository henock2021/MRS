import Link from "next/link";
import prisma from "@/lib/prisma";
import {
  Trees,
  Compass,
  Binoculars,
  Shovel,
  Sparkles,
  Tent,
  Camera,
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  Calendar,
  CheckCircle2,
} from "lucide-react";

export default async function HomePage() {
  // Fetch active membership types and upcoming events for the public homepage
  const [membershipTypes, upcomingEvents] = await Promise.all([
    prisma.membershipType.findMany({
      where: { isActive: true },
      orderBy: { fee: "asc" },
    }),
    prisma.event.findMany({
      where: { isPublished: true },
      orderBy: { dateTime: "asc" },
      take: 3,
    }),
  ]);

  const activities = [
    {
      icon: Compass,
      title: "Guided Trail Hiking",
      desc: "Traverse breathtaking forest paths, ridges, and waterfalls with seasoned trail leaders for all fitness levels.",
      badge: "Weekly",
    },
    {
      icon: Binoculars,
      title: "Bird Watching & Ornithology",
      desc: "Spot migratory species, learn bird songs, and contribute to citizen science with local wildlife experts.",
      badge: "Dawn Walks",
    },
    {
      icon: Shovel,
      title: "Tree Planting Drives",
      desc: "Help restore native canopy cover and river catchments by planting indigenous saplings each season.",
      badge: "Eco Action",
    },
    {
      icon: Sparkles,
      title: "Clean-up Campaigns",
      desc: "Protect wetlands and forest floors from plastic debris through community litter sweeps and recycling drives.",
      badge: "Stewardship",
    },
    {
      icon: Tent,
      title: "Wilderness Camping",
      desc: "Unplug under starry skies with campfire cooking, basic bushcraft workshops, and family overnight camps.",
      badge: "Overnight",
    },
    {
      icon: GraduationCap,
      title: "Environmental Education",
      desc: "Workshops on climate awareness, soil health, botany, and youth nature clubs in local schools.",
      badge: "Workshops",
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-emerald-900 via-emerald-800 to-emerald-950 text-white py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-700/60 border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm font-medium backdrop-blur">
            <Trees className="w-4 h-4 text-emerald-300" />
            <span>Welcome to the Nature Club Community</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Step Outside. Protect the Wild. <br />
            <span className="text-emerald-300">Discover Nature Together.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-emerald-100/90 leading-relaxed">
            From mountain trail hikes and bird watching walks to tree planting campaigns and stargazing camps,
            we connect people with the natural world and each other.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-bold text-base shadow-lg shadow-emerald-950/20 transition-all transform hover:-translate-y-0.5"
            >
              <span>Join the Club</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="#activities"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-white font-semibold text-base border border-emerald-600/50 backdrop-blur transition-all"
            >
              <span>Explore Activities</span>
            </Link>
          </div>

          {/* Quick Stats Banner */}
          <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-center border-t border-emerald-700/50">
            <div className="p-3">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-300">500+</div>
              <div className="text-xs sm:text-sm text-emerald-200">Trees Planted</div>
            </div>
            <div className="p-3">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-300">65+ km</div>
              <div className="text-xs sm:text-sm text-emerald-200">Trails Explored</div>
            </div>
            <div className="p-3">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-300">100%</div>
              <div className="text-xs sm:text-sm text-emerald-200">Volunteer Led</div>
            </div>
            <div className="p-3">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-300">All Ages</div>
              <div className="text-xs sm:text-sm text-emerald-200">Youth & Adults</div>
            </div>
          </div>
        </div>
      </section>

      {/* Activities Grid */}
      <section id="activities" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-100 px-3 py-1 rounded-full">
            What We Do
          </span>
          <h2 className="text-3xl font-extrabold text-stone-900 tracking-tight">
            Our Club Activities & Adventures
          </h2>
          <p className="text-stone-600 text-sm sm:text-base">
            Every month, our volunteer leaders host guided experiences designed to foster friendship,
            fitness, and environmental stewardship.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((act) => {
            const Icon = act.icon;
            return (
              <div
                key={act.title}
                className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm hover:shadow-md transition-shadow hover:border-emerald-300 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-stone-100 text-stone-700">
                      {act.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-stone-900">{act.title}</h3>
                  <p className="text-sm text-stone-600 leading-relaxed">{act.desc}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-stone-100 flex items-center text-xs font-semibold text-emerald-700">
                  <Link href="/register" className="inline-flex items-center gap-1 hover:underline">
                    Participate as a member <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Upcoming Events Preview */}
      {upcomingEvents.length > 0 && (
        <section className="bg-emerald-50/60 py-16 px-4 sm:px-6 lg:px-8 border-y border-emerald-100">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
              <div>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-100 px-3 py-1 rounded-full">
                  Get Involved
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-2">
                  Upcoming Club Outings
                </h2>
              </div>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800 hover:text-emerald-950"
              >
                Register to attend upcoming events <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {upcomingEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="bg-white rounded-xl p-5 border border-emerald-100 shadow-sm flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold">
                      <span className="uppercase tracking-wide">{ev.eventType}</span>
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                        {ev.fee === 0 ? "Free" : `$${ev.fee}`}
                      </span>
                    </div>
                    <h3 className="font-bold text-base text-stone-900">{ev.title}</h3>
                    <p className="text-xs text-stone-600 line-clamp-2">{ev.description}</p>
                    <div className="pt-2 text-xs text-stone-500 space-y-1">
                      <p className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        {new Date(ev.dateTime).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="text-stone-500">📍 {ev.meetingPoint}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Membership Tiers Overview */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-100 px-3 py-1 rounded-full">
            Transparent Dues
          </span>
          <h2 className="text-3xl font-extrabold text-stone-900">
            Choose Your Membership Tier
          </h2>
          <p className="text-stone-600 text-sm sm:text-base">
            Annual membership dues directly fund trail equipment, tree saplings, safety gear,
            and youth environmental education.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {membershipTypes.map((tier) => (
            <div
              key={tier.id}
              className={`rounded-2xl p-6 flex flex-col justify-between border ${
                tier.name === "Adult"
                  ? "bg-emerald-900 text-white border-emerald-800 ring-2 ring-emerald-500 shadow-md"
                  : "bg-white text-stone-900 border-stone-200 shadow-sm"
              }`}
            >
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className={`font-bold text-lg ${tier.name === "Adult" ? "text-white" : "text-stone-900"}`}>
                    {tier.name}
                  </h3>
                  {tier.name === "Adult" && (
                    <span className="text-[10px] font-bold tracking-wider uppercase bg-emerald-400 text-emerald-950 px-2 py-0.5 rounded-full">
                      Popular
                    </span>
                  )}
                </div>
                <div className="mt-4 mb-4">
                  <span className={`text-3xl font-black ${tier.name === "Adult" ? "text-emerald-300" : "text-emerald-700"}`}>
                    ${tier.fee}
                  </span>
                  <span className={`text-xs ml-1 ${tier.name === "Adult" ? "text-emerald-200" : "text-stone-500"}`}>
                    / {tier.durationDays} days
                  </span>
                </div>
                <p className={`text-xs leading-relaxed ${tier.name === "Adult" ? "text-emerald-100" : "text-stone-600"}`}>
                  {tier.description}
                </p>
                <div className={`mt-6 pt-4 border-t space-y-2 text-xs ${tier.name === "Adult" ? "border-emerald-800 text-emerald-100" : "border-stone-100 text-stone-600"}`}>
                  <p className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Full access to all outings</p>
                  <p className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Official Member ID card</p>
                  <p className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Voting in annual meeting</p>
                </div>
              </div>

              <div className="mt-8">
                <Link
                  href="/register"
                  className={`block w-full py-2.5 text-center text-xs font-bold rounded-xl transition-colors ${
                    tier.name === "Adult"
                      ? "bg-emerald-400 hover:bg-emerald-300 text-emerald-950"
                      : "bg-emerald-700 hover:bg-emerald-800 text-white"
                  }`}
                >
                  Apply as {tier.name}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-stone-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-extrabold tracking-tight">
            Ready to explore nature with us?
          </h2>
          <p className="text-stone-300 max-w-xl mx-auto text-sm sm:text-base">
            It takes just a couple of minutes to fill out the public application form.
            Once approved by our wardens, you’ll receive your unique Nature Club Member ID.
          </p>
          <div className="pt-2">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold shadow-md transition-all transform hover:-translate-y-0.5"
            >
              <span>Start Registration</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
