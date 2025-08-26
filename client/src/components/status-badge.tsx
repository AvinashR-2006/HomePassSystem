import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusStyles = (status: string) => {
    switch (status) {
      case "pending_parent":
        return "bg-amber-100 text-amber-800";
      case "approved":
        return "bg-blue-100 text-blue-800";
      case "issued":
        return "bg-emerald-100 text-emerald-800";
      case "active":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending_parent":
        return "Pending Parent";
      case "approved":
        return "Approved";
      case "issued":
        return "Pass Issued";
      case "active":
        return "Active";
      case "rejected":
        return "Rejected";
      default:
        return status;
    }
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        getStatusStyles(status),
        className
      )}
      data-testid={`status-${status}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}
