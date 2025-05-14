
import {
  LayoutDashboard,
  Settings,
  Package,
  Globe,
  Upload,
  Truck,
  Calculator,
  HelpCircle,
  Plus,
  Archive,
  FileText,
  Users,
  BarChart3,
  CreditCard
} from "lucide-react"

export type SidebarNavItem = {
  title: string
  href: string
  disabled?: boolean
  external?: boolean
  icon?: any
  label?: string
}

export type SidebarNavGroup = {
  title: string
  icon?: any
  items: SidebarNavItem[]
}

export type SidebarNav = {
  items: (SidebarNavItem | SidebarNavGroup)[]
}

const sidebarNavItems: SidebarNav = {
  items: [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Analytics",
      href: "/analytics",
      icon: BarChart3,
    },
    {
      title: "Customers",
      href: "/customers",
      icon: Users,
    },
    {
      title: "Invoices",
      href: "/invoices",
      icon: FileText,
    },
    {
      title: "Products",
      href: "/products",
      icon: Package,
    },
    {
      title: "Orders",
      href: "/orders",
      icon: CreditCard,
    },
    {
      title: "Shipments",
      href: "/shipments",
      icon: Truck,
    },
    {
      title: "Returns",
      href: "/returns",
      icon: Archive,
    },
    {
      title: "Disputes",
      href: "/disputes",
      icon: HelpCircle,
    },
    {
      title: "Integrations",
      href: "/integrations",
      icon: Globe,
    },
    {
      title: "Settings",
      href: "/settings",
      icon: Settings,
    },
    {
      title: "Subscription",
      href: "/subscription",
      icon: Plus,
      label: "pro",
    },
    {
      title: "Shipping",
      icon: Truck,
      items: [
        { title: "Create Label", href: "/create-label" },
        { title: "Shipping 2.0", href: "/shipping-two" },
        { title: "Bulk Upload", href: "/bulk-upload" },
        { title: "International", href: "/international" },
      ],
    },
  ],
}

export default sidebarNavItems
