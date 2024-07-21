import React from "react";
import "../styles/global.scss";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Boilerplate app</title>
      </head>
      <body>{children}</body>
    </html>
  );
}
