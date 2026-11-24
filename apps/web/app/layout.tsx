import "./globals.css";
export const metadata = { title: "ClientSphere CRM", description: "Sales and customer relationship workspace" };
export default function RootLayout({children}:{children:React.ReactNode}) {
 return <html lang="en"><body>{children}</body></html>;
}
