"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Button, ButtonProps } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";

interface LogoutButtonProps extends ButtonProps {
  label?: string;
  showIcon?: boolean;
}

export function LogoutButton({ 
  label = "Log out", 
  showIcon = false, 
  variant = "ghost", 
  className,
  ...props 
}: LogoutButtonProps) {
  const [pending, setPending] = useState(false);

  const handleLogout = async () => {
    setPending(true);
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <Button 
      variant={variant} 
      className={className} 
      onClick={handleLogout}
      disabled={pending}
      {...props}
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin mr-2" />
      ) : showIcon ? (
        <LogOut className="size-4 mr-2" />
      ) : null}
      {label}
    </Button>
  );
}
