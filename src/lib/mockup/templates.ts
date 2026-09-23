export interface NicheTemplateData {
  tagline: string;
  heroBadge: string;
  features: Array<{ title: string; desc: string; icon: string }>;
  services: Array<{ title: string; desc: string }>;
  accentColor: string;
}

export function getNicheData(category: string, city: string): NicheTemplateData {
  const cat = (category || '').toLowerCase();

  if (cat.includes('plumb')) {
    return {
      tagline: `Fast, Reliable & Licensed Plumbing Services in ${city}`,
      heroBadge: 'Emergency 24/7 Service Available',
      features: [
        { title: 'Rapid Response', desc: 'On-site fast to handle burst pipes, leaks, and clogs.', icon: 'Clock' },
        { title: 'Upfront Pricing', desc: 'No surprise fees. Clear estimates before work starts.', icon: 'DollarSign' },
        { title: 'Licensed & Insured', desc: 'Master plumbers backed by our 100% satisfaction guarantee.', icon: 'ShieldCheck' },
      ],
      services: [
        { title: 'Emergency Leak Repair', desc: 'Detect and resolve pipe leaks, pinholes, and slab issues.' },
        { title: 'Drain Cleaning & Hydro-Jetting', desc: 'Clear stubborn sewer blockages and tree root intrusions.' },
        { title: 'Water Heater Installation', desc: 'Tankless & traditional water heater diagnostics and repair.' },
        { title: 'Fixture & Toilet Replacement', desc: 'Modern high-efficiency fixture installations for home & bath.' },
      ],
      accentColor: 'blue',
    };
  }

  if (cat.includes('roof')) {
    return {
      tagline: `Premium Roofing Repair, Replacement & Storm Inspections in ${city}`,
      heroBadge: 'Free 21-Point Roof Inspection',
      features: [
        { title: 'Lifetime Warranties', desc: 'Architectural shingles and metal roofing with lifetime protection.', icon: 'ShieldCheck' },
        { title: 'Insurance Claim Experts', desc: 'We work directly with your insurer for hail and wind damage.', icon: 'FileText' },
        { title: 'Clean Job Guarantee', desc: 'Magnetic sweep of nails and complete cleanup after every job.', icon: 'Sparkles' },
      ],
      services: [
        { title: 'Full Roof Replacement', desc: 'Architectural asphalt, standing seam metal, and flat roofing.' },
        { title: 'Storm & Hail Damage Repair', desc: 'Emergency tarping and comprehensive insurance restoration.' },
        { title: 'Leak Detection & Flashing', desc: 'Precision repair for chimney flashings, skylights, and valleys.' },
        { title: 'Gutter & Fascia Installation', desc: 'Seamless aluminum gutters preventing foundation erosion.' },
      ],
      accentColor: 'amber',
    };
  }

  if (cat.includes('dent') || cat.includes('health') || cat.includes('clinic')) {
    return {
      tagline: `Compassionate, State-of-the-Art Care for You and Your Family in ${city}`,
      heroBadge: 'Now Accepting New Patients',
      features: [
        { title: 'Gentle Care Focus', desc: 'Comfort-first treatments designed for stress-free visits.', icon: 'Heart' },
        { title: 'Modern Technology', desc: 'Digital 3D imaging and low-radiation diagnostics.', icon: 'Activity' },
        { title: 'Flexible Financing', desc: 'In-network with major insurance plans + simple payment options.', icon: 'CreditCard' },
      ],
      services: [
        { title: 'Comprehensive Exams & Cleanings', desc: 'Preventative care, oral cancer screenings, and deep cleanings.' },
        { title: 'Cosmetic & Teeth Whitening', desc: 'Professional brightening and porcelain veneers for your smile.' },
        { title: 'Restorative & Crowns', desc: 'Durable, tooth-colored fillings and same-day dental crowns.' },
        { title: 'Emergency Care', desc: 'Same-day relief for toothaches, chipped teeth, and emergencies.' },
      ],
      accentColor: 'cyan',
    };
  }

  // Default / General Local Service Business
  return {
    tagline: `Your Trusted Local Experts in ${city} — Quality Guaranteed`,
    heroBadge: 'Top-Rated Local Business',
    features: [
      { title: 'Locally Owned & Operated', desc: `Proudly serving home and commercial clients across ${city}.`, icon: 'MapPin' },
      { title: 'Quality Workmanship', desc: 'Experienced professionals dedicated to getting it right the first time.', icon: 'Award' },
      { title: 'Customer Satisfaction', desc: 'Backed by verified 5-star customer reviews and testimonials.', icon: 'Star' },
    ],
    services: [
      { title: 'Residential Services', desc: 'High-quality solutions tailored directly to your home needs.' },
      { title: 'Commercial & Maintenance', desc: 'Ongoing service contracts and commercial installations.' },
      { title: 'Consultations & Estimates', desc: 'Transparent assessments and upfront pricing on every project.' },
      { title: 'Priority Dispatch', desc: 'Fast scheduling to solve your needs without unnecessary delays.' },
    ],
    accentColor: 'indigo',
  };
}
