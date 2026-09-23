import React from 'react';
import { getLeadById } from '@/lib/storage';
import { getNicheData } from '@/lib/mockup/templates';
import { notFound } from 'next/navigation';
import { 
  Phone, 
  MapPin, 
  Star, 
  ShieldCheck, 
  Clock, 
  Sparkles, 
  Award, 
  Heart, 
  Activity, 
  CreditCard, 
  DollarSign, 
  FileText,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  Clock,
  DollarSign,
  ShieldCheck,
  FileText,
  Sparkles,
  Heart,
  Activity,
  CreditCard,
  MapPin,
  Award,
  Star,
};

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = await getLeadById(id);

  if (!lead) {
    notFound();
  }

  const nicheData = getNicheData(lead.category, lead.city);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Agency Floating Top Banner */}
      <div className="sticky top-0 z-50 bg-slate-900 text-white px-4 py-2.5 shadow-md flex flex-wrap items-center justify-between border-b border-slate-700 text-sm">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Live Website Preview
          </span>
          <span className="hidden sm:inline text-slate-300">
            Custom engineered for <strong className="text-white">{lead.businessName}</strong>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`tel:${lead.phone}`}
            className="hidden md:inline-flex items-center gap-1 text-slate-300 hover:text-white"
          >
            <Phone className="w-3.5 h-3.5 text-blue-400" />
            {lead.phone}
          </a>
          <button className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3.5 py-1.5 rounded-md transition shadow-sm flex items-center gap-1">
            Claim This Website <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Modern Header / Nav */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
              {lead.businessName.charAt(0)}
            </div>
            <div>
              <div className="text-lg font-bold text-slate-900 leading-tight">{lead.businessName}</div>
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                {lead.city} &amp; Surrounding Areas
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
              <a href="#services" className="hover:text-blue-600 transition">Services</a>
              <a href="#why-us" className="hover:text-blue-600 transition">Why Choose Us</a>
              <a href="#reviews" className="hover:text-blue-600 transition">Reviews ({lead.reviewCount})</a>
              <a href="#contact" className="hover:text-blue-600 transition">Contact</a>
            </div>

            <a
              href={`tel:${lead.phone}`}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-lg shadow-sm hover:shadow transition"
            >
              <Phone className="w-4 h-4" />
              <span>{lead.phone || 'Call Now'}</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-blue-50/50 via-white to-slate-50 py-16 sm:py-24 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                {nicheData.heroBadge}
              </div>

              <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight">
                {nicheData.tagline}
              </h1>

              <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
                Serving homeowners and commercial clients throughout {lead.city}. Rapid response, transparent estimates, and guaranteed quality work by experienced local professionals.
              </p>

              {/* Rating Proof Banner */}
              <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200/80 shadow-sm w-fit">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <span className="text-sm font-bold text-slate-900">{lead.rating} Stars</span>
                <span className="text-xs text-slate-400">|</span>
                <span className="text-xs text-slate-600">Verified Google Reviews</span>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href={`tel:${lead.phone}`}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3.5 rounded-xl shadow-md transition"
                >
                  <Phone className="w-5 h-5" />
                  <span>Call {lead.phone}</span>
                </a>
                <a
                  href="#contact"
                  className="inline-flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-800 font-semibold px-6 py-3.5 rounded-xl border border-slate-300 shadow-sm transition"
                >
                  Request a Free Quote
                </a>
              </div>
            </div>

            {/* Quick Estimate Card */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xl">
                <h3 className="text-xl font-bold text-slate-900 mb-1">Get an Instant Estimate</h3>
                <p className="text-xs text-slate-500 mb-6">Need help in {lead.city}? Fill out this form or call directly.</p>

                <form className="space-y-4" action="#">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Your Name</label>
                    <input
                      type="text"
                      placeholder="e.g. John Smith"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="(555) 000-0000"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Service Needed</label>
                    <select className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                      {nicheData.services.map((s, idx) => (
                        <option key={idx} value={s.title}>{s.title}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow transition"
                  >
                    Submit Request
                  </button>
                  <p className="text-[11px] text-center text-slate-400">
                    🔒 Your information is private and never shared.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features / Why Choose Us */}
      <section id="why-us" className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold text-blue-600 tracking-wider uppercase mb-2">Why Neighbors Trust Us</h2>
            <p className="text-3xl font-extrabold text-slate-900">Built on Reputation, Craft &amp; Reliability</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {nicheData.features.map((feat, i) => {
              const Icon = iconMap[feat.icon] || ShieldCheck;
              return (
                <div key={i} className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:shadow-md transition">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{feat.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold text-blue-600 tracking-wider uppercase mb-2">Our Services</h2>
            <p className="text-3xl font-extrabold text-slate-900">Comprehensive Solutions for {lead.city}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {nicheData.services.map((srv, idx) => (
              <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mb-1.5">{srv.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{srv.desc}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <a href={`tel:${lead.phone}`} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                    Book Service <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Real Customer Reviews Section */}
      <section id="reviews" className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="text-xs font-bold text-blue-600 tracking-wider uppercase mb-2">Real Feedback</h2>
              <p className="text-3xl font-extrabold text-slate-900">What Our Clients Are Saying</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <span className="font-bold text-slate-900">{lead.rating} out of 5 stars</span>
              <span>({lead.reviewCount} reviews)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lead.reviews && lead.reviews.length > 0 ? (
              lead.reviews.map((rev, idx) => (
                <div key={idx} className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
                  <div>
                    <div className="flex text-amber-400 mb-3">
                      {[...Array(Math.min(5, Math.max(1, Math.round(rev.rating || 5))))].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400" />
                      ))}
                    </div>
                    <p className="text-sm text-slate-700 italic mb-4 leading-relaxed">
                      &ldquo;{rev.text}&rdquo;
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-200">
                    <span className="font-semibold text-slate-800">{rev.author}</span>
                    <span>{rev.relativeTime || 'Verified Customer'}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-8 text-slate-500 text-sm">
                Top rated local contractor in {lead.city}.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer / Location & Contact */}
      <footer id="contact" className="bg-slate-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 pb-8 border-b border-slate-800">
            <div>
              <div className="text-xl font-bold mb-2">{lead.businessName}</div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Providing premier {lead.category} services across {lead.city}.
              </p>
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-400" />
                {lead.address}
              </div>
            </div>

            <div>
              <div className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-3">Business Hours</div>
              <ul className="text-xs text-slate-400 space-y-1.5">
                <li>Monday – Friday: 7:00 AM – 7:00 PM</li>
                <li>Saturday: 8:00 AM – 4:00 PM</li>
                <li>Sunday: Emergency Service Only</li>
              </ul>
            </div>

            <div>
              <div className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-3">Direct Contact</div>
              <a
                href={`tel:${lead.phone}`}
                className="inline-flex items-center gap-2 text-lg font-bold text-blue-400 hover:text-blue-300 mb-2"
              >
                <Phone className="w-5 h-5" />
                {lead.phone}
              </a>
              <p className="text-xs text-slate-400">
                Call anytime for quotes or immediate service dispatch.
              </p>
            </div>
          </div>

          <div className="text-center text-xs text-slate-500">
            &copy; {new Date().getFullYear()} {lead.businessName}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
