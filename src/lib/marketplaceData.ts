export interface MarketplaceOffering {
  id: string;
  name: string;
  partner: string;
  firstParty: boolean;
  icon: string;
  tagline: string;
  category: string;
  description: string;
  features: string[];
  availability: string;
  priceLine: string;
}

export const MARKETPLACE_OFFERINGS: MarketplaceOffering[] = [
  {
    id: 'utility-locating',
    name: 'Utility Locating',
    partner: 'SubSurface Solutions',
    firstParty: false,
    icon: 'flash-outline',
    tagline: 'Private utility locates around your work zone',
    category: 'Locating',
    description:
      'SubSurface Solutions provides private utility locating scheduled directly around your work zone and job timeline. GPR and EM locating crews mark underground utilities before crews break ground, with results mapped straight to your job.',
    features: [
      'GPR + electromagnetic locating',
      '48-hour scheduling window',
      'Digital field reports mapped to your job',
      'Ticket management and renewal tracking',
    ],
    availability: 'Available nationwide, subject to crew coverage',
    priceLine: 'From $195 per locate',
  },
  {
    id: 'permit-management',
    name: 'Permit Management',
    partner: 'PermitWorks',
    firstParty: false,
    icon: 'document-text-outline',
    tagline: 'Municipal permits filed and tracked for you',
    category: 'Permitting',
    description:
      'PermitWorks handles municipal right-of-way and lane-closure permit filing and tracking, tied directly to your job\'s traffic control plan. Applications are auto-filled from your job data and tracked through approval.',
    features: [
      'Jurisdiction lookup for every job site',
      'Applications auto-filled from job data',
      'Real-time status tracking',
      'Renewal alerts before permits expire',
    ],
    availability: 'Available in all 50 states',
    priceLine: 'From $85 per permit filing',
  },
  {
    id: 'public-notification',
    name: 'Public Notification',
    partner: 'NotifyRight',
    firstParty: false,
    icon: 'megaphone-outline',
    tagline: 'Resident and business notification campaigns',
    category: 'Notification',
    description:
      'NotifyRight runs resident and business notification campaigns for work zones, combining door hangers with SMS and mail radius campaigns. Multilingual templates keep the community informed before work begins.',
    features: [
      'Door hanger + SMS/mail radius campaigns',
      'Multilingual notification templates',
      'Configurable notification radius per job',
      'Proof-of-notification records for compliance',
    ],
    availability: 'Available in most metro areas',
    priceLine: 'From $0.65 per household notified',
  },
  {
    id: 'leo-coordination',
    name: 'LEO Coordination',
    partner: 'BlueLine Staffing',
    firstParty: false,
    icon: 'shield-checkmark-outline',
    tagline: 'Off-duty officers staffed for traffic posts',
    category: 'Staffing',
    description:
      'BlueLine Staffing schedules verified off-duty law-enforcement officers for traffic control posts on your job. Agency coordination and shift confirmation are handled end to end, with one consolidated invoice.',
    features: [
      'Verified, agency-cleared officers',
      'Direct agency coordination',
      'Shift confirmation before the job starts',
      'Consolidated invoicing across shifts',
    ],
    availability: 'Available in select metro areas',
    priceLine: 'From $75 per officer-hour',
  },
  {
    id: 'equipment-rental',
    name: 'Equipment Rental',
    partner: 'AWP Equipment',
    firstParty: true,
    icon: 'construct-outline',
    tagline: 'Signs, boards, and barriers from AWP yards',
    category: 'Equipment',
    description:
      'Rent signs, stands, arrow boards, message boards, and barriers directly from AWP yards, delivered to your work zone. Everything bills on your existing AWP invoice — no separate rental vendor to manage.',
    features: [
      'Same-day delivery to the work zone',
      'Signs, arrow boards, message boards, and barriers',
      'Billed on your existing AWP invoice',
      'Flexible pickup scheduling when the job wraps',
    ],
    availability: 'Available wherever AWP operates',
    priceLine: 'From $45 per unit per day',
  },
];
