import QueryProvider from "@/providers/query-provider";

export const metadata = {
 title:"Multi Vendor Ecommerce",
 description:
 "Marketplace platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
