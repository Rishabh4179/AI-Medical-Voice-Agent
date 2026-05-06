import React from "react";
import AppHeader from "../dashboard/_components/AppHeader";

function PricingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <AppHeader />
      {children}
    </div>
  );
}

export default PricingLayout;
