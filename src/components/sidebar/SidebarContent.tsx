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
} from "lucide-react"

import { Icons } from "@/components/icons"

export type SidebarNavItem = {
  title: string
  href: string
  disabled?: boolean
  external?: boolean
  icon?: keyof typeof Icons
  label?: string
}

export type SidebarNavGroup = {
  title: string
  icon?: keyof typeof Icons
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
      icon: "dashboard",
    },
    {
      title: "Analytics",
      href: "/analytics",
      icon: "analytics",
    },
    {
      title: "Customers",
      href: "/customers",
      icon: "customers",
    },
    {
      title: "Invoices",
      href: "/invoices",
      icon: "invoices",
    },
    {
      title: "Products",
      href: "/products",
      icon: "products",
    },
    {
      title: "Orders",
      href: "/orders",
      icon: "orders",
    },
    {
      title: "Shipments",
      href: "/shipments",
      icon: "shipments",
    },
    {
      title: "Returns",
      href: "/returns",
      icon: "returns",
    },
    {
      title: "Disputes",
      href: "/disputes",
      icon: "disputes",
    },
    {
      title: "Integrations",
      href: "/integrations",
      icon: "integrations",
    },
    {
      title: "Settings",
      href: "/settings",
      icon: "settings",
    },
    {
      title: "Subscription",
      href: "/subscription",
      icon: "subscription",
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
