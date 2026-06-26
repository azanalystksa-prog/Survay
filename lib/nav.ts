import type { StringKey } from "./strings";

export interface NavItem {
  href: string;
  labelKey: StringKey;
  icon: string; // lucide icon name
}

export interface NavGroup {
  titleKey: StringKey;
  items: NavItem[];
}

// Full sidebar, grouped per the brief's Section 7. Shown in full so the demo can
// jump between any role's screens; the role switcher changes the active identity.
export const NAV_GROUPS: NavGroup[] = [
  {
    titleKey: "navResearcher",
    items: [
      { href: "/researcher/dashboard", labelKey: "dashboard", icon: "LayoutDashboard" },
      { href: "/researcher/create", labelKey: "createStudy", icon: "FilePlus2" },
      { href: "/researcher/sample", labelKey: "sampleDesigner", icon: "Calculator" },
      { href: "/researcher/ethics", labelKey: "ethicsIrb", icon: "ShieldCheck" },
      { href: "/researcher/monitor", labelKey: "liveMonitor", icon: "Activity" },
      { href: "/researcher/analysis", labelKey: "analysis", icon: "BarChart3" },
      { href: "/researcher/certificate", labelKey: "integrityCertificate", icon: "BadgeCheck" },
      { href: "/researcher/wallet", labelKey: "wallet", icon: "Wallet" },
    ],
  },
  {
    titleKey: "navSupervisor",
    items: [{ href: "/supervisor/oversight", labelKey: "oversight", icon: "Eye" }],
  },
  {
    titleKey: "navParticipant",
    items: [{ href: "/panelist", labelKey: "panelistApp", icon: "Smartphone" }],
  },
  {
    titleKey: "navPanelOps",
    items: [
      { href: "/admin/registry", labelKey: "specialtyRegistry", icon: "BookUser" },
      { href: "/admin/verification", labelKey: "verification", icon: "UserCheck" },
    ],
  },
  {
    titleKey: "navEnterprise",
    items: [{ href: "/enterprise", labelKey: "workplaceInsights", icon: "Building2" }],
  },
];
