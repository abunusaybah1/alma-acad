export type NavLink = {
  label: string;
  href: string;
  disabled?: boolean;
  badge?: string;
};

export const studentLinks: NavLink[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Courses", href: "/courses" },
  { label: "AI Assistant", href: "#", disabled: true, badge: "Coming Soon" },
  { label: "Forum", href: "#", disabled: true, badge: "Coming Soon" },

  { label: "Profile", href: "/profile" },
  { label: "Certificates", href: "/certificates" },
  { label: "Contact", href: "/contact" },
];

export const adminLinks: NavLink[] = [
  { label: "Dashboard", href: "/admin" },
  { label: "Manage Courses", href: "/admin/courses" },
  { label: "Analytics", href: "/admin/analytics" },
  { label: "Students", href: "/admin/students" },
];
