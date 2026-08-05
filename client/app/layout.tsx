// import QueryProvider from "@/providers/query-provider";
import StoreProvider from "@/providers/store-provider";


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
        <StoreProvider>
          {children}
          {/* <QueryProvider>{children}</QueryProvider> */}
        </StoreProvider>
      </body>
    </html>
  );
}
